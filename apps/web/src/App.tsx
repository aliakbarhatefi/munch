import { useEffect, useState } from 'react'

type Restaurant = {
  id: number
  name: string
  city: string
  address: string
  lat: number
  lng: number
  price_range: string | null
  cuisine_tags: string[]
  rating: number | null
  reviews_count: number
}

export default function App() {
  const [items, setItems] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:4000/v1/restaurants?city=Milton')
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Munch — Milton</h1>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="p-4 rounded-xl shadow border">
              <div className="flex justify-between">
                <h3 className="text-lg font-semibold">{r.name}</h3>
                <span className="text-sm opacity-70">
                  {r.price_range ?? ''}
                </span>
              </div>
              <p className="text-sm opacity-80">
                {r.address}, {r.city}
              </p>
              <p className="text-sm mt-1">
                Cuisine: {r.cuisine_tags.join(', ')}
              </p>
              <p className="text-sm opacity-80">
                Rating: {r.rating ?? '—'} ({r.reviews_count})
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
