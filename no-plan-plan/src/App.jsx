import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
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
import GuidePage from './components/GuidePage'
import AboutTripPage from './pages/AboutTripPage'
import ClaimPage from './pages/ClaimPage'

function HeaderWithBackButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';
  
  const { user, signIn, signOut } = useAuth();
  
  // Check if we're on a guide page
  const isGuidePage = location.pathname.includes('/guide/') || location.pathname.includes('/about');
  
  const handleBack = () => {
    // Extract the current path and navigate up one hierarchy level
    const currentPath = location.pathname;
    
    // Remove trailing slash if it exists
    const path = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath;
    
    // Find the last slash to determine the parent path
    const lastSlashIndex = path.lastIndexOf('/');
    
    if (lastSlashIndex <= 0) {
      // If we're already at the root or only one level deep, go to home
      navigate('/');
    } else {
      // Navigate to the parent path
      const parentPath = path.substring(0, lastSlashIndex);
      navigate(parentPath);
    }
  };
  
  return (
    <header className="pb-3 mb-4 border-bottom position-relative d-flex flex-column flex-md-row align-items-center justify-content-between">
      {!isHomePage && !isGuidePage && (
        <button 
          onClick={handleBack} 
          className="btn btn-link position-absolute text-gray-400 back-link"
          title="Go up one level"
        >
          &larr;
        </button>
      )}
      <div className="text-center flex-grow-1">
        <Link to="/" className="text-decoration-none">
          <h3 className="fw-bold">NoPlanPlan</h3>
        </Link>
      </div>
      <div className="auth-controls mt-2 mt-md-0">
        {user ? (
          <div className="d-flex align-items-center gap-2">
            {user.photoURL && (
              <img src={user.photoURL} alt="avatar" width={32} height={32} className="rounded-circle" />
            )}
            <span className="text-light small">{user.displayName || user.email}</span>
            <button className="btn btn-sm btn-outline-light" onClick={signOut}>Logout</button>
          </div>
        ) : (
          <button className="btn btn-sm btn-primary" onClick={signIn}>Login</button>
        )}
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
            <Route path="/trip/:tripId" element={<PlanPage />} />
            <Route path="/trip/:tripId/planning" element={<PlanningPage />} />
            <Route path="/trip/:tripId/wishlist" element={<PlanWishlistPage />} />
            <Route path="/trip/:tripId/wishlist/:itemId/guide" element={<GuidePage />} />
            <Route path="/trip/:tripId/bookings" element={<BookingsPage />} />
            <Route path="/trip/:tripId/about" element={<AboutTripPage />} />
            <Route path="/trip/:tripId/guide/:itemId" element={<GuidePage />} />
            <Route path="/claim/:code" element={<ClaimPage />} />
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
          font-size: 1.2rem;
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.2s ease;
          background: none;
          border: none;
          padding: 0.5rem 1rem;
        }
        
        .back-link:hover {
          color: #e2e8f0;
        }
      `}</style>
    </Router>
  )
}

export default App
