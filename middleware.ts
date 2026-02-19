import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rutas públicas (sin autenticación)
  const publicRoutes = [
    '/login',
    '/setup',
    '/onboarding',
    '/portal/login',
    '/estadisticas/onboarding',
  ]

  const publicApiRoutes = [
    '/api/auth/setup',
    '/api/auth/login',
    '/api/auth/me',
    '/api/onboarding/validate-id',
    '/api/onboarding/preguntas',
    '/api/onboarding/submit',
    '/api/portal/login',
    '/api/estadisticas/onboarding/preguntas',
    '/api/estadisticas/onboarding/submit',
  ]

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Si es una API pública, permitir acceso
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Leer cookie directamente del request
  const token = request.cookies.get('gh_session')?.value

  // Rutas del portal (requieren cookie de sesión - validación real en API handlers)
  if (pathname.startsWith('/portal') && pathname !== '/portal/login') {
    if (!token) {
      return NextResponse.redirect(new URL('/portal/login', request.url))
    }
    return NextResponse.next()
  }

  // Rutas internas (requieren cookie de sesión - validación real en layouts y API handlers)
  if (pathname.startsWith('/api/') || pathname === '/' || 
      pathname.startsWith('/ventas') || pathname.startsWith('/clientes') ||
      pathname.startsWith('/estadisticas') || pathname.startsWith('/proyecciones') ||
      pathname.startsWith('/gestion-interna')) {
    
    // Excluir /api/migrate - se protege en su propio handler
    if (pathname === '/api/migrate') {
      return NextResponse.next()
    }

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
