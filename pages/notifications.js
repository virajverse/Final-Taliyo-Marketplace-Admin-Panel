import { useEffect, useMemo, useState, useCallback } from 'react'
import { Mail, Bell, Plus, Trash2, Send, Search, Settings } from 'lucide-react'
import notificationAPI from '../services/notificationServiceWrapper'
import emailService from '../services/emailService'
import { supabase } from '../lib/supabaseClient'
import { ENV } from '../lib/env'
import ModernLayout from '../components/ModernLayout'

function SectionHeader({ title, actions }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  )
}

const Notifications = ({ user }) => {
  const [activeTab, setActiveTab] = useState('notifications') // notifications | campaigns | emails
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [notifications, setNotifications] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [emailLogs, setEmailLogs] = useState([])
  const [search, setSearch] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [newNotif, setNewNotif] = useState({ title: '', message: '', recipients: 'all', type: 'info', channels: ['email'], scheduled_at: '' })

  const [showEmail, setShowEmail] = useState(false)
  const [emailForm, setEmailForm] = useState({ from: (ENV.FROM_EMAIL) || 'noreply@yourdomain.com', toText: '', subject: '', message: '' })
  const [emailSending, setEmailSending] = useState(false)

  const fromAliases = [
    ENV.FROM_EMAIL,
    ENV.RESEND_FROM_SUPPORT,
    ENV.RESEND_FROM_UPDATES,
    ENV.RESEND_FROM_NEWUSER
  ].filter(Boolean)
  const aliasLookup = useMemo(() => new Set(fromAliases.map(a => a.toLowerCase())), [fromAliases.join(',')])

  const parseList = (text) => (text || '').split(/[\s,;]+/).map(s => s.trim()).filter(Boolean)

  const loadAll = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const [notifs, camps] = await Promise.all([
        notificationAPI.getNotifications(),
        notificationAPI.getCampaigns()
      ])
      setNotifications(notifs || [])
      setCampaigns(camps || [])
    } catch (e) {
      setError(e?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadEmails = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('email_logs').select('*').order('sent_at', { ascending: false })
      if (error) throw error
      const mapped = (data || []).map(x => ({ ...x, status: aliasLookup.has((x.from_email || '').toLowerCase()) ? 'sent' : (x.status || 'sent') }))
      setEmailLogs(mapped)
    } catch (e) {
      console.warn('email logs load error:', e?.message || e)
    }
  }, [aliasLookup])

  useEffect(() => { if (user) { loadAll(); loadEmails() } }, [user, loadAll, loadEmails])

  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel('notifications-module-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_logs' }, () => loadEmails())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user, loadAll, loadEmails])

  const filteredNotifications = useMemo(() => {
    const q = search.toLowerCase()
    return (notifications || []).filter(n => ((n.title || '').toLowerCase().includes(q) || ((n.message || n.body || '').toLowerCase().includes(q))))
  }, [notifications, search])

  const filteredCampaigns = useMemo(() => {
    const q = search.toLowerCase()
    return (campaigns || []).filter(c => ((c.name || '').toLowerCase().includes(q) || (c.subject || '').toLowerCase().includes(q)))
  }, [campaigns, search])

  const filteredEmails = useMemo(() => {
    const q = search.toLowerCase()
    return (emailLogs || []).filter(e => (e.subject || '').toLowerCase().includes(q) || (e.from_email || '').toLowerCase().includes(q) || (e.text_content || '').toLowerCase().includes(q))
  }, [emailLogs, search])

  const createNotification = async (e) => {
    e?.preventDefault?.()
    try {
      const created = await notificationAPI.createNotification(newNotif)
      setNotifications(prev => [created, ...prev])
      setShowCreate(false)
      setNewNotif({ title: '', message: '', recipients: 'all', type: 'info', channels: ['email'], scheduled_at: '' })
    } catch (err) {
      alert(err?.message || 'Failed to create notification')
    }
  }

  const deleteItem = async (item, type) => {
    if (!confirm('Delete this item?')) return
    try {
      if (type === 'notification') { await notificationAPI.deleteNotification(item.id); setNotifications(prev => prev.filter(n => n.id !== item.id)) }
      else { await notificationAPI.deleteCampaign(item.id); setCampaigns(prev => prev.filter(c => c.id !== item.id)) }
    } catch (err) {
      alert(err?.message || 'Delete failed')
    }
  }

  const sendQuickEmail = async (e) => {
    e?.preventDefault?.()
    setEmailSending(true)
    try {
      const to = parseList(emailForm.toText)
      await emailService.sendEmail({ from: emailForm.from, to, subject: emailForm.subject, html: `<div>${(emailForm.message || '').replace(/\n/g, '<br/>')}</div>`, text: emailForm.message || '' })
      try {
        const { data: userData } = await supabase.auth.getUser()
        await supabase.from('email_logs').insert([{ from_email: emailForm.from, to_emails: to, subject: emailForm.subject, text_content: emailForm.message || '', html_content: `<div>${(emailForm.message || '').replace(/\n/g, '<br/>')}</div>`, sent_by: userData?.user?.id || null }])
      } catch {}
      setShowEmail(false)
      setEmailForm({ from: emailForm.from, toText: '', subject: '', message: '' })
      loadEmails()
    } catch (err) {
      alert(err?.message || 'Email send failed')
    } finally {
      setEmailSending(false)
    }
  }

  if (!user) return null

  return (
    <ModernLayout user={user}>
      <div className="space-y-6">
        <div className="bg-white border-b rounded-lg">
          <div className="px-4 py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications & Communication</h1>
              <p className="text-gray-600">Create notifications, send quick emails, and review history.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className={`px-3 py-2 rounded-lg border ${activeTab==='notifications'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`} onClick={() => setActiveTab('notifications')}><Bell className="inline w-4 h-4 mr-1"/>Notifications</button>
              <button className={`px-3 py-2 rounded-lg border ${activeTab==='campaigns'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`} onClick={() => setActiveTab('campaigns')}><Send className="inline w-4 h-4 mr-1"/>Campaigns</button>
              <button className={`px-3 py-2 rounded-lg border ${activeTab==='emails'?'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700'}`} onClick={() => setActiveTab('emails')}><Mail className="inline w-4 h-4 mr-1"/>Emails</button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <button onClick={() => setShowCreate(true)} className="px-3 py-2 rounded-lg bg-blue-600 text-white flex items-center"><Plus className="w-4 h-4 mr-1"/>New Notification</button>
            <button onClick={() => setShowEmail(true)} className="px-3 py-2 rounded-lg bg-green-600 text-white flex items-center"><Mail className="w-4 h-4 mr-1"/>Quick Email</button>
            <a href="/settings" className="px-3 py-2 rounded-lg bg-gray-600 text-white flex items-center"><Settings className="w-4 h-4 mr-1"/>Settings</a>
          </div>

          {error && <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>}

          {activeTab === 'notifications' && (
            <div>
              <SectionHeader title="Notifications" />
              {loading ? (
                <div className="text-gray-600">Loading...</div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredNotifications.map(n => (
                    <div key={n.id} className="bg-white border rounded-lg p-4 flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{n.title || 'Untitled'}</div>
                        <div className="text-sm text-gray-600">{n.message || n.body || ''}</div>
                        <div className="text-xs text-gray-500 mt-1">{n.status || 'sent'} • {new Date(n.created_at || n.sent_at || Date.now()).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => deleteItem(n, 'notification')} className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 flex items-center"><Trash2 className="w-4 h-4 mr-1"/>Delete</button>
                      </div>
                    </div>
                  ))}
                  {!filteredNotifications.length && <div className="text-gray-600">No notifications found</div>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div>
              <SectionHeader title="Campaigns" />
              {loading ? (
                <div className="text-gray-600">Loading...</div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredCampaigns.map(c => (
                    <div key={c.id} className="bg-white border rounded-lg p-4 flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">{c.name || 'Untitled'}</div>
                        <div className="text-sm text-gray-600">{c.subject || ''}</div>
                        <div className="text-xs text-gray-500 mt-1">{c.status || 'draft'} • {new Date(c.created_at || c.sent_at || Date.now()).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => deleteItem(c, 'campaign')} className="px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 flex items-center"><Trash2 className="w-4 h-4 mr-1"/>Delete</button>
                      </div>
                    </div>
                  ))}
                  {!filteredCampaigns.length && <div className="text-gray-600">No campaigns found</div>}
                </div>
              )}
            </div>
          )}

          {activeTab === 'emails' && (
            <div>
              <SectionHeader title="Emails" />
              <div className="grid grid-cols-1 gap-3">
                {filteredEmails.map(log => (
                  <div key={log.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-900">{log.subject || '(no subject)'}</div>
                      <div className="text-xs text-gray-500">{new Date(log.sent_at || Date.now()).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-gray-600">From: {log.from_email}</div>
                    <div className="text-sm text-gray-600">To: {(log.to_emails||[]).join(', ')}</div>
                    {log.text_content && <div className="text-sm text-gray-700 mt-2 line-clamp-2">{log.text_content}</div>}
                  </div>
                ))}
                {!filteredEmails.length && <div className="text-gray-600">No emails found</div>}
              </div>
            </div>
          )}
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-lg p-5">
              <div className="text-lg font-semibold mb-3">New Notification</div>
              <form onSubmit={createNotification} className="space-y-3">
                <div>
                  <label className="text-sm text-gray-700">Title</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2" value={newNotif.title} onChange={e=>setNewNotif(v=>({...v,title:e.target.value}))} required />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Message</label>
                  <textarea className="mt-1 w-full border rounded-lg px-3 py-2" rows={4} value={newNotif.message} onChange={e=>setNewNotif(v=>({...v,message:e.target.value}))} />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={()=>setShowCreate(false)} className="px-3 py-2 rounded-lg border">Cancel</button>
                  <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white flex items-center"><Send className="w-4 h-4 mr-1"/>Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEmail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-lg p-5">
              <div className="text-lg font-semibold mb-3">Quick Email</div>
              <form onSubmit={sendQuickEmail} className="space-y-3">
                <div>
                  <label className="text-sm text-gray-700">From</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2" value={emailForm.from} onChange={e=>setEmailForm(v=>({...v,from:e.target.value}))} placeholder="noreply@yourdomain.com" />
                </div>
                <div>
                  <label className="text-sm text-gray-700">To (comma/space separated)</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2" value={emailForm.toText} onChange={e=>setEmailForm(v=>({...v,toText:e.target.value}))} placeholder="user1@ex.com user2@ex.com" />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Subject</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2" value={emailForm.subject} onChange={e=>setEmailForm(v=>({...v,subject:e.target.value}))} required />
                </div>
                <div>
                  <label className="text-sm text-gray-700">Message</label>
                  <textarea className="mt-1 w-full border rounded-lg px-3 py-2" rows={5} value={emailForm.message} onChange={e=>setEmailForm(v=>({...v,message:e.target.value}))} />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={()=>setShowEmail(false)} className="px-3 py-2 rounded-lg border" disabled={emailSending}>Cancel</button>
                  <button type="submit" className="px-3 py-2 rounded-lg bg-green-600 text-white flex items-center disabled:opacity-50" disabled={emailSending}><Mail className="w-4 h-4 mr-1"/>{emailSending? 'Sending...' : 'Send'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  )
}

export default Notifications
