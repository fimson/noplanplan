import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Wishlist from '../components/Wishlist';

function PlanWishlistPage() {
  const { tripId } = useParams();
  
  const [planDetails] = useState({
    id: tripId,
    title: tripId === 'japan-2025' ? 'Japan Trip 2025' : 'Travel Plan'
  });

  return (
    <div className="plan-wishlist-page">
      <div className="d-flex flex-column align-items-center mb-4">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-center text-gray-100 mt-6 mb-2">
            So where we go?
          </h1>
          <div className="mt-2">
            <Link to={`/trip/${tripId}`} className="btn btn-sm btn-outline-secondary me-2">
              Overview
            </Link>
            <Link to={`/trip/${tripId}/bookings`} className="btn btn-sm btn-outline-secondary me-2">
              Bookings
            </Link>
            <Link to={`/trip/${tripId}/planning`} className="btn btn-sm btn-outline-secondary">
              Planning
            </Link>
          </div>
        </div>
      </div>
      
      <Wishlist planId={tripId} />
    </div>
  );
}

export default PlanWishlistPage; 