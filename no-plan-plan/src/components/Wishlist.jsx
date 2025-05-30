import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase-config';
import useTripConfig from '../hooks/useTripConfig';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase-config';

function Wishlist({ planId, onAddToPlanning }) {
  const navigate = useNavigate();
  const { config: tripConfig, isLoading: configLoading } = useTripConfig(planId);
  
  // Debug on mount
  useEffect(() => {
    console.log("Wishlist component mounted with props:", { planId, hasOnAddToPlanning: !!onAddToPlanning });
    
    return () => {
      console.log("Wishlist component unmounted");
    };
  }, [planId, onAddToPlanning]);

  // Default sample data for new trips
  let initialItems = [];
  
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [newItemLink, setNewItemLink] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [expandedForm, setExpandedForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [showAddToPlanModal, setShowAddToPlanModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [regions, setRegions] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  // Controls visibility of the add-wish form card
  const [showForm, setShowForm] = useState(false);
  
  // Ref to top add/edit form card
  const formRef = useRef(null);
  
  // Fetch wishlist items from Firestore
  useEffect(() => {
    if (!planId) {
      setItems(initialItems);
      setIsLoading(false);
      return;
    }
    
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        // Fetch wishlist items
        const wishlistRef = collection(db, `trips/${planId}/wishlist`);
        const querySnapshot = await getDocs(wishlistRef);
        
        const fetchedItems = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedItems.push({
            id: doc.id,
            title: data.title,
            votes: data.votes || 0,
            link: data.link || '',
            imageUrl: data.imageUrl || '',
            description: data.description || '',
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            planned: data.planned || false,
            regionId: data.regionId || null
          });
        });
        
        // Sort items by createdAt date (newest first)
        fetchedItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // If there are no items, seed with sample wishlist from tripConfig
        if (fetchedItems.length === 0 && tripConfig?.sampleWishlist?.length > 0) {
          initialItems = tripConfig.sampleWishlist.map((item) => ({
            ...item,
            createdAt: new Date().toISOString(),
            planned: false,
          }));
          
          // Save sample data to Firestore with error handling
          try {
            for (const item of initialItems) {
              await setDoc(doc(db, `trips/${planId}/wishlist`, item.id), item);
            }
          } catch (saveError) {
            console.error("Error saving sample data to Firestore:", saveError);
          }
          setItems(initialItems);
        } else {
          setItems(fetchedItems);
        }
      } catch (error) {
        console.error("Error fetching wishlist items from Firestore:", error);
        
        // Fallback to localStorage if available
        try {
          const localData = localStorage.getItem(`wishlist-${planId}`);
          if (localData) {
            setItems(JSON.parse(localData));
            console.log("Using cached wishlist data from localStorage due to Firestore error");
          } else {
            // If no localStorage data, use empty array or default samples
            if (tripConfig?.sampleWishlist?.length > 0) {
              setItems(tripConfig.sampleWishlist);
            } else {
              setItems([]);
            }
          }
        } catch (localStorageError) {
          console.error("Error accessing localStorage:", localStorageError);
          setItems([]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchItems();
  }, [planId, tripConfig]);

  // Fetch regions from Firestore
  useEffect(() => {
    if (!planId) {
      setRegions([]);
      return;
    }
    
    const fetchRegions = async () => {
      try {
        const regionsRef = collection(db, `trips/${planId}/regions`);
        const querySnapshot = await getDocs(regionsRef);
        
        const fetchedRegions = [];
        querySnapshot.forEach((doc) => {
          fetchedRegions.push({
            id: doc.id,
            name: doc.data().name,
            notes: doc.data().notes || ''
          });
        });
        
        // If no regions found for the trip, add default regions
        if (fetchedRegions.length === 0 && tripConfig?.defaultRegions?.length > 0) {
          const defaultRegions = tripConfig.defaultRegions;
          try {
            for (const region of defaultRegions) {
              await setDoc(doc(db, `trips/${planId}/regions`, region.id), {
                name: region.name,
                notes: region.notes,
                createdAt: new Date()
              });
            }
            fetchedRegions.push(...defaultRegions);
          } catch (saveError) {
            console.error("Error saving default regions to Firestore:", saveError);
          }
        }
        
        console.log(`Loaded ${fetchedRegions.length} regions for trip ${planId} from Firestore`);
        setRegions(fetchedRegions);
        
        // Optional: Check for wishlist items that have regionIds that don't match any known regions
        // and update them to use the correct region IDs
        await synchronizeWishlistItemRegions(fetchedRegions);
        
    } catch (error) {
        console.error("Error fetching regions from Firestore:", error);
        setRegions([]);
    }
    };
    
    // Additional function to synchronize wishlist item regions
    const synchronizeWishlistItemRegions = async (availableRegions) => {
      if (!planId || availableRegions.length === 0) return;
      
      try {
        // Get all wishlist items
        const wishlistRef = collection(db, `trips/${planId}/wishlist`);
        const wishlistSnapshot = await getDocs(wishlistRef);
        
        // Map of known region IDs
        const knownRegionIds = new Set(availableRegions.map(r => r.id));
        
        // Mapping of common incorrect region IDs to correct ones
        const regionIdMappings = {
          'tokyo-region': availableRegions.find(r => r.name.includes('Tokyo'))?.id || 'region0',
          'region-1745093297553': availableRegions.find(r => r.name.includes('Hokkaido'))?.id
        };
        
        // Check each wishlist item
        for (const doc of wishlistSnapshot.docs) {
          const item = doc.data();
          const itemRegionId = item.regionId;
          
          // If the item has a regionId, but it's not in our known regions, update it
          if (itemRegionId && !knownRegionIds.has(itemRegionId)) {
            console.log(`Fixing wishlist item "${item.title}" with unknown regionId: ${itemRegionId}`);
            
            // Try to map to a known region ID
            let newRegionId = regionIdMappings[itemRegionId];
            
            // If we have a mapping for this region ID, update the item
            if (newRegionId) {
              console.log(`Updating regionId to ${newRegionId}`);
              await updateDoc(doc.ref, { regionId: newRegionId });
            }
          }
        }
      } catch (error) {
        console.error("Error synchronizing wishlist item regions:", error);
      }
    };
    
    fetchRegions();
  }, [planId, tripConfig]);

  // Group items by region
  const getItemsByRegion = () => {
    // Create a map to hold items grouped by region
    const groupedItems = new Map();
    
    // Add "Unassigned Items" category 
    groupedItems.set(null, []);
    
    // Create a map of region names to IDs for smarter grouping
    const regionNameMap = new Map();
    regions.forEach(region => {
      if (region && region.name) {
        regionNameMap.set(region.name.toLowerCase(), region.id);
      }
    });
    
    // Initialize groups for each existing region
    regions.forEach(region => {
      if (region && region.id) { // Ensure region and region.id exist
        groupedItems.set(region.id, []);
      }
    });

    // Create a set of unknown region IDs to avoid duplicate console warnings
    const unknownRegionIds = new Set();

    // Distribute items to their respective region groups
    items.forEach(item => {
      const regionId = item.regionId || null;
      if (groupedItems.has(regionId)) {
        // Regular case - region ID matches a known region
        groupedItems.get(regionId).push(item);
      } else if (regionId !== null) {
        // Case where an item's regionId exists but wasn't in our known regions
        
        // Only log warning once per unknown region ID to avoid console spam
        if (!unknownRegionIds.has(regionId)) {
          unknownRegionIds.add(regionId);
          
          // Less alarming message - just note we're handling it
          console.log(`Grouping items with regionId '${regionId}' separately.`);
        }
        
        // Add the unknown region to the map if it doesn't exist yet
        if (!groupedItems.has(regionId)) {
          groupedItems.set(regionId, []);
        }
        groupedItems.get(regionId).push(item);
      }
      // If regionId is null, it goes to the "Unassigned Items" group created earlier
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

  // Simplified addItem: store exactly what the user typed, no AI, no auto-fills
  const addItem = async () => {
    const title = newItem.trim();
    if (!title) return;

    setIsLoading(true);

    const id = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const itemData = {
      title,
      votes: 0,
      link: newItemLink.trim(),
      imageUrl: newItemImage.trim(),
      description: newItemDescription.trim(),
      createdAt: new Date(),
      planned: false,
      regionId: selectedRegion || null
    };

    try {
      if (editIndex !== null) {
        // Update existing item
        const original = items[editIndex];
        await setDoc(doc(db, `trips/${planId}/wishlist`, original.id), {
          ...itemData,
          votes: original.votes,
          planned: original.planned
        }, { merge: true });

        const updatedItems = [...items];
        updatedItems[editIndex] = { ...itemData, id: original.id, createdAt: itemData.createdAt.toISOString() };
        setItems(updatedItems);
        setEditIndex(null);
      } else {
        // Create new
        await setDoc(doc(db, `trips/${planId}/wishlist`, id), itemData);
        setItems([{ ...itemData, id, createdAt: itemData.createdAt.toISOString() }, ...items]);
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Error saving item:', err);
      alert('Error saving item');
    } finally {
      setIsLoading(false);
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

  const upvoteItem = async (index) => {
    if (!planId || index < 0 || index >= items.length) return;
    
    const item = items[index];
    const newVotes = item.votes + 1;
    
    try {
      // Update in Firestore
      await updateDoc(doc(db, `trips/${planId}/wishlist`, item.id), {
        votes: newVotes
      });
      
      // Update local state
      const updatedItems = [...items];
      updatedItems[index] = { ...item, votes: newVotes };
      setItems(updatedItems);
    } catch (error) {
      console.error("Error updating votes in Firestore:", error);
    }
  };

  const deleteItem = async (index) => {
    if (!planId || index < 0 || index >= items.length) return;
    
    const item = items[index];
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, `trips/${planId}/wishlist`, item.id));
      
      // Update local state
      const updatedItems = [...items];
      updatedItems.splice(index, 1);
      setItems(updatedItems);
      
      // Handle edit form state
    if (editIndex === index) {
      resetForm();
      setEditIndex(null);
    } else if (editIndex !== null && index < editIndex) {
      setEditIndex(editIndex - 1);
      }
    } catch (error) {
      console.error("Error deleting item from Firestore:", error);
    }
  };

  const editItem = (index) => {
    if (index < 0 || index >= items.length) return;
    
    const item = items[index];
    setNewItem(item.title);
    setNewItemLink(item.link || '');
    setNewItemImage(item.imageUrl || '');
    setNewItemDescription(item.description || '');
    setShowForm(true);
    setExpandedForm(true);
    setEditIndex(index);
    setSelectedRegion(item.regionId || '');

    // After state updates, scroll form into view so user sees it
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Fallback to top scroll
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 0);
  };

  const cancelEdit = () => {
    resetForm();
    setEditIndex(null);
    setShowForm(false);
  };
  
  const handleAddToPlan = (item) => {
    console.log("handleAddToPlan called for item:", item.title);
    setSelectedItem(item);
    
    // If onAddToPlanning is provided, directly create activity data
    // and pass it to the parent component (embedded mode)
    if (onAddToPlanning) {
      console.log("Embedded mode: passing data directly to parent");
      const activityData = {
        title: item.title,
        description: item.description || '',
        location: '',
        day: 1, // This will be overridden by the parent component
        wishlistItemId: item.id,
        createdAt: new Date()
      };
      onAddToPlanning(activityData);
    } else {
      // Otherwise, show the day selector modal (standalone mode)
      console.log("Standalone mode: showing day selector modal");
      setShowAddToPlanModal(true);

      // Force a re-render to ensure the modal is shown
      setTimeout(() => {
        const modal = document.querySelector('.custom-modal-overlay');
        if (modal) {
          console.log("Modal is visible in the DOM");
        } else {
          console.warn("Modal not found in DOM after setting showAddToPlanModal=true");
        }
      }, 100);
    }
  };
  
  const confirmAddToPlan = async (day) => {
    if (!day) {
      console.log("No day selected, cannot continue");
      return;
    }
    console.log(`Adding ${selectedItem?.title} to day ${day}`);
    
    if (!selectedItem || !planId) {
      console.error("Missing selectedItem or planId:", { selectedItem, planId });
      return;
    }
    
    try {
      // Mark the item as planned in Firestore
      await updateDoc(doc(db, `trips/${planId}/wishlist`, selectedItem.id), {
        planned: true
      });
      console.log(`Updated wishlist item as planned in Firestore`);
      
      // Update local state
      const updatedItems = items.map(item => 
        item.id === selectedItem.id ? {...item, planned: true} : item
      );
      setItems(updatedItems);
      
      // Create an activity from this wishlist item
      const activityData = {
        title: selectedItem.title,
        description: selectedItem.description || '',
        location: '',
        day: day,
        wishlistItemId: selectedItem.id,
        createdAt: new Date()
      };
      
      console.log("Created activity data:", activityData);
      
      // Call the provided callback or save to Firestore and navigate
      if (onAddToPlanning) {
        console.log("Using provided onAddToPlanning callback");
        onAddToPlanning(activityData);
      } else if (planId) {
        // Save activity to Firestore
        const activityId = `activity-${Date.now()}`;
        console.log(`Creating new activity with ID: ${activityId}`);
        
        await setDoc(doc(db, `trips/${planId}/activities`, activityId), {
          ...activityData, 
          createdAt: activityData.createdAt // Keep the Date object
        });
        
        console.log("Successfully added activity to Firestore, navigating to planning page");
        // Navigate to the planning page
        navigate(`/trip/${planId}/planning`);
      }
    } catch (error) {
      console.error("Error adding item to plan:", error);
      alert("Error adding item to plan: " + error.message);
    } finally {
      // Close the modal
      setShowAddToPlanModal(false);
      setSelectedItem(null);
    }
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
    
    // Find the region in our loaded regions
    const region = regions.find(r => r.id === regionId);
    
    // If found, return it
    if (region) return region;
    
    // If not found, use a smart fallback system
    
    // Create a regionId to name mapping object for common known IDs
    const knownRegionMap = {
      'region0': 'Tokyo Area',
      'tokyo-region': 'Tokyo Area',
      'kyoto-region': 'Kyoto Region',
      'osaka-region': 'Osaka',
      'region1': 'Golden Circle',
      'region-1745093297553': 'Hokkaido',
      'south-region': 'South Coast'
    };
    
    // Try to extract region name from the ID if it's not in our mapping
    let regionName = knownRegionMap[regionId];
    if (!regionName) {
      // Extract name from format like region-name or regionName
      const nameMatch = regionId.match(/(?:region[-_]?)?(.*)/i);
      if (nameMatch && nameMatch[1]) {
        // Convert kebab/snake case to title case
        regionName = nameMatch[1]
          .replace(/[-_]/g, ' ')
          .replace(/([A-Z])/g, ' $1') // Add space before capitals in camelCase
          .trim()
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else {
        regionName = 'Unknown Region';
      }
    }
    
    // Only log this once per page load to avoid spamming the console
    if (!window._loggedRegionWarnings) window._loggedRegionWarnings = new Set();
    
    if (!window._loggedRegionWarnings.has(regionId)) {
      console.log(`Using default name "${regionName}" for region ID '${regionId}'`);
      window._loggedRegionWarnings.add(regionId);
    }
    
    return {
      id: regionId,
      name: regionName,
      notes: ''
    };
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

  // Function to handle adding item to plan from the item card
  const handleCardAddToPlan = (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Add to Plan button clicked for item:", item.title);
    handleAddToPlan(item);
    return false; // Prevent default and stop propagation
  };

  // Render a card for an item 
  const renderItemCard = (item) => {
    const regionDetails = getRegionDetails(item.regionId);
    const itemIndex = items.findIndex(i => i.id === item.id);

    return (
      <div key={item.id} className="col-lg-3 col-md-6 col-12">
        <div className="card h-100 position-relative">
          {/* Planned ribbon/badge */}
          {item.planned && (
            <div className="planned-badge">
              <span className="badge bg-success">
                ✅ Planned
              </span>
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
                {planId && (
                  <Link 
                    to={`/trip/${planId}/wishlist/${item.id}/guide`} 
                    className="btn btn-sm btn-outline-info"
                    title="View Guide"
                    style={{ textDecoration: 'none' }}
                  >
                    📖
                  </Link>
                )}
                <button 
                  onClick={(e) => editItem(itemIndex)} 
                  className="btn btn-sm btn-outline-secondary"
                  title="Edit"
                  disabled={itemIndex === -1} 
                >
                  ✏️
                </button>
                <button 
                  onClick={(e) => deleteItem(itemIndex)} 
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
                {item.planned && !onAddToPlanning ? (
                  <Link 
                    to={`/trip/${planId}/planning`}
                    className="btn btn-sm btn-success w-100"
                  >
                    Added to Plan
                  </Link>
                ) : (
                  <form onSubmit={(e) => handleCardAddToPlan(item, e)}>
                    <button
                      type="submit"
                      className="btn btn-sm btn-outline-success w-100"
                    >
                      Add to Plan
                    </button>
                  </form>
                )}
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
      {/* Add Item Form */}
      {showForm && (
      <div className="card bg-dark mb-4" ref={formRef}>
        <div className="card-body">
          <input
            type="text"
            className="form-control mb-3"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Wish title..."
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
                placeholder="Link (optional)"
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  value={newItemImage}
                  onChange={(e) => setNewItemImage(e.target.value)}
                  placeholder="Image URL (optional)"
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || uploadProgress !== null}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  disabled={!newItemImage || uploadProgress !== null}
                  title="Import image to Firebase Storage"
                  onClick={async () => {
                    if (!newItemImage.startsWith('http')) return;
                    try {
                      setUploadProgress(0);
                      const resp = await fetch(newItemImage);
                      const blob = await resp.blob();
                      const ext = blob.type.split('/')[1] || 'jpg';
                      const path = `trips/${planId}/wishlist/temp_${Date.now()}.${ext}`;
                      const imgRef = storageRef(storage, path);
                      const uploadTask = uploadBytesResumable(imgRef, blob, { contentType: blob.type });
                      uploadTask.on('state_changed', (snap) => {
                        setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
                      }, (err) => {
                        console.error('Upload error', err);
                        alert('Image upload failed');
                        setUploadProgress(null);
                      }, async () => {
                        const downloadURL = await getDownloadURL(imgRef);
                        setNewItemImage(downloadURL);
                        setUploadProgress(null);
                      });
                    } catch (err) {
                      console.error('Import failed', err);
                      alert('Failed to import image');
                      setUploadProgress(null);
                    }
                  }}
                >Import</button>
              </div>
              <input
                type="file"
                accept="image/*"
                className="form-control mb-3"
                disabled={isLoading || uploadProgress !== null}
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setUploadProgress(0);
                  const ext = file.name.split('.').pop();
                  const path = `trips/${planId}/wishlist/temp_${Date.now()}.${ext}`;
                  const imgRef = storageRef(storage, path);
                  const uploadTask = uploadBytesResumable(imgRef, file, { contentType: file.type });
                  uploadTask.on('state_changed', (snap) => {
                    setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
                  }, (err) => {
                    console.error('Upload error', err);
                    alert('Image upload failed');
                    setUploadProgress(null);
                  }, async () => {
                    const downloadURL = await getDownloadURL(imgRef);
                    setNewItemImage(downloadURL);
                    setUploadProgress(null);
                  });
                }}
              />
              {uploadProgress !== null && (
                <div className="progress mb-3">
                  <div className="progress-bar" style={{width: `${uploadProgress}%`}} />
                </div>
              )}
              <textarea
                className="form-control mb-3"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Description (optional)"
                rows="3"
                disabled={isLoading}
              />
              
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
      )}

      {/* Toggle Add-wish button */}
      <div className="mt-5 mb-4 d-flex justify-content-center">
        <button
          className="btn create-wish-btn"
          onClick={() => {
            if (showForm) {
              resetForm();
              setExpandedForm(false);
            }
            setShowForm(!showForm);
            // Scroll into view when opening the form
            if (!showForm) {
              setTimeout(() => {
                if (formRef.current) {
                  formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 0);
            }
          }}
        >
          {showForm ? 'Cancel' : (<><span className="plus-icon me-2">➕</span>Make a Wish</>)}
        </button>
      </div>

      {isLoading && items.length === 0 ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading wishlist items...</p>
        </div>
      ) : items.length > 0 ? (
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
      
      {showAddToPlanModal && selectedItem && (
        <div className="custom-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div className="custom-modal" style={{
            backgroundColor: '#2d3748',
            borderRadius: '0.5rem',
            padding: '1rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
            zIndex: 10000
          }}>
            <div className="custom-modal-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #4a5568',
              paddingBottom: '0.75rem',
              marginBottom: '1rem'
            }}>
              <h5 style={{margin: 0, fontSize: '1.25rem', fontWeight: 'bold'}}>Add to Plan</h5>
              <button 
                onClick={() => setShowAddToPlanModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#a0aec0'
                }}
              >
                ×
              </button>
            </div>
            <div className="custom-modal-body" style={{marginBottom: '1rem'}}>
              <p>Add <strong>{selectedItem.title}</strong> to which day?</p>
              <div className="form-group">
                <select 
                  className="form-select"
                  id="planDay"
                  onChange={(e) => {
                    const dayValue = e.target.value ? parseInt(e.target.value) : null;
                    console.log(`Day selected: ${dayValue}`);
                    // Set data attribute to store selection
                    e.target.dataset.selectedDay = dayValue;
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    backgroundColor: '#1a202c',
                    color: 'white',
                    border: '1px solid #4a5568',
                    borderRadius: '0.25rem'
                  }}
                >
                  <option value="">Select a day...</option>
                  {Array.from({ length: 16 }, (_, i) => (
                    <option key={i+1} value={i+1}>Day {i+1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="custom-modal-footer" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              borderTop: '1px solid #4a5568',
              paddingTop: '0.75rem',
              gap: '0.5rem'
            }}>
              <button 
                onClick={() => setShowAddToPlanModal(false)}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#4a5568',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const select = document.getElementById('planDay');
                  const selectedDay = select.value ? parseInt(select.value) : null;
                  console.log(`Submitting with day: ${selectedDay}`);
                  if (selectedDay) {
                    confirmAddToPlan(selectedDay);
                  } else {
                    alert("Please select a day first");
                  }
                }}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#3182ce',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                Add to Plan
              </button>
            </div>
          </div>
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
          left: 10px;
          z-index: 10;
        }
        
        .planned-badge .badge {
          font-size: 0.7rem;
          padding: 0.35em 0.65em;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          animation: fadeIn 0.3s;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 2000;
        }
        
        .modal.show {
          display: block !important;
          z-index: 2001;
        }

        .modal-dialog {
          position: relative;
          z-index: 2002;
          margin: 1.75rem auto;
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

        /* Add-wish button styling (mirrors HomePage create-plan-btn) */
        .create-wish-btn {
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

        .create-wish-btn:hover {
          background-color: #1d4ed8;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 6px 10px rgba(37, 99, 235, 0.3);
        }

        .create-wish-btn:active {
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

// Default props
Wishlist.defaultProps = {
  planId: null,
  onAddToPlanning: null
};

export default Wishlist; 