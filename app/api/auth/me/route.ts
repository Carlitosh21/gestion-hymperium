import { NextResponse } from 'next/server'
import { getInternalUserFromSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await getInternalUserFromSession()
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        roleName: user.roleName,
        permissions: user.permissions,
      },
    })
  } catch (error: any) {
    console.error('Error en /api/auth/me:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
