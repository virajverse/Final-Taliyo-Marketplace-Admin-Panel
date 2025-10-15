import crypto from 'crypto'

const getSecret = () => {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) throw new Error('missing_admin_jwt_secret')
  return secret
}

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
const b64urlDecode = (str) => Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()

const sign = (data, secret) => {
  const h = crypto.createHmac('sha256', secret)
  h.update(data)
  return b64url(h.digest())
}

const serializeCookie = (name, value, options = {}) => {
  const parts = [`${name}=${value}`]
  if (options.maxAge != null) parts.push(`Max-Age=${options.maxAge}`)
  if (options.path) parts.push(`Path=${options.path}`)
  if (options.httpOnly) parts.push('HttpOnly')
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)
  if (options.secure) parts.push('Secure')
  return parts.join('; ')
}

const parseCookies = (req) => {
  const header = req.headers?.cookie || ''
  return header.split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=')
    if (!k) return acc
    acc[k] = v.join('=')
    return acc
  }, {})
}

export const setAuthCookie = (res, payload) => {
  const secret = getSecret()
  const exp = Date.now() + 24 * 60 * 60 * 1000
  const body = { ...payload, exp }
  const data = b64url(JSON.stringify(body))
  const sig = sign(data, secret)
  const token = `${data}.${sig}`
  const cookie = serializeCookie('admin_token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 24 * 60 * 60,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production'
  })
  res.setHeader('Set-Cookie', cookie)
}

export const clearAuthCookie = (res) => {
  const cookie = serializeCookie('admin_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production'
  })
  res.setHeader('Set-Cookie', cookie)
}

export const verifyAuth = (req) => {
  const secret = getSecret()
  const cookies = parseCookies(req)
  const token = cookies['admin_token']
  if (!token) throw new Error('no_token')
  const [data, sig] = token.split('.')
  if (!data || !sig) throw new Error('bad_token')
  const expect = sign(data, secret)
  if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect)) === false) throw new Error('bad_sig')
  const payload = JSON.parse(b64urlDecode(data))
  if (!payload.exp || Date.now() > payload.exp) throw new Error('expired')
  return payload
}

export const requireAdmin = (req, res) => {
  try {
    const payload = verifyAuth(req)
    const email = payload?.email
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
    if (!email || !adminEmail || email !== adminEmail) throw new Error('unauthorized')
    return payload
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' })
    return null
  }
}
