import { supabase } from '../lib/supabaseClient'
import { isDevRuntime } from '../lib/env'
import emailService from './emailService'
const isDev = isDevRuntime

class NotificationService {
  async getNotifications(filters = {}) {
    try {
      if (isDev) {
        const raw = localStorage.getItem('dev.notifications') || '[]'
        try { return JSON.parse(raw) } catch { return [] }
      }
      const params = new URLSearchParams()
      if (filters.status) params.set('status', String(filters.status))
      if (filters.type) params.set('type', String(filters.type))
      if (filters.search) params.set('search', String(filters.search))
      if (filters.createdBy) params.set('createdBy', String(filters.createdBy))
      const res = await fetch(`/api/notifications${params.toString() ? `?${params.toString()}` : ''}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch notifications')
      return Array.isArray(json) ? json : []
    } catch (error) {
      console.error('Get notifications error:', error)
      throw new Error(error.message || 'Failed to fetch notifications')
    }
  }

  async getNotification(id) {
    try {
      if (isDev) {
        const raw = localStorage.getItem('dev.notifications') || '[]';
        try { const list = JSON.parse(raw); return list.find(n => n.id === id) || null } catch { return null }
      }
      const { data, error } = await supabase.from('notifications').select('*').eq('id', id).single()
      if (error) throw error
      return data
    } catch (error) {
      console.error('Get notification error:', error)
      throw new Error(error.message || 'Failed to fetch notification')
    }
  }

  async createNotification(notificationData) {
    try {
      if (isDev) {
        const raw = localStorage.getItem('dev.notifications') || '[]';
        let list; try { list = JSON.parse(raw); } catch { list = []; }
        const id = Date.now().toString(); const now = new Date().toISOString();
        const item = { id, title: notificationData.title, body: notificationData.message, type: notificationData.type || 'info', channels: notificationData.channels || ['email'], status: notificationData.scheduled_at ? 'scheduled' : 'sent', created_at: now, scheduled_at: notificationData.scheduled_at || null };
        list.unshift(item); localStorage.setItem('dev.notifications', JSON.stringify(list)); return item;
      }
      let data, error
      try {
        const res = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notificationData)
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Failed to create notification')
        data = json
      } catch (e) {
        error = e
      }
      if (error) throw error
      if (!notificationData.scheduled_at) await this.sendNotification(data.id, notificationData)
      return data
    } catch (error) {
      console.error('Create notification error:', error)
      throw new Error(error.message || 'Failed to create notification')
    }
  }

  async updateNotification(id, updates) {
    try {
      if (isDev) {
        const raw = localStorage.getItem('dev.notifications') || '[]';
        let list; try { list = JSON.parse(raw); } catch { list = []; }
        const idx = list.findIndex(n => n.id === id); if (idx === -1) throw new Error('Not found');
        list[idx] = { ...list[idx], ...updates }; localStorage.setItem('dev.notifications', JSON.stringify(list)); return list[idx];
      }
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to update notification')
      return json
    } catch (error) {
      console.error('Update notification error:', error)
      throw new Error(error.message || 'Failed to update notification')
    }
  }

  async deleteNotification(id) {
    try {
      if (isDev) {
        const raw = localStorage.getItem('dev.notifications') || '[]';
        let list; try { list = JSON.parse(raw); } catch { list = []; }
        const next = list.filter(n => n.id !== id); localStorage.setItem('dev.notifications', JSON.stringify(next)); return true;
      }
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Failed to delete notification')
      return true
    } catch (error) {
      console.error('Delete notification error:', error)
      throw new Error(error.message || 'Failed to delete notification')
    }
  }

  async sendNotification(id, fallback = {}) {
    try {
      if (isDev) {
        const raw = localStorage.getItem('dev.notifications') || '[]';
        let list; try { list = JSON.parse(raw); } catch { list = []; }
        const idx = list.findIndex(n => n.id === id); if (idx === -1) throw new Error('Not found');
        const updated = { ...list[idx], status: 'sent', sent_at: new Date().toISOString(), recipients_count: Array.isArray(list[idx].recipients) ? list[idx].recipients.length : 0, read_count: 0, click_count: 0 };
        list[idx] = updated; localStorage.setItem('dev.notifications', JSON.stringify(list)); return updated;
      }
      const notification = await this.getNotification(id)
      const safeMessage = notification.message ?? notification.body ?? fallback.message ?? ''
      const notif = { ...notification, message: safeMessage }
      if (notification.status === 'sent') throw new Error('Notification already sent')

      const recipientsCriteria = (notification.recipients ?? fallback.recipients ?? 'all')
      const channels = (Array.isArray(notification.channels) && notification.channels.length) ? notification.channels : (fallback.channels && fallback.channels.length ? fallback.channels : ['email'])
      const recipients = await this.getRecipients(recipientsCriteria)

      let sentCount = 0
      if (channels.includes('email')) { const emailResult = await this.sendEmailNotification(notif, recipients); sentCount += emailResult.sent }

      try {
        const { data: upd } = await supabase.from('notifications').update({ status: 'sent', sent_at: new Date().toISOString(), recipients_count: recipients.length }).eq('id', id).select().single()
        return upd || notification
      } catch {
        return notif
      }
    } catch (error) {
      console.error('Send notification error:', error)
      try { await supabase.from('notifications').update({ status: 'failed' }).eq('id', id) } catch {}
      throw new Error(error.message || 'Failed to send notification')
    }
  }

  async sendEmailNotification(notification, recipients) {
    try {
      const emailRecipients = recipients.filter(r => r.email)
      if (emailRecipients.length === 0) return { sent: 0, failed: 0 }
      const emailData = { subject: notification.title, html: this.formatNotificationHTML(notification), text: notification.message || notification.body || '' }
      let sent = 0, failed = 0
      for (const recipient of emailRecipients) {
        try { await emailService.sendEmail({ to: recipient.email, ...emailData }); sent++ } catch { failed++ }
      }
      return { sent, failed }
    } catch (error) {
      console.error('Send email notification error:', error)
      return { sent: 0, failed: recipients.length }
    }
  }

  async getRecipients(recipientCriteria) {
    try {
      let recipients = []
      if (Array.isArray(recipientCriteria)) {
        try {
          const { data } = await supabase.from('profiles').select('id, full_name, email, phone').in('id', recipientCriteria)
          recipients = data || []
        } catch (e) {
          console.warn('[recipients] profiles table not available or query failed:', e?.message || e)
          recipients = []
        }
      } else {
        switch (recipientCriteria) {
          case 'all': {
            try {
              const { data } = await supabase.from('profiles').select('id, full_name, email, phone').eq('is_active', true)
              recipients = data || []
            } catch (e) {
              console.warn('[recipients] profiles(all) not available:', e?.message || e)
              recipients = []
            }
            break
          }
          case 'team': {
            try {
              const { data } = await supabase.from('profiles').select('id, full_name, email, phone').eq('is_active', true).neq('role', 'client')
              recipients = data || []
            } catch (e) {
              console.warn('[recipients] profiles(team) not available:', e?.message || e)
              recipients = []
            }
            break
          }
          case 'clients': {
            try {
              const { data } = await supabase.from('clients').select('id, name as full_name, email, phone').eq('status', 'active')
              recipients = data || []
            } catch (e) {
              console.warn('[recipients] clients table not available:', e?.message || e)
              recipients = []
            }
            break
          }
          case 'subscribers': {
            try {
              const { data } = await supabase.from('subscribers').select('id, email').eq('is_active', true)
              recipients = (data || []).map(s => ({ id: s.id, full_name: s.email, email: s.email, phone: null }))
            } catch (e) {
              console.warn('[recipients] subscribers table not available:', e?.message || e)
              recipients = []
            }
            break
          }
          default:
            recipients = []
        }
      }
      return recipients
    } catch (error) {
      console.error('Get recipients error:', error)
      throw new Error(error.message || 'Failed to get recipients')
    }
  }

  formatNotificationHTML(notification) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${notification.title}</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; line-height: 1.6; color: #333; margin: 0;">
              ${(notification.message || notification.body || '').replace(/\n/g, '<br>')}
            </p>
          </div>
        </div>
      </div>
    `
  }

  async getCampaigns(filters = {}) {
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', String(filters.status))
      if (filters.type) params.set('type', String(filters.type))
      if (filters.search) params.set('search', String(filters.search))
      const res = await fetch(`/api/campaigns${params.toString() ? `?${params.toString()}` : ''}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch campaigns')
      return Array.isArray(json) ? json : []
    } catch (error) {
      console.error('Get campaigns error:', error)
      throw new Error(error.message || 'Failed to fetch campaigns')
    }
  }

  async createCampaign(campaignData) {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignData)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error || 'Failed to create campaign')
    return json
  }

  async updateCampaign(id, updates) {
    const res = await fetch(`/api/campaigns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error || 'Failed to update campaign')
    return json
  }

  async deleteCampaign(id) {
    const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || 'Failed to delete campaign')
    return true
  }
}

export default new NotificationService()
