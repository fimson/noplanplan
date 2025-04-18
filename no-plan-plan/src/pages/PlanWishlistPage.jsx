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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold">{planDetails.title}</h2>
          <div className="mt-2">
            <Link to={`/plan/${planId}`} className="btn btn-sm btn-outline-secondary me-2">
              Overview
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