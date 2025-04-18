import { useState } from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const [plans, setPlans] = useState([
    {
      id: 'japan-2025',
      title: 'Japan Trip 2025',
      description: 'Celebrating Yoki\'s birthday in the land of the rising sun',
      image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1000&auto=format&fit=crop',
      
    },
    {
      id: 'iceland-2026',
      title: 'Iceland  2026',
      description: 'Northern lights, glaciers, hot springs, and volcanic landscapes',
      image: 'https://media.cntraveler.com/photos/60748e5ed1058698d13c31ee/16:9/w_1920%2Cc_limit/Vatnajokull-Iceland-GettyImages-655074449.jpg',
    }
  ]);

  const [newPlan, setNewPlan] = useState({
    title: '',
    description: ''
  });
  
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleCreatePlan = () => {
    if (!newPlan.title.trim()) return;
    
    const id = newPlan.title.toLowerCase().replace(/\s+/g, '-');
    
    const plan = {
      id,
      title: newPlan.title,
      description: newPlan.description || 'No description provided',
      image: `https://source.unsplash.com/featured/?travel,${encodeURIComponent(newPlan.title)}`,
      createdAt: new Date().toISOString()
    };
    
    setPlans([plan, ...plans]);
    setNewPlan({ title: '', description: '' });
    setShowForm(false);
  };

  const handleDeletePlan = (planId) => {
    setPlans(plans.filter(plan => plan.id !== planId));
    setShowDeleteConfirm(null);
  };

  // Determine column classes based on number of plans
  const getColumnClass = () => {
    if (plans.length === 1) {
      return "col-md-8 col-lg-6 mx-auto"; // Single centered card
    } else if (plans.length === 2) {
      return "col-md-6"; // Two cards per row
    } else if (plans.length === 3) {
      return "col-lg-4 col-md-6 col-12"; // Three cards per row on large screens
    } else {
      return "col-lg-3 col-md-6 col-12"; // Four cards per row on large screens
    }
  };

  return (
    <div className="home-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">My Travel Plans</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Create New Plan'}
        </button>
      </div>
      
      {showForm && (
        <div className="card bg-dark mb-4">
          <div className="card-body">
            <input
              type="text"
              className="form-control mb-3"
              value={newPlan.title}
              onChange={(e) => setNewPlan({...newPlan, title: e.target.value})}
              placeholder="Plan Title"
            />
            
            <textarea
              className="form-control mb-3"
              value={newPlan.description}
              onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
              placeholder="Plan Description (optional)"
              rows="2"
            />
            
            <div className="d-flex justify-content-end">
              <button 
                onClick={handleCreatePlan} 
                className="btn btn-primary"
                disabled={!newPlan.title.trim()}
              >
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}
      
      {plans.length > 0 ? (
        <div className="row g-4">
          {plans.map((plan) => (
            <div key={plan.id} className={getColumnClass()}>
              <div className="card h-100">
                {showDeleteConfirm === plan.id && (
                  <div className="delete-confirm-overlay">
                    <div className="delete-confirm-dialog">
                      <p>Delete "{plan.title}"?</p>
                      <div className="d-flex gap-2 justify-content-center">
                        <button 
                          className="btn btn-danger" 
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          Delete
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => setShowDeleteConfirm(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {plan.image && (
                  <div className="card-img-top-wrapper" style={{ height: plans.length === 1 ? '300px' : '180px', overflow: 'hidden' }}>
                    <img 
                      src={plan.image} 
                      className="card-img-top"
                      alt={plan.title}
                      style={{ objectFit: 'cover', height: '100%', width: '100%' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x300/222/666?text=Plan+Image';
                      }} 
                    />
                  </div>
                )}
                
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <h5 className={`card-title ${plans.length > 1 ? 'text-truncate' : ''}`}>
                      <Link to={`/plan/${plan.id}`} className="text-info">
                        {plan.title}
                      </Link>
                    </h5>
                    <button 
                      className="btn btn-sm btn-outline-danger" 
                      onClick={() => setShowDeleteConfirm(plan.id)}
                      aria-label="Delete plan"
                    >
                      <span>🗑️</span>
                    </button>
                  </div>
                  <p className={plans.length > 1 ? "card-text description-text" : "card-text"}>
                    {plan.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info text-center">
          No travel plans yet. Create your first plan to get started!
        </div>
      )}

      <style jsx>{`
        .description-text {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 0.9rem;
        }
        
        .delete-confirm-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: calc(0.375rem - 1px);
        }
        
        .delete-confirm-dialog {
          padding: 1rem;
          text-align: center;
          color: white;
        }
      `}</style>
    </div>
  );
}

export default HomePage; 