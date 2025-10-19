import nodemailer from 'nodemailer'
import { supabaseAdmin } from '../../lib/supabaseClient'

function getAllowedFrom() {
  const set = new Set()
  const vals = [
    process.env.NEXT_PUBLIC_FROM_EMAIL,
    process.env.NEXT_PUBLIC_RESEND_FROM_SUPPORT,
    process.env.NEXT_PUBLIC_RESEND_FROM_UPDATES,
    process.env.NEXT_PUBLIC_RESEND_FROM_NEWUSER,
    process.env.FROM_EMAIL,
    process.env.RESEND_FROM_SUPPORT,
    process.env.RESEND_FROM_UPDATES,
    process.env.RESEND_FROM_NEWUSER,
  ]
  for (const v of vals) if (v) set.add(String(v).toLowerCase())
  return set
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
}

function pickSmtpConfig() {
  const host = process.env.SMTP_HOST || process.env.NEXT_PUBLIC_SMTP_HOST
  const portStr = process.env.SMTP_PORT || process.env.NEXT_PUBLIC_SMTP_PORT
  const user = process.env.SMTP_USER || process.env.NEXT_PUBLIC_SMTP_USER
  const pass = process.env.SMTP_PASS || process.env.NEXT_PUBLIC_SMTP_PASS
  const port = portStr ? Number(portStr) : 587
  const secure = port === 465
  if (!host || !user || !pass) throw new Error('SMTP not configured')
  return { host, port, secure, auth: { user, pass } }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const body = req.body || {}
    const to = Array.isArray(body.to) ? body.to : (body.to ? [body.to] : [])
    const cc = Array.isArray(body.cc) ? body.cc : (body.cc ? [body.cc] : [])
    const bcc = Array.isArray(body.bcc) ? body.bcc : (body.bcc ? [body.bcc] : [])
    const from = String(body.from || process.env.NEXT_PUBLIC_FROM_EMAIL || process.env.FROM_EMAIL || '').trim()
    const subject = String(body.subject || '').trim()
    const html = body.html || ''
    const text = body.text || ''
    const replyTo = body.replyTo || undefined

    if (!(to.length || cc.length || bcc.length)) throw new Error('At least one of to/cc/bcc required')
    if (!subject) throw new Error('Subject is required')

    // Enforce allowed from addresses if configured
    const allowed = getAllowedFrom()
    if (allowed.size && (!from || !allowed.has(from.toLowerCase()))) {
      return res.status(400).json({ error: 'From address not allowed' })
    }

    const transporter = nodemailer.createTransport(pickSmtpConfig())

    const attachments = Array.isArray(body.attachments) ? body.attachments.map(a => {
      if (a.content_base64) {
        return {
          filename: a.filename || 'attachment',
          content: Buffer.from(a.content_base64, 'base64'),
          contentType: a.contentType || 'application/octet-stream',
        }
      }
      return a
    }) : undefined

    const info = await transporter.sendMail({
      from,
      to: to.length ? to : undefined,
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      subject,
      html: html || undefined,
      text: text || undefined,
      replyTo,
      attachments,
    })

    // Do not log here; the page already logs via /api/email-logs
    return res.status(200).json({ success: true, messageId: info.messageId })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Failed to send email' })
  }
}
