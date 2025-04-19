import React, { useState, useEffect } from 'react';

function RegionManager({ regions, setRegions, planId }) {
  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionNotes, setNewRegionNotes] = useState('');
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    if (!planId) return;
    const wishlistKey = `wishlist-${planId}`;
    try {
      const storedWishlist = localStorage.getItem(wishlistKey);
      if (storedWishlist) {
        setWishlistItems(JSON.parse(storedWishlist));
      } else {
        setWishlistItems([]);
      }
    } catch (error) {
      console.error("Error loading wishlist from localStorage:", error);
      setWishlistItems([]);
    }
  }, [planId]);

  const handleAddRegion = (e) => {
    e.preventDefault();
    if (!newRegionName.trim()) return;

    const newRegion = {
      id: Date.now().toString(),
      name: newRegionName.trim(),
      notes: newRegionNotes.trim(),
    };

    setRegions([...regions, newRegion]);

    setNewRegionName('');
    setNewRegionNotes('');
  };

  const handleDeleteRegion = (idToDelete) => {
    setRegions(regions.filter(region => region.id !== idToDelete));
  };
  
  const getWishlistItemCount = (regionId) => {
    if (!regionId || wishlistItems.length === 0) return 0;
    return wishlistItems.filter(item => item.regionId === regionId).length;
  };

  const cardStyle = {
      backgroundColor: '#2c3e50',
      borderColor: '#4e5d6c',
      color: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      marginTop: '2rem',
      maxWidth: '700px',
      marginLeft: 'auto',
      marginRight: 'auto'
  };
  
  const inputStyle = {
      backgroundColor: '#3a4a5b',
      color: 'white',
      borderColor: '#4e5d6c'
  };
  
  const inputFocusStyle = {
      backgroundColor: '#3a4a5b',
      color: 'white',
      borderColor: '#3498db',
      boxShadow: '0 0 0 0.2rem rgba(52, 152, 219, 0.25)'
  };
  
  const listGroupItemStyle = {
      backgroundColor: '#34495e',
      borderColor: '#4e5d6c',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'background-color 0.2s ease'
  };

  return (
    <div className="region-manager" style={cardStyle}>
      <h4 className="mb-3 text-center">🗺️ Travel Regions</h4>
      <p className="text-center text-muted mb-4" style={{fontSize: '0.9rem'}}>Define key locations for organizing activities.</p>
      
      <form onSubmit={handleAddRegion} className="mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <label htmlFor="regionName" className="form-label" style={{ fontSize: '0.85rem' }}>Region Name*</label>
            <input
              type="text"
              className="form-control form-control-sm"
              id="regionName"
              value={newRegionName}
              onChange={(e) => setNewRegionName(e.target.value)}
              placeholder="e.g., Tokyo Area"
              style={inputStyle}
              required
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="regionNotes" className="form-label" style={{ fontSize: '0.85rem' }}>Notes</label>
            <input
              type="text"
              className="form-control form-control-sm"
              id="regionNotes"
              value={newRegionNotes}
              onChange={(e) => setNewRegionNotes(e.target.value)}
              placeholder="Optional notes"
              style={inputStyle}
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-success btn-sm w-100">Add Region</button>
          </div>
        </div>
      </form>

      {regions.length > 0 ? (
        <ul className="list-group">
          {regions.map((region) => {
            const count = getWishlistItemCount(region.id);
            return (
              <li 
                key={region.id} 
                className="list-group-item region-list-item"
                style={listGroupItemStyle}
              >
                <div>
                  <span style={{ fontWeight: '600' }}>{region.name}</span>
                  {count > 0 && (
                    <span className="badge bg-info ms-2" style={{ fontSize: '0.7em' }}>
                      {count} {count === 1 ? 'item' : 'items'}
                    </span>
                  )}
                  {region.notes && <small className="d-block text-muted" style={{ marginLeft: '10px' }}>{region.notes}</small>}
                </div>
                <button
                  onClick={() => handleDeleteRegion(region.id)}
                  className="btn btn-danger btn-sm"
                  style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-center text-muted">No regions added yet.</p>
      )}
      
      <style jsx>{`
        .form-control:focus {
          background-color: ${inputFocusStyle.backgroundColor};
          color: ${inputFocusStyle.color};
          border-color: ${inputFocusStyle.borderColor};
          box-shadow: ${inputFocusStyle.boxShadow};
        }
        
        .region-list-item:hover {
          background-color: #4e5d6c !important;
          cursor: default;
        }
      `}</style>
    </div>
  );
}

export default RegionManager; 