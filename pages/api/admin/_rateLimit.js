const buckets = new Map()

const getIp = (req) => {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim()
  const xr = req.headers['x-real-ip']
  if (typeof xr === 'string' && xr.length) return xr
  return req.socket?.remoteAddress || 'unknown'
}

export const rateLimit = (req, res, key, limit, windowMs) => {
  const ip = getIp(req)
  const k = `${key}:${ip}`
  const now = Date.now()
  let arr = buckets.get(k) || []
  arr = arr.filter(ts => now - ts < windowMs)
  if (arr.length >= limit) {
    res.status(429).json({ error: 'rate_limited' })
    return false
  }
  arr.push(now)
  buckets.set(k, arr)
  return true
}
