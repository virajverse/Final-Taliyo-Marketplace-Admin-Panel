// Email sending Edge Function for Supabase (Resend provider)
// Copy this into your Supabase project's functions as `send-email`

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEFAULT_ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

function getCorsHeaders(req) {
  const origin = req.headers.get('origin') || req.headers.get('Origin') || ''
  const allowsAll = DEFAULT_ALLOWED_ORIGINS.includes('*')
  let allowOrigin = allowsAll ? '*' : ''
  let allowCredentials = false
  if (!allowsAll) {
    if (origin && DEFAULT_ALLOWED_ORIGINS.includes(origin)) {
      allowOrigin = origin
      allowCredentials = true
    } else if (DEFAULT_ALLOWED_ORIGINS.length > 0) {
      allowOrigin = DEFAULT_ALLOWED_ORIGINS[0]
    } else {
      allowOrigin = '*'
    }
  }
  const headers = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
    'Vary': 'Origin'
  }
  if (allowCredentials) headers['Access-Control-Allow-Credentials'] = 'true'
  return headers
}

function resolveFromAddress(requested) {
  const defaultFrom = Deno.env.get('FROM_DEFAULT') || 'noreply@yourdomain.com'
  const allowed = (Deno.env.get('ALLOWED_FROM_EMAILS') || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  const from = (requested || defaultFrom).toLowerCase()
  if (allowed.length > 0 && !allowed.includes(from)) {
    throw new Error('From address not allowed')
  }
  return from
}

async function sendWithResend(emailData) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) throw new Error('Resend API key not configured')
  const payload = {
    from: resolveFromAddress(emailData.from),
    to: Array.isArray(emailData.to) ? emailData.to : (emailData.to ? [emailData.to] : undefined),
    cc: Array.isArray(emailData.cc) ? emailData.cc : (emailData.cc ? [emailData.cc] : undefined),
    bcc: Array.isArray(emailData.bcc) ? emailData.bcc : (emailData.bcc ? [emailData.bcc] : undefined),
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text,
    reply_to: emailData.replyTo,
    attachments: emailData.attachments
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`Resend API error: ${await response.text()}`)
  const result = await response.json()
  return { success: true, messageId: result.id || `resend_${Date.now()}`, service: 'resend' }
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } })
    }
    const emailData = await req.json()
    const hasTo = !!emailData.to && (Array.isArray(emailData.to) ? emailData.to.length > 0 : true)
    const hasCc = !!emailData.cc && (Array.isArray(emailData.cc) ? emailData.cc.length > 0 : true)
    const hasBcc = !!emailData.bcc && (Array.isArray(emailData.bcc) ? emailData.bcc.length > 0 : true)
    if (!(hasTo || hasCc || hasBcc) || !emailData.subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields: at least one of to/cc/bcc, and subject' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } })
    }

    const result = await sendWithResend(emailData)

    // Optional: log email
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (supabaseUrl && supabaseServiceRoleKey) {
        const admin = createClient(supabaseUrl, supabaseServiceRoleKey)
        const fromEmail = resolveFromAddress(emailData.from)
        const toList = Array.isArray(emailData.to) ? emailData.to : (emailData.to ? [emailData.to] : [])
        const ccList = Array.isArray(emailData.cc) ? emailData.cc : (emailData.cc ? [emailData.cc] : [])
        const bccList = Array.isArray(emailData.bcc) ? emailData.bcc : (emailData.bcc ? [emailData.bcc] : [])
        await admin.from('email_logs').insert([{ from_email: fromEmail, to_emails: toList, cc_emails: ccList, bcc_emails: bccList, subject: emailData.subject, text_content: emailData.text || null, html_content: emailData.html || null, message_id: result.messageId }])
      }
    } catch (e) { console.error('Email log error:', e) }

    return new Response(JSON.stringify(result), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Email function error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
