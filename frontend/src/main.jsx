import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AppProvider } from './context/AppContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>
)
