import { supabase } from '../lib/supabaseClient'
import { ENV, isDevRuntime } from '../lib/env'

class EmailService {
  constructor() {
    this.useSupabaseEdgeFunction = ENV.USE_SUPABASE_EMAIL === true
    this.smtpConfig = {
      host: ENV.SMTP_HOST,
      port: ENV.SMTP_PORT,
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASS
    }
  }

  async sendEmailViaSupabase(emailData) {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: emailData.to,
        cc: emailData.cc,
        bcc: emailData.bcc,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        from: emailData.from || 'noreply@yourdomain.com',
        replyTo: emailData.replyTo,
        attachments: emailData.attachments
      }
    })
    if (error) throw error
    return data
  }

  async sendEmailViaSMTP(emailData) {
    const getCsrf = () => { try { return document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '' } catch { return '' } }
    const response = await fetch('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() },
      body: JSON.stringify({ ...emailData, smtpConfig: this.smtpConfig })
    })
    if (!response.ok) throw new Error('SMTP service unavailable')
    return await response.json()
  }

  async sendEmail(emailData) {
    this.validateEmailData(emailData)
    const isDev = isDevRuntime
    // Prefer configured path, but fall back if it fails and alternative is available
    if (this.useSupabaseEdgeFunction) {
      try {
        return await this.sendEmailViaSupabase(emailData)
      } catch (e) {
        // Fallback to SMTP if configured
        const hasSmtp = !!(this.smtpConfig.host && this.smtpConfig.user && this.smtpConfig.pass)
        if (hasSmtp && !isDev) {
          return await this.sendEmailViaSMTP(emailData)
        }
        throw e
      }
    } else {
      try {
        if (!isDev) return await this.sendEmailViaSMTP(emailData)
        // In dev, if SMTP is not configured, simulate success
        return { success: true, simulated: true }
      } catch (e) {
        // Fallback to Supabase function if enabled in env
        try {
          return await this.sendEmailViaSupabase(emailData)
        } catch {
          throw e
        }
      }
    }
  }

  validateEmailData(emailData) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const to = Array.isArray(emailData.to) ? emailData.to : (emailData.to ? [emailData.to] : [])
    const cc = Array.isArray(emailData.cc) ? emailData.cc : (emailData.cc ? [emailData.cc] : [])
    const bcc = Array.isArray(emailData.bcc) ? emailData.bcc : (emailData.bcc ? [emailData.bcc] : [])
    if (!(to.length || cc.length || bcc.length)) throw new Error('At least one recipient (to/cc/bcc) is required')
    if (!emailData.subject) throw new Error('Email subject is required')
    if (!emailData.html && !emailData.text) throw new Error('Email content (html or text) is required')
    for (const addr of [...to, ...cc, ...bcc]) { if (!emailRegex.test(addr)) throw new Error(`Invalid email: ${addr}`) }
  }
}

export default new EmailService()
