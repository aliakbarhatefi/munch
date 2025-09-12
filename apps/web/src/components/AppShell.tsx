import { ReactNode } from 'react'

export default function AppShell({
  header,
  filters,
  map,
  sheet,
}: {
  header: ReactNode
  filters: ReactNode
  map: ReactNode
  sheet: ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full border-b bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3">{header}</div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        <div className="sticky top-2 z-20">{filters}</div>

        <section className="relative z-0">
          <div className="rounded-2xl overflow-hidden shadow">{map}</div>
        </section>

        <section className="relative z-10">{sheet}</section>
      </main>
    </div>
  )
}
