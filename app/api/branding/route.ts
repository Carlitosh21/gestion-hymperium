import { NextResponse } from 'next/server'
import { requireInternalSession } from '@/lib/auth'
import { getBranding, saveBranding } from '@/lib/config-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireInternalSession()
    const branding = await getBranding()
    return NextResponse.json(branding)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error al obtener branding:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener branding' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireInternalSession()
    const body = await request.json()
    const branding = {
      appTitle: body.appTitle,
      appSubtitle: body.appSubtitle,
      logoDataUrl: body.logoDataUrl,
      themeId: body.themeId,
      themeMode: body.themeMode,
      colors: body.colors,
    }
    await saveBranding(branding)
    const updated = await getBranding()
    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error al guardar branding:', error)
    return NextResponse.json(
      { error: error.message || 'Error al guardar branding' },
      { status: 500 }
    )
  }
}
