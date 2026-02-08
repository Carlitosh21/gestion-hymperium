import { NextResponse } from 'next/server'
import { getCurrentSession, deleteSession } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const session = await getCurrentSession()
    if (session) {
      await deleteSession(session.token)
    }

    // Eliminar cookie
    const cookieStore = await cookies()
    cookieStore.delete('gh_session')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error en logout portal:', error)
    return NextResponse.json(
      { error: error.message || 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
