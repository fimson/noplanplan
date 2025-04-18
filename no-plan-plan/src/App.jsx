import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootswatch/dist/slate/bootstrap.min.css'

// Import pages
import HomePage from './pages/HomePage'
import PlanPage from './pages/PlanPage'
import PlanningPage from './pages/PlanningPage'
import PlanWishlistPage from './pages/PlanWishlistPage'

function App() {
  return (
    <Router>
      <div className="container py-4">
        <header className="pb-3 mb-4 border-bottom">
          <Link to="/" className="text-decoration-none">
            <h1 className="fw-bold">NoPlanPlan</h1>
          </Link>
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/plan/:planId" element={<PlanPage />} />
            <Route path="/plan/:planId/planning" element={<PlanningPage />} />
            <Route path="/plan/:planId/wishlist" element={<PlanWishlistPage />} />
          </Routes>
        </main>
        
        <footer className="pt-3 mt-4 text-muted border-top">
          &copy; 2024 NoPlanPlan
        </footer>
      </div>
    </Router>
  )
}

export default App
