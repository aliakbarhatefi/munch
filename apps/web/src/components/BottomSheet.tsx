import { useEffect, useRef, useState } from 'react'
import type { DealToday } from '../types'

type Props = {
  deals: DealToday[]
  desktop?: boolean
}

export default function BottomSheet({ deals, desktop = false }: Props) {
  const [open, setOpen] = useState(desktop) // desktop always open
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (desktop) setOpen(true)
  }, [desktop])

  return (
    <div
      ref={sheetRef}
      className={
        desktop
          ? 'rounded-2xl bg-white shadow p-2'
          : `fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300
             ${open ? 'translate-y-0' : 'translate-y-[65%]'}`
      }
    >
      <div
        className={`mx-auto max-w-6xl ${
          desktop ? '' : 'bg-white/95 backdrop-blur rounded-t-2xl shadow-lg'
        }`}
      >
        {/* Drag handle / toggle (mobile only) */}
        {!desktop && (
          <button
            className="w-full flex items-center justify-center py-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle list"
          >
            <span className="h-1.5 w-12 bg-slate-300 rounded-full" />
          </button>
        )}

        {/* Deal list */}
        <ul
          className={`divide-y ${desktop ? '' : 'max-h-[40vh] overflow-auto'}`}
          aria-label="Deals list"
        >
          {deals.map((d) => (
            <li
              key={d.deal_id}
              className="p-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">
                    {d.title} <span className="opacity-70">· {d.name}</span>
                  </div>
                  <div className="text-sm opacity-80">
                    {d.address}, {d.city}
                  </div>
                  <div className="text-xs opacity-60">
                    {d.start_time}–{d.end_time} • {d.cuisine_tags.join(', ')}
                  </div>
                </div>
                <div className="self-start text-sm px-2 py-1 rounded-xl bg-black text-white">
                  {formatDiscount(d)}
                </div>
              </div>
            </li>
          ))}
          {deals.length === 0 && (
            <li className="p-3 text-sm opacity-70">No deals found.</li>
          )}
        </ul>
      </div>
    </div>
  )
}

/* ---------------- helpers ---------------- */

function formatDiscount(d: DealToday) {
  if (d.discount_type === 'PERCENT') return `${d.discount_value}%`
  if (d.discount_type === 'FIXED') return `$${d.discount_value}`
  return d.discount_type
}
