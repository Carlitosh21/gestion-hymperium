import { Navigation } from '@/components/Navigation'

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
