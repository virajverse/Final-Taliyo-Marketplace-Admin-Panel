import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('missing_env')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const getIp = (req) => {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim()
  const xr = req.headers['x-real-ip']
  if (typeof xr === 'string' && xr.length) return xr
  return req.socket?.remoteAddress || null
}

export const auditAction = async (req, adminPayload, action, table_name, record_id, old_values, new_values) => {
  try {
    const supabase = getAdminClient()
    const user_agent = req.headers['user-agent'] || null
    const ip_address = getIp(req)

    await supabase.from('audit_logs').insert([
      {
        action,
        table_name,
        record_id: record_id || null,
        old_values: old_values ? JSON.stringify(old_values) : null,
        new_values: new_values ? JSON.stringify(new_values) : null,
        ip_address,
        user_agent
      }
    ])
  } catch (e) {
    // Do not crash the main request on audit failure
  }
}
