import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootswatch/dist/slate/bootstrap.min.css'

// Import pages
import HomePage from './pages/HomePage'
import PlanPage from './pages/PlanPage'
import PlanningPage from './pages/PlanningPage'
import PlanWishlistPage from './pages/PlanWishlistPage'
import BookingsPage from './pages/BookingsPage'

function HeaderWithBackButton() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  // Check if we're on a trip subpage (planning, wishlist, bookings)
  const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
  const isTripSubpage = pathSegments.length > 2 && pathSegments[0] === 'plan';
  const planId = isTripSubpage ? pathSegments[1] : null;
  
  let backLinkText = "← Back to all trips";
  let backLinkUrl = "/";
  
  if (isTripSubpage) {
    backLinkText = "← Back to trip";
    backLinkUrl = `/plan/${planId}`;
  }
  
  return (
    <header className="pb-3 mb-4 border-bottom position-relative">
      {!isHomePage && (
        <Link to={backLinkUrl} className="position-absolute text-gray-400 back-link">
          {backLinkText}
        </Link>
      )}
      <div className="text-center">
        <Link to="/" className="text-decoration-none">
          <h3 className="fw-bold">NoPlanPlan</h3>
        </Link>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <div className="container py-4">
        <HeaderWithBackButton />
        
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/plan/:planId" element={<PlanPage />} />
            <Route path="/plan/:planId/planning" element={<PlanningPage />} />
            <Route path="/plan/:planId/wishlist" element={<PlanWishlistPage />} />
            <Route path="/plan/:planId/bookings" element={<BookingsPage />} />
          </Routes>
        </main>
        
        <footer className="pt-3 mt-4 text-muted border-top">
          &copy; 2024 NoPlanPlan
        </footer>
      </div>
      
      <style jsx global>{`
        .back-link {
          top: 0;
          left: 0;
          font-size: 0.9rem;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        
        .back-link:hover {
          color: #e2e8f0;
          text-decoration: underline;
        }
      `}</style>
    </Router>
  )
}

export default App
