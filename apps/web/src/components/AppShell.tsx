import React from 'react'

export default function AppShell({
  header,
  filters,
  map,
  sheet,
}: {
  header: React.ReactNode
  filters: React.ReactNode
  map: React.ReactNode
  sheet: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        {header}
      </header>
      <div className="sticky top-[56px] z-30 bg-white/85 backdrop-blur border-b">
        {filters}
      </div>
      <main className="relative">{map}</main>
      {sheet}
    </div>
  )
}
