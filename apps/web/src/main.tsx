import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ⬇️ add this
import { APIProvider } from '@vis.gl/react-google-maps'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {apiKey ? (
      <APIProvider apiKey={apiKey}>
        <App />
      </APIProvider>
    ) : (
      <div style={{ padding: 24, color: '#b91c1c' }}>
        <h1>Google Maps API key missing</h1>
        <p>
          Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in{' '}
          <code>apps/web/.env</code> and restart the dev server.
        </p>
      </div>
    )}
  </React.StrictMode>
)
