import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RegionManager from '/src/components/RegionManager.jsx';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';

function PlanPage() {
  const { tripId } = useParams();
  
  const [plan, setPlan] = useState({
    id: tripId,
    title: tripId === 'japan-2025' ? 'Japan Trip 2025' : 'Iceland 2026',
    description: tripId === 'japan-2025' 
      ? 'Celebrating Yoki\'s birthday in the land of the rising sun' 
      : 'Experience the adventure',
    image: tripId === 'japan-2025'
      ? 'https://www.thetrainline.com/cmsmedia/cms/7709/japan_2x.jpg'
      : 'https://media.cntraveler.com/photos/60748e5ed1058698d13c31ee/16:9/w_1920%2Cc_limit/Vatnajokull-Iceland-GettyImages-655074449.jpg',
    startDate: '',
    endDate: '',
    budget: '',
    notes: ''
  });
  
  // Get appropriate flag for the plan
  const getTripFlag = () => {
    if (tripId === 'japan-2025') return '🇯🇵';
    if (tripId === 'iceland-2026') return '🇮🇸';
    return '🌍';
  };

  // Get appropriate tagline for the plan
  const getTripTagline = () => {
    if (tripId === 'japan-2025') 
      return "Yoki's birthday bash in the land of cherry blossoms";
    if (tripId === 'iceland-2026')
      return "Northern lights and epic landscapes";
    return "Your adventure awaits";
  };
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({...plan});
  const [isLoading, setIsLoading] = useState(true);
  
  // Define default regions
  const defaultRegions = [
    { id: 'tokyo-region', name: 'Tokyo Area', notes: 'Central Hub' },
    { id: 'kyoto-region', name: 'Kyoto Region', notes: 'Cultural Heart' }
  ];
  
  const [regions, setRegions] = useState([]);

  // Effect to fetch plan and regions from Firestore
  useEffect(() => {
    if (!tripId) return;
    
    const fetchPlanAndRegions = async () => {
      setIsLoading(true);
      
      try {
        // Fetch trip details
        const tripRef = doc(db, 'trips', tripId);
        const tripSnap = await getDoc(tripRef);
        
        if (tripSnap.exists()) {
          const tripData = tripSnap.data();
          setPlan({
            id: tripId,
            title: tripData.title || plan.title,
            description: tripData.description || plan.description,
            image: tripData.image || plan.image,
            startDate: tripData.startDate || '',
            endDate: tripData.endDate || '',
            budget: tripData.budget || '',
            notes: tripData.notes || ''
          });
          setEditForm({
            id: tripId,
            title: tripData.title || plan.title,
            description: tripData.description || plan.description,
            image: tripData.image || plan.image,
            startDate: tripData.startDate || '',
            endDate: tripData.endDate || '',
            budget: tripData.budget || '',
            notes: tripData.notes || ''
          });
        } else {
          // If the trip doesn't exist in Firestore yet, create it with default values
          await setDoc(doc(db, 'trips', tripId), {
            title: plan.title,
            description: plan.description,
            image: plan.image,
            createdAt: new Date(),
            lastUpdated: new Date()
          });
        }
        
        // Fetch regions
        const regionsRef = collection(db, `trips/${tripId}/regions`);
        const querySnapshot = await getDocs(regionsRef);
        
        const fetchedRegions = [];
        querySnapshot.forEach((doc) => {
          fetchedRegions.push({
            id: doc.id,
            name: doc.data().name,
            notes: doc.data().notes || ''
          });
        });
        
        // If no regions were found, create default regions in Firestore
        if (fetchedRegions.length === 0 && tripId === 'japan-2025') {
          // Add default regions to Firestore
          for (const region of defaultRegions) {
            await setDoc(doc(db, `trips/${tripId}/regions`, region.id), {
              name: region.name,
              notes: region.notes
            });
          }
          setRegions(defaultRegions);
        } else {
          setRegions(fetchedRegions);
        }
      } catch (error) {
        console.error("Error fetching trip data from Firestore:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlanAndRegions();
  }, [tripId]);

  const handleSaveChanges = async () => {
    if (!tripId) return;
    
    setIsLoading(true);
    
    try {
      // Update trip details in Firestore - removed date fields
      await setDoc(doc(db, 'trips', tripId), {
        title: editForm.title,
        description: editForm.description,
        image: editForm.image,
        budget: editForm.budget,
        notes: editForm.notes,
        lastUpdated: new Date()
      }, { merge: true });
      
      // Update local state
      setPlan({...editForm, id: tripId});
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating trip in Firestore:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="plan-page text-center">
      <div className="d-flex justify-content-center align-items-center mb-4 flex-column">
        <h2 className="trip-title">
          {getTripFlag()} {plan.title}
        </h2>
        <p className="trip-tagline">{getTripTagline()}</p>
      </div>
      
      {isLoading && (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading trip details...</p>
        </div>
      )}
      
      {!isLoading && isEditing ? (
        <div className="card bg-dark mb-4 mx-auto" style={{ maxWidth: '900px' }}>
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
            
            <div className="d-flex justify-content-center mt-3">
              <button 
                onClick={() => setIsEditing(false)} 
                className="btn btn-secondary me-2"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveChanges} 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : !isLoading && (
        <div className="row justify-content-center">
          <div className="col-md-8 mb-4">
            {plan.image && (
              <img 
                src={plan.image} 
                alt={plan.title}
                className="img-fluid rounded hero-image"
                style={{ objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x300/222/666?text=Plan+Image';
                }}
              />
            )}
            
            <div className="mt-3">
              <button 
                onClick={() => setIsEditing(true)}
                className="btn btn-sm btn-outline-secondary"
              >
                Edit Trip Details
              </button>
            </div>
          </div>
          
          {plan.notes && (
            <div className="col-md-8 mt-4">
              <div className="card">
                <div className="card-body text-center">
                  <h4 className="card-title">Notes</h4>
                  <p className="card-text" style={{ whiteSpace: 'pre-line' }}>{plan.notes}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* "About Japan" Card */}
          {tripId === 'japan-2025' && (
            <div className="col-md-10 mt-4">
              <Link to={`/trip/${tripId}/about`} className="text-decoration-none">
                <div className="card about-card mb-4">
                  <div className="card-body d-flex align-items-center">
                    <div className="about-icon me-3">📘</div>
                    <div className="flex-grow-1">
                      <h3 className="about-title mb-1">About Japan</h3>
                      <p className="about-text mb-2">History, culture, etiquette — everything to brief your brain before your boarding pass.</p>
                      <div className="text-end">
                        <span className="about-cta">Explore topics →</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
          
          {/* Large thumbnail cards for Planning and Wishlist */}
          <div className="col-md-10 mt-4">
            <div className="divider mb-4">
              <span>Your Trip Tools</span>
            </div>
            
            <div className="row g-4 justify-content-center">
              <div className="col-12 col-sm-8 col-md-4">
                <Link to={`/trip/${tripId}/planning`} className="text-decoration-none">
                  <div className="card feature-card planning-card primary-feature">
                    <div className="card-body text-center py-4">
                      <div className="feature-icon mb-2">📋</div>
                      <h3 className="card-title feature-title">Planning</h3>
                      <p className="card-text feature-text">Organize your trip day by day and add activities</p>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="col-12 col-sm-8 col-md-4">
                <Link to={`/trip/${tripId}/bookings`} className="text-decoration-none">
                  <div className="card feature-card bookings-card">
                    <div className="card-body text-center py-4">
                      <div className="feature-icon mb-2">🎫</div>
                      <h3 className="card-title feature-title">Trip Logistics</h3>
                      <p className="card-text feature-text">Track flights, hotels, and reservations</p>
                    </div>
                  </div>
                </Link>
              </div>
              <div className="col-12 col-sm-8 col-md-4">
                <Link to={`/trip/${tripId}/wishlist`} className="text-decoration-none">
                  <div className="card feature-card wishlist-card">
                    <div className="card-body text-center py-4">
                      <div className="feature-icon mb-2">✨</div>
                      <h3 className="card-title feature-title">Wishlist</h3>
                      <p className="card-text feature-text">Save ideas and places you want to visit</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
            
            {/* Render RegionManager below the tools when not editing */}
            <div className="mt-5">
              <RegionManager regions={regions} setRegions={setRegions} planId={tripId} />
            </div>
            
          </div>
        </div>
      )}
      
      <style jsx>{`
        .feature-card {
          transition: all 0.3s ease;
          border-width: 2px;
          height: 100%;
          cursor: pointer;
          max-width: 400px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }
        
        .feature-card:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }
        
        .planning-card {
          background-color: #2c3e50;
          border-color: #3498db;
          color: white;
        }
        
        .bookings-card {
          background-color: #2c3e50;
          border-color: #16a34a;
          color: white;
        }
        
        .wishlist-card {
          background-color: #2c3e50;
          border-color: #e74c3c;
          color: white;
        }
        
        .feature-icon {
          font-size: 2.5rem;
        }
        
        .feature-title {
          font-size: 1.5rem;
        }
        
        .feature-text {
          font-size: 0.9rem;
        }
        
        .primary-feature {
          box-shadow: 0 8px 16px rgba(52, 152, 219, 0.3);
          transform: translateY(-5px);
          border-width: 3px;
        }
        
        .primary-feature:hover {
          transform: translateY(-12px) scale(1.05);
          box-shadow: 0 20px 30px rgba(52, 152, 219, 0.4);
        }
        
        .primary-feature::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, transparent 65%, rgba(52, 152, 219, 0.3) 100%);
          pointer-events: none;
        }
        
        .divider {
          position: relative;
          text-align: center;
          font-family: 'Inter', sans-serif;
          color: #94a3b8;
          font-size: 0.9rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 2rem;
        }
        
        .divider::before,
        .divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 35%;
          height: 1px;
          background-color: rgba(148, 163, 184, 0.3);
        }
        
        .divider::before {
          left: 0;
        }
        
        .divider::after {
          right: 0;
        }
        
        .divider span {
          background-color: #242424;
          padding: 0 15px;
          position: relative;
        }
        
        .trip-title {
          font-family: 'Inter', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #f8fafc;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .trip-tagline {
          font-family: 'Inter', sans-serif;
          font-size: 1.1rem;
          font-weight: 400;
          font-style: italic;
          color: #94a3b8;
          margin-bottom: 1.5rem;
          max-width: 500px;
        }
        
        .hero-image {
          width: 100%;
          height: auto;
          max-height: 400px;
        }
        
        /* Responsive styles */
        @media (max-width: 767px) {
          .trip-title {
            font-size: 2rem;
          }
          
          .trip-tagline {
            font-size: 1rem;
            max-width: 90%;
          }
          
          .divider::before,
          .divider::after {
            width: 25%;
          }
          
          .feature-icon {
            font-size: 2rem;
          }
          
          .feature-title {
            font-size: 1.25rem;
          }
        }
        
        .about-card {
          background: linear-gradient(to right, #1a2635, #2c3e50);
          border: 2px solid #4e76c7;
          border-left: 5px solid #4e76c7;
          transition: all 0.3s ease;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .about-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
          border-color: #64a0db;
        }
        
        .about-icon {
          font-size: 2.5rem;
          color: #64a0db;
        }
        
        .about-title {
          font-size: 1.4rem;
          font-weight: 600;
        }
        
        .about-text {
          font-size: 0.95rem;
          color: #b3cdeb;
          font-style: italic;
        }
        
        .about-cta {
          font-size: 0.9rem;
          color: #64a0db;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .about-card:hover .about-cta {
          color: #a2c8f0;
        }
      `}</style>
    </div>
  );
}

export default PlanPage; 