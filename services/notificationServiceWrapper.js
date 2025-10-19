import notificationService from './notificationService'
import { isDevRuntime } from '../lib/env'

const isDev = isDevRuntime
const DEV_CAMP_KEY = 'dev.campaigns'

function read(key) { try { const raw = localStorage.getItem(key) || '[]'; const list = JSON.parse(raw); return Array.isArray(list) ? list : [] } catch { return [] } }
function write(key, list) { try { localStorage.setItem(key, JSON.stringify(list)) } catch {} }

const wrapper = {
  async getNotifications(filters = {}) { return notificationService.getNotifications(filters) },
  async getNotification(id) { return notificationService.getNotification(id) },
  async createNotification(data) { return notificationService.createNotification(data) },
  async updateNotification(id, updates) { return notificationService.updateNotification(id, updates) },
  async deleteNotification(id) { return notificationService.deleteNotification(id) },
  async sendNotification(id) { return notificationService.sendNotification(id) },

  async getCampaigns(filters = {}) {
    if (isDev) {
      let list = read(DEV_CAMP_KEY)
      if (filters.status) list = list.filter(c => c.status === filters.status)
      if (filters.type) list = list.filter(c => c.type === filters.type)
      if (filters.search) {
        const q = String(filters.search).toLowerCase()
        list = list.filter(c => ((c.name||'').toLowerCase().includes(q) || (c.subject||'').toLowerCase().includes(q)))
      }
      list.sort((a,b) => new Date(b.created_at || b.sent_at || b.scheduled_at || 0) - new Date(a.created_at || a.sent_at || a.scheduled_at || 0))
      return list
    }
    return notificationService.getCampaigns(filters)
  },

  async createCampaign(data) {
    if (isDev) {
      const now = new Date().toISOString()
      const item = {
        id: Date.now().toString(),
        name: data.name || '',
        subject: data.subject || '',
        type: data.type || 'newsletter',
        status: data.status || (data.scheduled_at ? 'scheduled' : 'draft'),
        recipients_count: Number(data.recipients_count) || 0,
        channels: data.channels || ['email'],
        scheduled_at: data.scheduled_at || null,
        sent_at: data.sent_at || null,
        open_rate: Number(data.open_rate) || 0,
        click_rate: Number(data.click_rate) || 0,
        created_at: now
      }
      const list = read(DEV_CAMP_KEY)
      list.unshift(item)
      write(DEV_CAMP_KEY, list)
      return item
    }
    return notificationService.createCampaign(data)
  },

  async updateCampaign(id, updates) {
    if (isDev) {
      const list = read(DEV_CAMP_KEY)
      const idx = list.findIndex(c => c.id === id)
      if (idx === -1) throw new Error('Not found')
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() }
      write(DEV_CAMP_KEY, list)
      return list[idx]
    }
    return notificationService.updateCampaign(id, updates)
  },

  async deleteCampaign(id) {
    if (isDev) {
      const next = read(DEV_CAMP_KEY).filter(c => c.id !== id)
      write(DEV_CAMP_KEY, next)
      return true
    }
    return notificationService.deleteCampaign(id)
  }
}

export default wrapper
