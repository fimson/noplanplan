import { useState } from 'react'
import './App.css'
import Wishlist from './components/Wishlist'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootswatch/dist/slate/bootstrap.min.css'

function App() {
  return (
    <div className="container py-4">
      <header className="pb-3 mb-4 border-bottom">
        <h1 className="fw-bold">NoPlanPlan</h1>
      </header>
      
      <main>
        <Wishlist />
      </main>
      
      <footer className="pt-3 mt-4 text-muted border-top">
        &copy; 2024 NoPlanPlan
      </footer>
    </div>
  )
}

export default App
