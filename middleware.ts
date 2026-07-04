import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Protect admin routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!token) {
      const loginUrl = new URL('/svci-admin-secure-login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user has admin role
    if (token.role !== 'SUPER_ADMIN' && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/svci-admin-secure-login', req.url))
    }
  }

  // Redirect old login page to new secure login
  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/svci-admin-secure-login', req.url))
  }

  // Redirect old register page to new secure register
  if (pathname === '/admin/register') {
    return NextResponse.redirect(new URL('/svci-admin-register', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin/login',
    '/admin/register',
  ],
}
