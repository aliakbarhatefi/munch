import React from 'react'

export default function Header({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
      <div className="text-xl font-bold">Munch</div>
      <div className="flex-1">{children /* PlaceAutocomplete fits here */}</div>
      <nav className="flex items-center gap-2">
        <button className="btn btn-secondary">Favorites</button>
        <button className="btn btn-primary">Sign in</button>
      </nav>
    </div>
  )
}
