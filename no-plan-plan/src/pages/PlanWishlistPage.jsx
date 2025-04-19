import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Wishlist from '../components/Wishlist';

function PlanWishlistPage() {
  const { planId } = useParams();
  
  const [planDetails] = useState({
    id: planId,
    title: planId === 'japan-2025' ? 'Japan Trip 2025' : 'Travel Plan'
  });

  return (
    <div className="plan-wishlist-page">
      <div className="d-flex flex-column align-items-center mb-4">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-center text-gray-100 mt-6 mb-2">
            So where we go?
          </h1>
          <div className="mt-2">
            <Link to={`/plan/${planId}`} className="btn btn-sm btn-outline-secondary me-2">
              Overview
            </Link>
            <Link to={`/plan/${planId}/bookings`} className="btn btn-sm btn-outline-secondary me-2">
              Bookings
            </Link>
            <Link to={`/plan/${planId}/planning`} className="btn btn-sm btn-outline-secondary">
              Planning
            </Link>
          </div>
        </div>
      </div>
      
      <Wishlist planId={planId} />
    </div>
  );
}

export default PlanWishlistPage; 