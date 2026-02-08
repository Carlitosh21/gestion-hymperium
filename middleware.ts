import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession, hasAdmin } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Rutas públicas (sin autenticación)
  const publicRoutes = [
    '/login',
    '/setup',
    '/portal/login',
    '/estadisticas/onboarding',
  ]

  const publicApiRoutes = [
    '/api/auth/setup',
    '/api/auth/login',
    '/api/estadisticas/onboarding/preguntas',
    '/api/estadisticas/onboarding/submit',
  ]

  // Permitir /api/migrate solo si no hay admin (setup inicial)
  if (pathname === '/api/migrate') {
    const adminExists = await hasAdmin()
    if (adminExists) {
      // Si ya hay admin, requiere autenticación
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      try {
        const session = await getSession(token)
        if (!session || session.kind !== 'internal' || !session.internal_user_id) {
          return NextResponse.redirect(new URL('/login', request.url))
        }
      } catch (error) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
    // Si no hay admin, permitir acceso para setup inicial
    return NextResponse.next()
  }

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

  // Rutas del portal (requieren sesión de cliente)
  if (pathname.startsWith('/portal')) {
    if (!token) {
      return NextResponse.redirect(new URL('/portal/login', request.url))
    }
    try {
      const session = await getSession(token)
      if (!session || session.kind !== 'client' || !session.cliente_id) {
        return NextResponse.redirect(new URL('/portal/login', request.url))
      }
      return NextResponse.next()
    } catch (error) {
      return NextResponse.redirect(new URL('/portal/login', request.url))
    }
  }

  // Rutas internas (requieren sesión interna)
  if (pathname.startsWith('/api/') || pathname === '/' || 
      pathname.startsWith('/ventas') || pathname.startsWith('/clientes') ||
      pathname.startsWith('/estadisticas') || pathname.startsWith('/proyecciones') ||
      pathname.startsWith('/gestion-interna')) {
    
    // Verificar si existe admin
    const adminExists = await hasAdmin()
    if (!adminExists) {
      return NextResponse.redirect(new URL('/setup', request.url))
    }

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const session = await getSession(token)
      if (!session || session.kind !== 'internal' || !session.internal_user_id) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.next()
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
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
