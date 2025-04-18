import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

function PlanPage() {
  const { planId } = useParams();
  
  const [plan, setPlan] = useState({
    id: planId,
    title: planId === 'japan-2025' ? 'Japan Trip 2025' : 'Iceland 2026',
    description: planId === 'japan-2025' 
      ? 'Celebrating Yoki\'s birthday in the land of the rising sun' 
      : 'Experience the adventure',
    image: planId === 'japan-2025'
      ? 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1000&auto=format&fit=crop'
      : 'https://media.cntraveler.com/photos/60748e5ed1058698d13c31ee/16:9/w_1920%2Cc_limit/Vatnajokull-Iceland-GettyImages-655074449.jpg',
    startDate: '',
    endDate: '',
    budget: '',
    notes: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({...plan});

  const handleSaveChanges = () => {
    setPlan({...editForm});
    setIsEditing(false);
  };

  return (
    <div className="plan-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">{plan.title}</h2>
        <div>
          <button 
            className="btn btn-outline-info" 
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Plan'}
          </button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="card bg-dark mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="title" className="form-label">Plan Title</label>
                <input
                  type="text"
                  className="form-control"
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="image" className="form-label">Cover Image URL</label>
                <input
                  type="text"
                  className="form-control"
                  id="image"
                  value={editForm.image}
                  onChange={(e) => setEditForm({...editForm, image: e.target.value})}
                />
              </div>
              <div className="col-md-12">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows="2"
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  id="startDate"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({...editForm, startDate: e.target.value})}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  id="endDate"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({...editForm, endDate: e.target.value})}
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="budget" className="form-label">Budget</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className="form-control"
                    id="budget"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({...editForm, budget: e.target.value})}
                  />
                </div>
              </div>
              <div className="col-md-12">
                <label htmlFor="notes" className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  rows="4"
                />
              </div>
            </div>
            
            <div className="d-flex justify-content-end mt-3">
              <button 
                onClick={() => setIsEditing(false)} 
                className="btn btn-secondary me-2"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges} 
                className="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-md-6 mb-4">
            {plan.image && (
              <img 
                src={plan.image} 
                alt={plan.title}
                className="img-fluid rounded"
                style={{ maxHeight: '300px', width: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x300/222/666?text=Plan+Image';
                }}
              />
            )}
          </div>
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-body">
                <h3 className="card-title">{plan.title}</h3>
                <p className="card-text">{plan.description}</p>
                
                <div className="mt-4">
                  {(plan.startDate || plan.endDate) && (
                    <p>
                      <strong>Dates:</strong> {plan.startDate || 'Not set'} to {plan.endDate || 'Not set'}
                    </p>
                  )}
                  
                  {plan.budget && (
                    <p>
                      <strong>Budget:</strong> ${plan.budget}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {plan.notes && (
            <div className="col-12 mt-4">
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">Notes</h4>
                  <p className="card-text" style={{ whiteSpace: 'pre-line' }}>{plan.notes}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Large thumbnail cards for Planning and Wishlist */}
          <div className="col-12 mt-4">
            <div className="row g-4">
              <div className="col-md-6">
                <Link to={`/plan/${planId}/planning`} className="text-decoration-none">
                  <div className="card feature-card planning-card">
                    <div className="card-body text-center py-5">
                      <div className="feature-icon mb-3">📋</div>
                      <h3 className="card-title">Planning</h3>
                      <p className="card-text">Organize your trip day by day and add activities</p>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="col-md-6">
                <Link to={`/plan/${planId}/wishlist`} className="text-decoration-none">
                  <div className="card feature-card wishlist-card">
                    <div className="card-body text-center py-5">
                      <div className="feature-icon mb-3">✨</div>
                      <h3 className="card-title">Wishlist</h3>
                      <p className="card-text">Save ideas and places you want to visit</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .feature-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border-width: 2px;
          height: 100%;
          cursor: pointer;
        }
        
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }
        
        .planning-card {
          background-color: #2c3e50;
          border-color: #3498db;
          color: white;
        }
        
        .wishlist-card {
          background-color: #2c3e50;
          border-color: #e74c3c;
          color: white;
        }
        
        .feature-icon {
          font-size: 3rem;
        }
      `}</style>
    </div>
  );
}

export default PlanPage; 