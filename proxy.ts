import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // This updates the local request cookies so any further logic has the updated values
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          supabaseResponse = NextResponse.next({
            request,
          })

          // This safely sets cookies in the actual response output
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const url = request.nextUrl.clone()

  // Exact requirements
  const privateRoutes = [
    '/dashboard',
    '/inventory',
    '/customers',
    '/orders',
    '/suppliers',
    '/reports',
    '/settings',
    '/profile',
  ]
  // Camera pages are public (phone doesn't have admin session)
  const isCameraRoute = url.pathname.startsWith('/camera')
  const isPrivateRoute = !isCameraRoute && privateRoutes.some((route) => url.pathname.startsWith(route))
  const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/register') || url.pathname === '/auth'
  const hasAuthCookie = request.cookies
    .getAll()
    .some(({ name }) => name.includes('-auth-token'))

  let user: unknown = null
  let authCheckFailed = false
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    user = session?.user || null
  } catch {
    authCheckFailed = true
    console.warn('Proxy auth warning: failed to verify user session')
  }

  if (isPrivateRoute && !user && !(authCheckFailed && hasAuthCookie)) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
