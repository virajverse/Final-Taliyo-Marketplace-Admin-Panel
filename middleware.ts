import { NextRequest, NextResponse } from 'next/server'

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/assets')
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Ensure a CSRF token cookie exists (double-submit cookie pattern)
  const csrfCookie = req.cookies.get('csrf_token')?.value
  let res: NextResponse | null = null
  if (!csrfCookie) {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    res = NextResponse.next()
    res.cookies.set('csrf_token', token, {
      httpOnly: false, // readable by client JS to send back in header
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    })
  }

  // Allow public routes
  if (
    pathname === '/login' ||
    isStaticAsset(pathname) ||
    pathname.startsWith('/api/admin/auth/login') ||
    pathname.startsWith('/api/admin/auth/logout')
  ) {
    return res || NextResponse.next()
  }

  // Enforce CSRF for admin API writes (double-submit cookie)
  if (
    pathname.startsWith('/api/admin') &&
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    // allow auth endpoints to be called for bootstrap
    !pathname.startsWith('/api/admin/auth/login') &&
    !pathname.startsWith('/api/admin/auth/logout')
  ) {
    const header = req.headers.get('x-csrf-token') || ''
    const cookie = req.cookies.get('csrf_token')?.value || ''
    if (!header || !cookie || header !== cookie) {
      return new NextResponse(
        JSON.stringify({ error: 'csrf_failed' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  // Protect all other admin routes (pages and APIs)
  if (!pathname.startsWith('/api')) {
    // Page request: verify admin via internal API
    try {
      const url = new URL('/api/admin/auth/me', req.url)
      const meRes = await fetch(url, {
        headers: { cookie: req.headers.get('cookie') || '' },
        cache: 'no-store'
      })
      if (meRes.ok) {
        return res || NextResponse.next()
      }
    } catch {}
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(loginUrl)
  }

  return res || NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
