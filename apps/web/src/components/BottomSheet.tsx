import React from 'react'

export default function BottomSheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title?: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/30 transition ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className={`absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-lg transition-transform duration-300 will-change-transform ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto max-w-6xl p-3">
          <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-300 mb-2" />
          {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
          <div className="max-h-[42vh] md:max-h-[48vh] overflow-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
