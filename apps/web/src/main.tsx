import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Root element is defined in apps/web/index.html
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
