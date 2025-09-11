import { ReactNode } from 'react'

/**
 * Layout with 4 explicit slots:
 * - header  : top bar
 * - filters : search/filters bar (sticky)
 * - map     : the map container
 * - sheet   : list / bottom sheet
 */
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
      {/* Header */}
      <div className="w-full border-b bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3">{header}</div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Sticky filter bar */}
        <div className="sticky top-2 z-20">{filters}</div>

        {/* Map */}
        <section className="relative z-0">
          <div className="rounded-2xl overflow-hidden shadow">{map}</div>
        </section>

        {/* List / sheet */}
        <section className="relative z-10">{sheet}</section>
      </main>
    </div>
  )
}
