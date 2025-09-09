import { useEffect, useRef, useState } from 'react'
import type { DealToday } from '../types'
import { asDealsArray } from '../types'

export default function BottomSheet({
  deals,
  desktop = false,
}: {
  deals: unknown
  desktop?: boolean
}) {
  const list = asDealsArray(deals)
  const [open, setOpen] = useState(desktop)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!desktop) setOpen(true)
  }, [desktop])

  return (
    <div
      ref={sheetRef}
      className={
        desktop
          ? 'rounded-2xl bg-white shadow p-2'
          : `fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300
             ${open ? 'translate-y-0' : 'translate-y-[70%]'}`
      }
    >
      <div
        className={`mx-auto ${desktop ? '' : 'bg-white/95 backdrop-blur rounded-t-2xl shadow'} max-w-6xl`}
      >
        {!desktop && (
          <button
            className="w-full flex items-center justify-center py-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle list"
          >
            <span className="h-1.5 w-12 bg-slate-300 rounded-full" />
          </button>
        )}

        <ul
          className={`divide-y ${desktop ? '' : 'max-h-[40vh] overflow-auto'}`}
        >
          {list.map((d: DealToday) => (
            <li key={d.deal_id} className="p-3 hover:bg-slate-50">
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
                  {d.discount_type === 'PERCENT'
                    ? `${d.discount_value}%`
                    : d.discount_type === 'FIXED'
                      ? `$${d.discount_value}`
                      : d.discount_type}
                </div>
              </div>
            </li>
          ))}
          {list.length === 0 && (
            <li className="p-3 text-sm opacity-70">No deals found.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
