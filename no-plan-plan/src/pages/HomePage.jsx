import { useState } from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const [plans, setPlans] = useState([
    {
      id: 'japan-2025',
      title: 'Japan Trip 2025',
      description: 'Celebrating Yoki\'s birthday in the land of the rising sun',
      image: 'https://www.thetrainline.com/cmsmedia/cms/7709/japan_2x.jpg',
      category: 'Birthday'
    },
    {
      id: 'iceland-2026',
      title: 'Iceland  2026',
      description: 'Northern lights, glaciers, hot springs, and volcanic landscapes',
      image: 'https://media.cntraveler.com/photos/60748e5ed1058698d13c31ee/16:9/w_1920%2Cc_limit/Vatnajokull-Iceland-GettyImages-655074449.jpg',
      category: 'Nature'
    }
  ]);

  const [newPlan, setNewPlan] = useState({
    title: '',
    description: '',
    category: ''
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
      createdAt: new Date().toISOString(),
      category: newPlan.category || 'Travel'
    };
    
    setPlans([plan, ...plans]);
    setNewPlan({ title: '', description: '', category: '' });
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
    <div className="home-page text-center">
      <div className="d-flex justify-content-center align-items-center mb-4 flex-column">
        <h2 className="display-4 fw-semibold main-title mb-2">My Travel Plans</h2>
        <p className="tagline mb-4">NoPlanPlan — We have a plan. Sort of.</p>
      </div>
      
      {showForm && (
        <div className="card bg-dark mb-4 mx-auto" style={{ maxWidth: '800px' }}>
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
            
            <select
              className="form-select mb-3"
              value={newPlan.category}
              onChange={(e) => setNewPlan({...newPlan, category: e.target.value})}
            >
              <option value="">Select Category (optional)</option>
              <option value="Travel">Travel</option>
              <option value="Nature">Nature</option>
              <option value="Birthday">Birthday</option>
              <option value="Adventure">Adventure</option>
              <option value="Honeymoon">Honeymoon</option>
              <option value="Family">Family</option>
            </select>
            
            <div className="d-flex justify-content-center">
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
        <div className="row g-4 justify-content-center">
          {plans.map((plan) => (
            <div key={plan.id} className={getColumnClass()}>
              <div className="card h-100 plan-card">
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
                  <div className="card-img-wrapper" style={{ height: plans.length === 1 ? '300px' : '180px', overflow: 'hidden' }}>
                    <img 
                      src={plan.image} 
                      className="card-img"
                      alt={plan.title}
                      style={{ objectFit: 'cover', height: '100%', width: '100%' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/400x300/222/666?text=Plan+Image';
                      }} 
                    />
                    {plan.category && (
                      <span className="category-badge">{plan.category}</span>
                    )}
                  </div>
                )}
                
                <div className="card-body text-center">
                  <div className="d-flex justify-content-center align-items-start">
                    <h5 className={`card-title modern-title ${plans.length > 1 ? 'text-truncate' : ''} w-100 text-center`}>
                      <Link to={`/plan/${plan.id}`} className="text-info">
                        {plan.title}
                      </Link>
                    </h5>
                  </div>
                  <p className={`${plans.length > 1 ? "card-text description-text" : "card-text"} modern-text`}>
                    {plan.description}
                  </p>
                  <div className="delete-button-wrapper">
                    <button 
                      className="btn btn-sm btn-outline-danger delete-button" 
                      onClick={() => setShowDeleteConfirm(plan.id)}
                      aria-label="Delete plan"
                    >
                      <span>🗑️</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info text-center mx-auto" style={{ maxWidth: '600px' }}>
          No travel plans yet. Create your first plan to get started!
        </div>
      )}
      
      <div className="mt-5 mb-4">
        <button 
          className="btn create-plan-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : <><span className="plus-icon me-2">➕</span>Create New Plan</>}
        </button>
      </div>

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
        
        .plan-card {
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #2d3748;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .plan-card:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .card-img-wrapper {
          position: relative;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        
        .card-img {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        
        .card-body {
          padding-top: 1rem;
          padding-bottom: 2.5rem;
          border-bottom-left-radius: 0.5rem; 
          border-bottom-right-radius: 0.5rem;
          position: relative;
        }
        
        .category-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background-color: rgba(52, 152, 219, 0.8);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 2rem;
          font-size: 0.8rem;
          font-weight: 600;
          backdrop-filter: blur(5px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        
        .delete-button-wrapper {
          position: absolute;
          bottom: 10px;
          right: 10px;
        }
        
        .delete-button {
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }
        
        .delete-button:hover {
          opacity: 1;
        }
        
        .main-title {
          font-family: 'Inter', sans-serif;
          letter-spacing: -0.03em;
          font-weight: 700;
        }
        
        .modern-title {
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        
        .modern-text {
          font-family: 'Inter', sans-serif;
          font-weight: 300;
          letter-spacing: 0.01em;
        }
        
        .tagline {
          font-family: 'Inter', sans-serif;
          font-weight: 400;
          font-style: italic;
          color: #e2e8f0;
          font-size: 1.05rem;
          letter-spacing: 0.01em;
          margin-bottom: 1.5rem;
          position: relative;
          display: inline-block;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .tagline::before,
        .tagline::after {
          content: '—';
          color: #64748b;
          margin: 0 0.5rem;
          display: inline-block;
          opacity: 0.7;
        }
        
        .create-plan-btn {
          background-color: #2563eb;
          color: white;
          font-weight: 600;
          font-size: 1.05rem;
          padding: 0.7rem 1.8rem;
          border-radius: 0.5rem;
          border: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }
        
        .create-plan-btn:hover {
          background-color: #1d4ed8;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 10px rgba(37, 99, 235, 0.3);
        }
        
        .create-plan-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
        }
        
        .plus-icon {
          font-size: 1rem;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}

export default HomePage; 