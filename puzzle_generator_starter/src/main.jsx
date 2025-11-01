import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRouter from './AppRouter'

const root = document.getElementById('root')
createRoot(root).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
)
