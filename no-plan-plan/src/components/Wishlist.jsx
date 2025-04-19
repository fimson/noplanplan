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
        planned: false,
        regionId: 'region0' // Restore sample region
      },
      {
        id: 'shibuya',
        title: "Tokyo Shibuya",
        votes: 2,
        link: "https://www.japan-guide.com/e/e3007.html",
        imageUrl: "https://assets.vogue.com/photos/659db809e0e9934642099815/16:9/w_6000,h_3375,c_limit/1189690204",
        description: "Shibuya Crossing",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        planned: false,
        regionId: 'region0' // Restore sample region
      },
      {
        id: 'fushimi-inari',
        title: "Fushimi Inari Shrine",
        votes: 4,
        link: "https://www.japan-guide.com/e/e3915.html",
        imageUrl: "https://lh3.googleusercontent.com/gps-cs-s/AB5caB8E208ojDIa3zPw4Ssp67l66OBVM2JhONi-rz8TCWhmpSqXkXW9LpV9YA360aqB5uHU760pmg3cCX5f8ObsQQ0lbmu46bNYC2QCIRX50v0RwkHf_GHEaubZYDb2xOHB-4q2-gI=s680-w680-h510",
        description: "Famous shrine with thousands of red torii gates in Kyoto",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        planned: false,
        regionId: 'region1' // Restore sample region
      },
      {
        id: 'kinkakuji',
        title: "Kinkaku-ji (Golden Pavilion)",
        votes: 1,
        link: "https://www.japan-guide.com/e/e3908.html",
        imageUrl: "https://www.japan-guide.com/g18/3908_top.jpg",
        description: "Zen temple covered in gold leaf in Kyoto",
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        planned: false,
        regionId: 'region1' // Restore sample region
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
        planned: false,
        regionId: 'region0' // Restore sample region
      },
      {
        id: 'colosseum',
        title: "Colosseum",
        votes: 5,
        link: "https://www.rome.net/colosseum",
        imageUrl: "https://images.unsplash.com/photo-1552432552-06c0b0a94dda?q=80&w=1000&auto=format&fit=crop",
        description: "Ancient Roman amphitheater",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        planned: false,
        regionId: 'region1' // Restore sample region
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
        planned: false,
        regionId: null
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
  
  // Load regions from localStorage based on planId
  const [regions, setRegions] = useState(() => {
    if (!planId) return [];
    const regionsKey = `regions-${planId}`;
    try {
      const storedRegions = localStorage.getItem(regionsKey);
      if (storedRegions) {
          console.log(`Loaded regions for plan ${planId} from localStorage:`, JSON.parse(storedRegions));
          return JSON.parse(storedRegions);
      }
      console.log(`No regions found in localStorage for plan ${planId}`);
      return [];
    } catch (error) {
      console.error("Error loading regions from localStorage:", error);
      return [];
    }
  });
  
  // Save items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(items));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [items, planId]);

  // Group items by region
  const getItemsByRegion = () => {
    // Create a map to hold items grouped by region
    const groupedItems = new Map();
    
    // Add "Unassigned Items" category 
    groupedItems.set(null, []);
    
    // Initialize groups for each existing region
    regions.forEach(region => {
      if (region && region.id) { // Ensure region and region.id exist
        groupedItems.set(region.id, []);
      }
    });

    // Distribute items to their respective region groups
    items.forEach(item => {
      const regionId = item.regionId || null;
      if (groupedItems.has(regionId)) {
        groupedItems.get(regionId).push(item);
      } else if (regionId !== null) {
        // Handle case where an item's regionId exists but wasn't in the initial regions list (e.g., stale data)
        console.warn(`Item regionId '${regionId}' not found in current regions list. Grouping separately.`);
        groupedItems.set(regionId, [item]);
      }
      // If regionId is null, it's already handled by the initialization
    });
    
    return groupedItems;
  };

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
    const originalTitle = newItem.trim();
    if (originalTitle === '') return;

    setIsLoading(true);
    console.log("Adding item:", originalTitle);
    console.log("Manually selected region:", selectedRegion || 'None');

    let aiResult = {}; // Initialize empty AI result
    const needsAIDetails = !newItemDescription.trim() || !newItemLink.trim() || !newItemImage.trim();
    const needsAIRegion = !selectedRegion;
    const needsAICall = needsAIDetails || needsAIRegion;

    // --- Step 1: Call AI Function if needed --- 
    if (needsAICall) {
      const functionUrl = "https://processwishlistitem-vsjk6mhqqq-uc.a.run.app"; // Use the actual URL
      console.log(`Attempting AI call to: ${functionUrl}`);
      try {
        const response = await fetch(functionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: originalTitle,
            availableRegions: regions, 
            needsRegionSuggestion: needsAIRegion 
          }),
        });
  
        if (!response.ok) {
          const errorBody = await response.text();
          console.error("Cloud Function Error Response:", errorBody);
          // Throw an error to be caught by the catch block
          throw new Error(`Cloud Function request failed: ${response.status} ${response.statusText}`);
        }
  
        aiResult = await response.json();
        // Ensure expected fields exist, defaulting to null if not provided by AI
        aiResult.correctedTitle = aiResult.correctedTitle || originalTitle;
        aiResult.description = aiResult.description || null;
        aiResult.link = aiResult.link || null;
        aiResult.imageUrl = aiResult.imageUrl || null;
        aiResult.suggestedRegionId = aiResult.suggestedRegionId || null;

        console.log("Received AI Result:", aiResult);

      } catch (error) {
        console.error("Error calling Cloud Function:", error);
        // Reset aiResult on error to avoid using partial/bad data
        aiResult = {
            correctedTitle: originalTitle, // Fallback to original title on error
            description: null,
            link: null,
            imageUrl: null,
            suggestedRegionId: null
        };
        // Optional: Notify user the AI suggestions failed
        // alert("Could not get AI suggestions. Please fill in details manually.");
      }
    } else {
      console.log("No AI call needed, all details provided manually.");
      // Ensure aiResult structure is consistent even if no call was made
      aiResult = { 
          correctedTitle: originalTitle, 
          description: null, 
          link: null, 
          imageUrl: null, 
          suggestedRegionId: null 
      };
    }

    // --- Step 2: Determine Final Values --- 
    // Prioritize user input, then AI result (if available), then null.
    const finalTitle = aiResult.correctedTitle || originalTitle; // Use corrected title if available
    const finalDescription = newItemDescription.trim() || aiResult.description;
    const finalLink = newItemLink.trim() || aiResult.link;
    const finalImageUrl = newItemImage.trim() || aiResult.imageUrl;
    const finalRegionId = selectedRegion || aiResult.suggestedRegionId;

    console.log("Final Region ID determined:", finalRegionId || 'None');

    // --- Step 3: Prepare and Add Item --- 
    try {
      const id = finalTitle.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();

      const itemToAdd = {
        id,
        title: finalTitle,
        votes: 0,
        link: finalLink,
        imageUrl: finalImageUrl, 
        description: finalDescription,
        createdAt: new Date().toISOString(),
        planned: false,
        regionId: finalRegionId, 
      };
      
      console.log("Final item to add/update:", itemToAdd);

      // Add or Update item in state
      if (editIndex !== null) {
        const updated = [...items];
        itemToAdd.votes = updated[editIndex].votes;
        itemToAdd.planned = updated[editIndex].planned;
        itemToAdd.id = updated[editIndex].id; 
        updated[editIndex] = itemToAdd;
        setItems(updated);
        setEditIndex(null);
        console.log("Item updated.");
      } else {
        setItems([itemToAdd, ...items]);
        console.log("Item added.");
      }
      resetForm(); 

    } catch (stateError) {
      // Catch errors specifically related to updating state or resetting form
      console.error("Error updating state or resetting form:", stateError);
      alert(`Error saving item locally: ${stateError.message}`); 
    } finally {
      // This ensures loading state is always turned off
      setIsLoading(false);
      console.log("Finished addItem process.");
    }
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

  // Get items grouped by region
  const itemsByRegion = getItemsByRegion();

  // Map region names to icons (adjust as needed)
  const regionIcons = {
    'Tokyo Area': '🗼',
    'Kyoto Region': '⛩️',
    'Osaka': '🏯',
    'Hokkaido': '🏔️',
    'Reykjavik': '🏘️',
    'Golden Circle': '⭕',
    'South Coast': '🌊',
    // Add more mappings here
  };

  // Render a card for an item 
  const renderItemCard = (item) => {
    const regionDetails = getRegionDetails(item.regionId);
    const itemIndex = items.findIndex(i => i.id === item.id);

    return (
      <div key={item.id} className="col-lg-3 col-md-6 col-12">
        <div className="card h-100">
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
            <h5 className="card-title text-truncate" style={{ textAlign: 'center' }}>
              {item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-info">
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </h5>
            
            {item.description && (
              <p className="card-text description-text" style={{ textAlign: 'center' }}>
                {item.description}
              </p>
            )}
          </div>
          
          {regionDetails && (
            <div className="region-info mb-2 px-3 d-flex justify-content-center" style={{ fontSize: '0.8rem' }}>
              <span className="badge rounded-pill bg-info text-dark px-2 py-1">
                {regionDetails.name}
              </span>
            </div>
          )}
        
          <div className="card-footer">
            <div className="d-flex justify-content-between align-items-center mt-2 mb-2"> 
              <div className="d-flex align-items-center">
                <span className="me-2">{item.votes} votes</span>
                <button 
                  onClick={() => upvoteItem(itemIndex)} 
                  className="btn btn-sm btn-outline-primary"
                  title="Upvote"
                  disabled={itemIndex === -1} 
                >
                  👍
                </button>
              </div>
              
              <div className="btn-group">
                <button 
                  onClick={() => editItem(itemIndex)} 
                  className="btn btn-sm btn-outline-secondary"
                  title="Edit"
                  disabled={itemIndex === -1} 
                >
                  ✏️
                </button>
                <button 
                  onClick={() => deleteItem(itemIndex)} 
                  className="btn btn-sm btn-outline-danger"
                  title="Delete"
                  disabled={itemIndex === -1} 
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
                    handleAddToPlan(item); 
                  }}
                  disabled={item.planned}
                >
                  {item.planned ? 'Added to Plan' : 'Add to Plan'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render region section with header and cards
  const renderRegionSection = (regionId, regionItems) => {
    if (!regionItems || regionItems.length === 0) return null; 
    
    const regionDetails = getRegionDetails(regionId);
    const regionName = regionDetails ? regionDetails.name : 'Unassigned Items';
    const icon = regionDetails ? (regionIcons[regionDetails.name] || '📍') : '❓';
    
    return (
      <div key={regionId || 'no-region'} className="region-section mb-5">
        <div className="region-header mb-3">
          <h3 className="fs-4 fw-semibold text-white-50 mt-5 border-bottom border-secondary pb-2 text-center">
            <span className="me-2">{icon}</span> 
            {regionName}
          </h3>
        </div>
        <div className="row g-4">
          {regionItems.map((item) => renderItemCard(item))} 
        </div>
      </div>
    );
  };

  return (
    <div className="wishlist-container">
      {/* Remove this Wishlist header */}
      {/* 
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Wishlist</h2>
      </div>
      */}
      
      {/* Add Item Form */}
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
              More Options ▼ 
            </button>
          ) : (
            <div className={`expanded-form ${expandedForm ? 'show' : ''}`}>
              <input
                type="text"
                className="form-control mb-3"
                value={newItemLink}
                onChange={(e) => setNewItemLink(e.target.value)}
                placeholder="Link (optional - AI can suggest)"
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <input
                type="text"
                className="form-control mb-3"
                value={newItemImage}
                onChange={(e) => setNewItemImage(e.target.value)}
                placeholder="Image URL (optional - AI can suggest)"
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <textarea
                className="form-control mb-3"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Description (optional - AI can suggest)"
                rows="3"
                disabled={isLoading}
              />
              
              <div className="mb-3">
                  <label htmlFor="regionSelect" className="form-label" style={{ fontSize: '0.85rem' }}>Region (optional - AI can suggest)</label>
                  <select 
                      id="regionSelect"
                      className="form-select form-select-sm"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      disabled={isLoading}
                  >
                      <option value="">Auto-suggest Region...</option>
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
                <button 
                    onClick={() => setExpandedForm(false)} 
                    className="btn btn-outline-secondary ms-auto"
                    title="Collapse Options"
                    type="button"
                 >
                    ▲
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {items.length > 0 ? (
        <div>
          {renderRegionSection(null, itemsByRegion.get(null))}
          
          {Array.from(itemsByRegion.entries())
            .filter(([regionId, regionItems]) => regionId !== null && regionItems && regionItems.length > 0)
            .map(([regionId, regionItems]) => 
              renderRegionSection(regionId, regionItems)
            )
          }
        </div>
      ) : (
        <div className="alert alert-info text-center">
          Your wishlist is empty. Add some places you'd like to visit!
        </div>
      )}
      
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

      <style jsx="true">{`
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
        
        .region-header h3 {
          color: #6c757d;
        }
        
        .region-info .badge {
          background: linear-gradient(135deg, #3b5998 0%, #1e3c72 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.4em 0.6em;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .region-info .badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
        }

        .expanded-form {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.5s ease-out; 
          opacity: 0;
          transition: max-height 0.5s ease-out, opacity 0.3s ease-out;
        }

        .expanded-form.show {
          max-height: 500px;
          opacity: 1;
          transition: max-height 0.5s ease-in, opacity 0.3s 0.1s ease-in;
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