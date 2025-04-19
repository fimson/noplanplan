import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Wishlist({ planId, onAddToPlanning }) {
  const navigate = useNavigate();
  
  // Sample data based on planId
  let initialItems = [];
  
  if (planId === 'japan-2025') {
    initialItems = [
      {
        id: 'nikko',
        title: "Nikko",
        votes: 0,
        link: "https://www.japan-guide.com/e/e3800.html",
        imageUrl: "https://www.2aussietravellers.com/wp-content/uploads/2018/07/Shinkyo-Bridge-in-Nikko-2.jpg",
        description: "Shrines and waterfalls",
        createdAt: new Date().toISOString(),
        planned: false
      },
      {
        id: 'shibuya',
        title: "Tokyo Shibuya",
        votes: 2,
        link: "https://www.japan-guide.com/e/e3007.html",
        imageUrl: "https://assets.vogue.com/photos/659db809e0e9934642099815/16:9/w_6000,h_3375,c_limit/1189690204",
        description: "Shibuya Crossing",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        planned: false
      },
      {
        id: 'fushimi-inari',
        title: "Fushimi Inari Shrine",
        votes: 4,
        link: "https://www.japan-guide.com/e/e3915.html",
        imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/AB5caB8E208ojDIa3zPw4Ssp67l66OBVM2JhONi-rz8TCWhmpSqXkXW9LpV9YA360aqB5uHU760pmg3cCX5f8ObsQQ0lbmu46bNYC2QCIRX50v0RwkHf_GHEaubZYDb2xOHB-4q2-gI=s680-w680-h510",
        description: "Famous shrine with thousands of red torii gates in Kyoto",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        planned: false
      },
      {
        id: 'kinkakuji',
        title: "Kinkaku-ji (Golden Pavilion)",
        votes: 1,
        link: "https://www.japan-guide.com/e/e3908.html",
        imageUrl: "https://www.japan-guide.com/g18/3908_top.jpg",
        description: "Zen temple covered in gold leaf in Kyoto",
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        planned: false
      }
    ];
  } else if (planId === 'iceland-2026') {
    initialItems = [
      {
        id: 'eiffel-tower',
        title: "Eiffel Tower",
        votes: 3,
        link: "https://www.toureiffel.paris/en",
        imageUrl: "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?q=80&w=1000&auto=format&fit=crop",
        description: "Iconic iron tower in Paris",
        createdAt: new Date().toISOString(),
        planned: false
      },
      {
        id: 'colosseum',
        title: "Colosseum",
        votes: 5,
        link: "https://www.rome.net/colosseum",
        imageUrl: "https://images.unsplash.com/photo-1552432552-06c0b0a94dda?q=80&w=1000&auto=format&fit=crop",
        description: "Ancient Roman amphitheater",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        planned: false
      }
    ];
  } else {
    // Default or generic items for non-specific plans
    initialItems = [
      {
        id: 'default-item',
        title: "Add your first wishlist item",
        votes: 0,
        link: "",
        imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1000&auto=format&fit=crop",
        description: "Start building your travel wishlist",
        createdAt: new Date().toISOString(),
        planned: false
      }
    ];
  }
  
  // Use stored items if available, otherwise use initialItems
  const getLocalStorageKey = () => `wishlist-${planId || 'default'}`;
  
  // Try to get stored items from localStorage
  const getStoredItems = () => {
    try {
      const storedItems = localStorage.getItem(getLocalStorageKey());
      if (storedItems) {
        // Parse stored items
        const parsedItems = JSON.parse(storedItems);
        
        // Check if there are any planned items without corresponding activities
        if (planId) {
          const activitiesKey = `activities-${planId}`;
          const storedActivities = localStorage.getItem(activitiesKey);
          
          if (storedActivities) {
            const activities = JSON.parse(storedActivities);
            
            // Reset items that are marked as planned but have no corresponding activity
            const updatedItems = parsedItems.map(item => {
              if (item.planned) {
                // Check if there's an activity that references this wishlist item
                const hasActivity = activities.some(activity => 
                  activity.wishlistItemId === item.id
                );
                
                // If no activity references this item, mark it as not planned
                if (!hasActivity) {
                  return { ...item, planned: false };
                }
              }
              return item;
            });
            
            // If we made changes, update localStorage
            if (JSON.stringify(updatedItems) !== JSON.stringify(parsedItems)) {
              localStorage.setItem(getLocalStorageKey(), JSON.stringify(updatedItems));
              return updatedItems;
            }
          }
        }
        
        return parsedItems;
      }
      return initialItems;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return initialItems;
    }
  };
  
  const [items, setItems] = useState(getStoredItems());
  const [newItem, setNewItem] = useState('');
  const [newItemLink, setNewItemLink] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [expandedForm, setExpandedForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddToPlanModal, setShowAddToPlanModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // TODO: Fetch/load regions based on planId in a real app
  const [regions, setRegions] = useState([ 
    // Sample regions for now - replace with actual loading mechanism
    { id: 'tokyo', name: 'Tokyo Area' },
    { id: 'kyoto', name: 'Kyoto Prefecture' }

  ]);
  
  // Save items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(items));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [items, planId]);

  // --- Simulated AI Helper Function ---
  const enhanceWishlistItemDetails = async (title, availableRegions) => {
    if (!title) return { correctedTitle: title, suggestedRegionId: null };

    // 1. Title Correction (Basic)
    let correctedTitle = title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
      
    // Simple typo fix example
    correctedTitle = correctedTitle.replace(/\bTokio\b/gi, 'Tokyo');

    // 2. Region Assignment (Basic String Matching)
    let suggestedRegionId = null;
    const lowerCaseTitle = correctedTitle.toLowerCase();
    for (const region of availableRegions) {
      if (lowerCaseTitle.includes(region.name.toLowerCase())) {
        suggestedRegionId = region.id;
        break; // Assign the first match
      }
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300)); 

    return { correctedTitle, suggestedRegionId };
  };
  // --- End AI Helper ---

  const fetchMissingDetails = async (title) => {
    setIsLoading(true);
    try {
      // For development, we'll use fallback values directly
      // In production, this would call your actual API
      console.log(`Fetching details for: ${title}`);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock API response with relevant information based on title and planId
      let imageUrl, description, link;
      
      // Try to match based on planId and title
      const lowercaseTitle = title.toLowerCase();
      
      if (planId === 'japan-2025' || (!planId && lowercaseTitle.includes('japan'))) {
        // Japan-specific fallbacks
        if (lowercaseTitle.includes('tokyo')) {
          imageUrl = 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop';
          description = 'The bustling capital of Japan, known for its mix of traditional culture and cutting-edge technology.';
          link = 'https://www.japan-guide.com/e/e2164.html';
        } else if (lowercaseTitle.includes('kyoto')) {
          imageUrl = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop';
          description = 'Former imperial capital with numerous classical Buddhist temples, gardens, imperial palaces, and traditional wooden houses.';
          link = 'https://www.japan-guide.com/e/e2158.html';
        } else {
          // Generic Japan image
          imageUrl = 'https://source.unsplash.com/featured/?japan,' + encodeURIComponent(title);
          description = `A fascinating destination in Japan that's popular among travelers.`;
          link = `https://www.japan-guide.com/e/search_result.html?q=${encodeURIComponent(title)}`;
        }
      } else if (planId === 'iceland-2026' || (!planId && (lowercaseTitle.includes('europe') || lowercaseTitle.includes('paris')))) {
        // Europe-specific fallbacks
        if (lowercaseTitle.includes('paris')) {
          imageUrl = 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000&auto=format&fit=crop';
          description = 'The city of love, known for its art, fashion, gastronomy, and culture.';
          link = 'https://en.parisinfo.com/';
        } else if (lowercaseTitle.includes('rome')) {
          imageUrl = 'https://images.unsplash.com/photo-1525874684015-58379d421a52?q=80&w=1000&auto=format&fit=crop';
          description = 'The Eternal City, rich in history and ancient architecture.';
          link = 'https://www.rome.net/';
        } else {
          // Generic Europe image
          imageUrl = 'https://source.unsplash.com/featured/?europe,' + encodeURIComponent(title);
          description = `A captivating destination in Europe worth exploring.`;
          link = `https://www.google.com/search?q=${encodeURIComponent(title)}+europe`;
        }
      } else {
        // Generic travel image for anything else
        imageUrl = 'https://source.unsplash.com/featured/?travel,' + encodeURIComponent(title);
        description = `A fascinating destination worth adding to your travel wishlist.`;
        link = `https://www.google.com/search?q=${encodeURIComponent(title)}+travel`;
      }
      
      return {
        imageUrl,
        description,
        link
      };
    } catch (error) {
      console.error('Error fetching details:', error);
      
      // Fallback values
      return {
        description: `A popular destination worth visiting.`,
        link: `https://www.google.com/search?q=${encodeURIComponent(title)}`,
        imageUrl: `https://source.unsplash.com/featured/?travel,${encodeURIComponent(title)}`
      };
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async () => {
    if (newItem.trim() === '') return;
    
    // Start loading state
    setIsLoading(true);
    
    // --- Call AI Helper --- 
    const { correctedTitle, suggestedRegionId } = await enhanceWishlistItemDetails(newItem, regions);
    
    // Auto-select region if suggested by AI and not already manually selected
    let regionToUse = selectedRegion; // Start with manually selected region
    if (suggestedRegionId && !selectedRegion) { 
      regionToUse = suggestedRegionId;
      setSelectedRegion(suggestedRegionId); // Update state to reflect in dropdown
    }
    // --- End AI Helper Call ---
    
    // Generate a unique ID
    const id = correctedTitle.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(); // Use corrected title for ID
    
    let itemToAdd = { 
      id,
      title: correctedTitle, // Use corrected title
      votes: 0,
      link: newItemLink.trim() || null,
      imageUrl: newItemImage.trim() || null,
      description: newItemDescription.trim() || null,
      createdAt: new Date().toISOString(),
      planned: false,
      regionId: regionToUse || null // Use determined region ID
    };
    
    // If some fields are missing, try to fill them with our helper
    const needsCompletion = !itemToAdd.description || !itemToAdd.link || !itemToAdd.imageUrl;
    
    if (needsCompletion && !editIndex) {
      console.log("Missing details, fetching data...");
      try {
        const completedDetails = await fetchMissingDetails(correctedTitle);
        
        if (completedDetails) {
          console.log("Got completed details:", completedDetails);
          // Only replace fields that were empty
          if (!itemToAdd.description && completedDetails.description) {
            itemToAdd.description = completedDetails.description;
          }
          
          if (!itemToAdd.link && completedDetails.link) {
            itemToAdd.link = completedDetails.link;
          }
          
          if (!itemToAdd.imageUrl && completedDetails.imageUrl) {
            itemToAdd.imageUrl = completedDetails.imageUrl;
          }
        }
      } catch (error) {
        console.error("Error completing details:", error);
      }
    }
    
    // Now add the item (with enhanced details if available)
    if (editIndex !== null) {
      // Update existing item
      const updated = [...items];
      // Preserve the votes count and planned status when editing
      itemToAdd.votes = updated[editIndex].votes;
      itemToAdd.planned = updated[editIndex].planned;
      itemToAdd.id = updated[editIndex].id; // Keep the same ID
      
      updated[editIndex] = itemToAdd;
      setItems(updated);
      setEditIndex(null);
    } else {
      // Add new item at the beginning to ensure left-to-right flow
      setItems([itemToAdd, ...items]);
    }
    
    // Reset the form and loading state
    resetForm();
    setIsLoading(false);
  };

  const resetForm = () => {
    setNewItem('');
    setNewItemLink('');
    setNewItemImage('');
    setNewItemDescription('');
    setExpandedForm(false);
    setSelectedRegion('');
  };

  const upvoteItem = (index) => {
    const updated = [...items];
    updated[index].votes += 1;
    setItems(updated);
  };

  const deleteItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
    
    // If deleting the item being edited, clear the form
    if (editIndex === index) {
      resetForm();
      setEditIndex(null);
    } else if (editIndex !== null && index < editIndex) {
      // Adjust editIndex if deleting an item before it
      setEditIndex(editIndex - 1);
    }
  };

  const editItem = (index) => {
    const item = items[index];
    setNewItem(item.title);
    setNewItemLink(item.link || '');
    setNewItemImage(item.imageUrl || '');
    setNewItemDescription(item.description || '');
    setExpandedForm(true);
    setEditIndex(index);
    setSelectedRegion(item.regionId || '');
  };

  const cancelEdit = () => {
    resetForm();
    setEditIndex(null);
  };
  
  const handleAddToPlan = (item) => {
    setSelectedItem(item);
    setShowAddToPlanModal(true);
  };
  
  const confirmAddToPlan = (day) => {
    if (!selectedItem) return;
    
    // Mark the item as planned
    const updatedItems = items.map(item => 
      item.id === selectedItem.id ? {...item, planned: true} : item
    );
    setItems(updatedItems);
    
    // Create an activity from this wishlist item
    const activityData = {
      title: selectedItem.title,
      description: selectedItem.description,
      location: '',
      day: day,
      wishlistItemId: selectedItem.id
    };
    
    // Call the provided callback or navigate to planning page
    if (onAddToPlanning) {
      onAddToPlanning(activityData);
    } else if (planId) {
      // Store the activity in localStorage temporarily
      localStorage.setItem('pending-activity', JSON.stringify(activityData));
      // Navigate to the planning page
      navigate(`/plan/${planId}/planning`);
    }
    
    // Close the modal
    setShowAddToPlanModal(false);
    setSelectedItem(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      addItem();
    }
  };

  // Helper function to get region details by ID
  const getRegionDetails = (regionId) => {
    if (!regionId) return null;
    return regions.find(r => r.id === regionId);
  };

  return (
    <div className="wishlist-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Wishlist</h2>
      </div>
      
      <div className="card bg-dark mb-4">
        <div className="card-body">
          <input
            type="text"
            className="form-control mb-3"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add a place or activity..."
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          
          {!expandedForm ? (
            <button 
              onClick={() => setExpandedForm(true)} 
              className="btn btn-secondary w-100" 
              disabled={isLoading}
            >
              More Options
            </button>
          ) : (
            <div className="expanded-form">
              <input
                type="text"
                className="form-control mb-3"
                value={newItemLink}
                onChange={(e) => setNewItemLink(e.target.value)}
                placeholder="Link (optional)"
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <input
                type="text"
                className="form-control mb-3"
                value={newItemImage}
                onChange={(e) => setNewItemImage(e.target.value)}
                placeholder="Image URL (optional)"
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <textarea
                className="form-control mb-3"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Description (optional)"
                rows="3"
                disabled={isLoading}
              />
              
              {/* Region Selection Dropdown */}
              <div className="mb-3">
                  <label htmlFor="regionSelect" className="form-label" style={{ fontSize: '0.85rem' }}>Region (optional)</label>
                  <select 
                      id="regionSelect"
                      className="form-select form-select-sm"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      disabled={isLoading}
                  >
                      <option value="">Select Region...</option>
                      {regions.map(region => (
                          <option key={region.id} value={region.id}>
                              {region.name}
                          </option>
                      ))}
                  </select>
              </div>
              
              <div className="d-flex justify-content-end gap-2">
                {editIndex !== null && (
                  <button 
                    onClick={cancelEdit} 
                    className="btn btn-secondary" 
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  onClick={addItem} 
                  className="btn btn-primary" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Loading...
                    </>
                  ) : (
                    editIndex !== null ? 'Update' : 'Add'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="row g-4">
          {items.map((item, index) => {
            const regionDetails = getRegionDetails(item.regionId);
            return (
              <div key={item.id || index} className="col-lg-3 col-md-6 col-12">
                <div className="card h-100">
                  {item.planned && (
                    <div className="planned-badge">
                      <span className="badge bg-success">Planned</span>
                    </div>
                  )}
                  
                  {item.imageUrl && (
                    <div className="card-img-top-wrapper" style={{ height: '180px', overflow: 'hidden' }}>
                      <img 
                        src={item.imageUrl} 
                        className="card-img-top"
                        alt={item.title}
                        style={{ objectFit: 'cover', height: '100%', width: '100%' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/400x300/222/666?text=Image+Error';
                        }} 
                      />
                    </div>
                  )}
                  
                  <div className="card-body">
                    <h5 className="card-title text-truncate">
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-info">
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </h5>
                    
                    {item.description && (
                      <p className="card-text description-text">
                        {item.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Display Region Info */}
                  {regionDetails && (
                    <div className="region-info my-2 px-3" style={{ fontSize: '0.8rem' }}>
                      <span className="badge bg-secondary">
                        {regionDetails.name}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="card-footer">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center">
                      <span className="me-2">{item.votes} votes</span>
                      <button 
                        onClick={() => upvoteItem(index)} 
                        className="btn btn-sm btn-outline-primary"
                        title="Upvote"
                      >
                        👍
                      </button>
                    </div>
                    
                    <div className="btn-group">
                      <button 
                        onClick={() => editItem(index)} 
                        className="btn btn-sm btn-outline-secondary"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => deleteItem(index)} 
                        className="btn btn-sm btn-outline-danger"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  {planId && (
                    <div className="d-grid">
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => {
                          if (onAddToPlanning) {
                            // When opened from planning page, directly add to that day without showing modal
                            const activityData = {
                              title: item.title,
                              description: item.description,
                              location: '',
                              wishlistItemId: item.id
                            };
                            
                            // Mark the item as planned in the wishlist
                            const updatedItems = items.map(i => 
                              i.id === item.id ? {...i, planned: true} : i
                            );
                            setItems(updatedItems);
                            
                            onAddToPlanning(activityData);
                          } else {
                            // Otherwise show the select day modal
                            handleAddToPlan(item);
                          }
                        }}
                        disabled={item.planned}
                      >
                        {item.planned ? 'Added to Plan' : 'Add to Plan'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="alert alert-info text-center">
          Your wishlist is empty. Add some places you'd like to visit!
        </div>
      )}
      
      {/* Modal for adding to plan */}
      {showAddToPlanModal && selectedItem && onAddToPlanning === null && (
        <div className="modal show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add to Plan</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddToPlanModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Add <strong>{selectedItem.title}</strong> to which day?</p>
                <div className="form-group">
                  <select 
                    className="form-select"
                    id="planDay"
                    onChange={(e) => confirmAddToPlan(parseInt(e.target.value))}
                  >
                    <option value="">Select a day...</option>
                    {Array.from({ length: 16 }, (_, i) => (
                      <option key={i+1} value={i+1}>Day {i+1}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddToPlanModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowAddToPlanModal(false)}></div>
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
        
        .planned-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1;
        }
        
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1040;
        }
        
        .modal {
          z-index: 1050;
        }
      `}</style>
    </div>
  );
}

// Default props
Wishlist.defaultProps = {
  planId: null,
  onAddToPlanning: null
};

export default Wishlist; 