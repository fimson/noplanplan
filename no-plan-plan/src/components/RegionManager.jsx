import React, { useState, useEffect } from 'react';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase-config';

function RegionManager({ regions, setRegions, planId }) {
  const [newRegionName, setNewRegionName] = useState('');
  const [newRegionNotes, setNewRegionNotes] = useState('');
  const [wishlistItems, setWishlistItems] = useState([]);
  
  // State for inline editing
  const [editingRegionId, setEditingRegionId] = useState(null);
  const [editingRegionName, setEditingRegionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch wishlist items from Firestore
  useEffect(() => {
    if (!planId) return;
    
    const fetchWishlistItems = async () => {
      try {
        const wishlistRef = collection(db, `trips/${planId}/wishlist`);
        const querySnapshot = await getDocs(wishlistRef);
        
        const fetchedItems = [];
        querySnapshot.forEach((doc) => {
          fetchedItems.push({
            id: doc.id,
            ...doc.data(),
            regionId: doc.data().regionId || null
          });
        });
        
        setWishlistItems(fetchedItems);
      } catch (error) {
        console.error("Error fetching wishlist items from Firestore:", error);
        setWishlistItems([]);
      }
    };
    
    fetchWishlistItems();
  }, [planId, regions]); // Add regions as dependency to refresh when regions change

  const handleAddRegion = async (e) => {
    e.preventDefault();
    if (!newRegionName.trim() || !planId) return;
    
    setIsLoading(true);
    
    try {
      const newRegion = {
        id: `region-${Date.now()}`,
        name: newRegionName.trim(),
        notes: newRegionNotes.trim(),
      };
      
      // Save to Firestore
      await setDoc(doc(db, `trips/${planId}/regions`, newRegion.id), {
        name: newRegion.name,
        notes: newRegion.notes
      });
      
      // Update local state
      setRegions([...regions, newRegion]);
      
      // Reset form
      setNewRegionName('');
      setNewRegionNotes('');
    } catch (error) {
      console.error("Error adding region to Firestore:", error);
      alert("Failed to add region. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRegion = async (idToDelete) => {
    if (!planId) return;
    
    setIsLoading(true);
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, `trips/${planId}/regions`, idToDelete));
      
      // Update local state
      setRegions(regions.filter(region => region.id !== idToDelete));
      
      // Update any wishlist items that reference this region
      const itemsToUpdate = wishlistItems.filter(item => item.regionId === idToDelete);
      
      for (const item of itemsToUpdate) {
        await updateDoc(doc(db, `trips/${planId}/wishlist`, item.id), {
          regionId: null
        });
      }
    } catch (error) {
      console.error("Error deleting region from Firestore:", error);
      alert("Failed to delete region. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for inline editing
  const handleEditClick = (region) => {
    setEditingRegionId(region.id);
    setEditingRegionName(region.name);
  };

  const handleSaveEdit = async (regionId) => {
    if (!editingRegionName.trim() || !planId) return;
    
    setIsLoading(true);
    
    try {
      // Update in Firestore
      await updateDoc(doc(db, `trips/${planId}/regions`, regionId), {
        name: editingRegionName.trim()
      });
      
      // Update local state
      setRegions(regions.map(region => 
        region.id === regionId ? { ...region, name: editingRegionName.trim() } : region
      ));
      
      // Reset editing state
      setEditingRegionId(null);
      setEditingRegionName('');
    } catch (error) {
      console.error("Error updating region in Firestore:", error);
      alert("Failed to update region. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingRegionId(null);
    setEditingRegionName('');
  };
  
  const handleEditInputChange = (e) => {
    setEditingRegionName(e.target.value);
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          <div className="col-md-2">
            <button 
              type="submit" 
              className="btn btn-success btn-sm w-100"
              disabled={isLoading || !newRegionName.trim()}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : 'Add Region'}
            </button>
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
                {editingRegionId === region.id ? (
                  // Editing view
                  <div className="d-flex align-items-center flex-grow-1">
                    <input
                      type="text"
                      className="form-control form-control-sm me-2"
                      value={editingRegionName}
                      onChange={handleEditInputChange}
                      style={{ ...inputStyle, flexBasis: '60%' }}
                      autoFocus
                      disabled={isLoading}
                      onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSaveEdit(region.id)}
                    />
                    <button 
                      onClick={() => handleSaveEdit(region.id)} 
                      className="btn btn-success btn-sm me-1"
                      style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}
                      disabled={isLoading || !editingRegionName.trim()}
                    >
                      {isLoading ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      ) : 'Save'}
                    </button>
                    <button 
                      onClick={handleCancelEdit} 
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  // Default view
                  <>
                    <div className="flex-grow-1">
                      <span style={{ fontWeight: '600' }}>{region.name}</span>
                      {count > 0 && (
                        <span className="badge bg-info ms-2" style={{ fontSize: '0.7em' }}>
                          {count} {count === 1 ? 'item' : 'items'}
                        </span>
                      )}
                      {region.notes && <small className="d-block text-muted" style={{ marginLeft: '10px' }}>{region.notes}</small>}
                    </div>
                    <div className="ms-2">
                      <button
                        onClick={() => handleEditClick(region)}
                        className="btn btn-primary btn-sm me-1"
                        style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRegion(region.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-center text-muted">No regions added yet.</p>
      )}
      
      <style>{`
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