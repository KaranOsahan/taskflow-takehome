import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  // Remove React.StrictMode during development with react-beautiful-dnd/hello-pangea-dnd
  // because strict mode can cause duplicate renders breaking the draggable references.
  <App />
)
