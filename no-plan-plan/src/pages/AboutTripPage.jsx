import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config';
import useTripConfig from '../hooks/useTripConfig'; // Import the hook
import { guideTopics as defaultGuideTopics, slugify } from '../constants';

function AboutTripPage() {
  const { tripId } = useParams();
  const { config: tripConfig, isLoading: configLoading, refetch: refetchTripConfig } = useTripConfig(tripId);
  const [newGuideTitle, setNewGuideTitle] = useState('');
  const [newGuideDescription, setNewGuideDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // For editing existing guide descriptions
  const [editingGuide, setEditingGuide] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  // Prefetch guide content on page load
  useEffect(() => {
    // Only run if tripConfig is loaded and has guides
    if (!tripId || !tripConfig || !tripConfig.topicGuides || tripConfig.topicGuides.length === 0) return;

    const prefetchGuides = async () => {
      console.log('Prefetching guides based on tripConfig:', tripConfig.topicGuides);
      for (const topic of tripConfig.topicGuides) {
        try {
          const primaryPath = `trips/${tripId}/topic-guides`;
          const fallbackPath = `trips/${tripId}/guides`;
          
          const primaryRef = doc(db, primaryPath, topic.id);
          getDoc(primaryRef).catch(() => {}); // Fire and forget prefetch
          
          const fallbackRef = doc(db, fallbackPath, topic.id);
          getDoc(fallbackRef).catch(() => {}); // Fire and forget prefetch
        } catch (e) {
          console.log(`Error prefetching guide ${topic.id}:`, e);
        }
      }
    };
    
    prefetchGuides();
  }, [tripId, tripConfig]); // Depend on tripConfig
  
  // --- TEMPORARY: One-time data migration for japan-2025 --- 
  useEffect(() => {
    const migrateJapanGuides = async () => {
      console.log('Checking if japan-2025 needs topicGuides migration...');
      const japanTopicGuides = [
        { id: 'history', title: 'History Overview', emoji: '📜', description: 'From ancient myths to bullet trains in 2,000 years.' },
        { id: 'religion-culture', title: 'Religion & Culture', emoji: '🧘‍♀️', description: 'Shrines, rituals, and 8 million kami to discover.' },
        { id: 'modern-japan', title: 'Modern Japan', emoji: '💸', description: 'More than vending machines (but yes, vending machines too).' },
        { id: 'etiquette', title: 'Etiquette & Behavior', emoji: '🍣', description: 'Essential customs to avoid ancestral insults.' },
        { id: 'fun-facts', title: 'Fun Facts & Family', emoji: '🧠', description: 'Fascinating tidbits that will make the kids think you\'re smart.' },
        { id: 'food', title: 'Japanese Cuisine', emoji: '🍱', description: 'Discover the rich flavors and traditions of Japanese food.' }
      ];

      try {
        const tripRef = doc(db, 'trips', 'japan-2025');
        await updateDoc(tripRef, {
          topicGuides: japanTopicGuides
        }, { merge: true }); // Use merge: true to avoid overwriting other fields
        console.log('Successfully migrated topicGuides for japan-2025 to Firestore.');
        // Optionally force a refresh or rely on the next load?
        // For simplicity, we'll let the existing config load handle it or refresh manually.
      } catch (error) {
        console.error('Error migrating japan-2025 topicGuides:', error);
      }
    };

    // Run only if config is loaded, it's japan-2025, and guides are missing
    if (!configLoading && tripId === 'japan-2025' && (!tripConfig?.topicGuides || tripConfig.topicGuides.length === 0)) {
      migrateJapanGuides();
    }
  }, [tripId, tripConfig, configLoading]); // Depend on loading state and config
  // --- END TEMPORARY MIGRATION ---
  
  // Function to prefetch a specific guide when hovering
  const prefetchGuide = async (topicId) => {
    if (!tripId) return;
    
    try {
      const primaryRef = doc(db, `trips/${tripId}/topic-guides`, topicId);
      const fallbackRef = doc(db, `trips/${tripId}/guides`, topicId);
      
      // Don't wait for these, just trigger the fetch
      getDoc(primaryRef).catch(() => null);
      getDoc(fallbackRef).catch(() => null);
      
      console.log(`Prefetched guide ${topicId} on hover (triggered)`);
    } catch (e) {
      console.log(`Error triggering prefetch for guide ${topicId}:`, e);
    }
  };

  // Handle adding a new custom guide
  const handleAddGuide = async () => {
    if (!newGuideTitle.trim()) {
      alert("Please enter a guide title");
      return;
    }

    if (isUpdating) return; // Prevent concurrent updates

    // Generate a slug from the title
    const newGuideId = slugify(newGuideTitle);
    
    // Check if ID already exists (case insensitive)
    if (tripConfig?.topicGuides?.some(g => g.id.toLowerCase() === newGuideId.toLowerCase())) {
      alert("A guide with a similar title already exists. Please choose a different title.");
      return;
    }
    
    setIsUpdating(true);
    try {
      // Create guide object with description from input or default
      const newGuide = {
        id: newGuideId,
        title: newGuideTitle.trim(),
        emoji: '📝', // Default emoji for custom guides
        description: newGuideDescription.trim() || 'Custom guide' // Use custom description if available
      };
      
      // Update trip config with the new guide
      const tripDocRef = doc(db, 'trips', tripId);
      const updatedGuides = [...(tripConfig?.topicGuides || []), newGuide];
      await updateDoc(tripDocRef, { topicGuides: updatedGuides });
      
      // Create an empty guide document in Firestore
      const guideDocRef = doc(db, `trips/${tripId}/topic-guides`, newGuideId);
      await setDoc(guideDocRef, {
        en: '', // Empty English content
        ru: '', // Empty Russian content
        lastUpdated: serverTimestamp()
      });
      
      console.log('Successfully added new guide:', newGuide);
      setNewGuideTitle(''); // Reset input field
      setNewGuideDescription(''); // Reset description field
      
      // Only call refetchTripConfig if it exists and is a function
      if (typeof refetchTripConfig === 'function') {
        try {
          await refetchTripConfig();
        } catch (refetchError) {
          console.warn('Could not refetch trip config:', refetchError);
          // Force a page refresh to show updated data
          window.location.reload();
        }
      } else {
        console.log('No refetch function available, reloading page to show updated guides');
        // Force a page refresh to show updated data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error adding new guide:', error);
      alert('Failed to add new guide. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle removing a guide
  const handleRemoveGuide = async (guideId, guideTitle) => {
    if (isUpdating) return; // Prevent concurrent updates
    
    // Check if this is a default guide
    const isDefaultGuide = Object.keys(defaultGuideTopics).includes(guideId);
    
    // Confirm deletion
    const confirmMessage = isDefaultGuide 
      ? `Are you sure you want to remove the "${guideTitle}" guide? This is a default guide and can be added back later.`
      : `Are you sure you want to remove the "${guideTitle}" guide? This action cannot be undone.`;
      
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsUpdating(true);
    try {
      // Update trip config without the removed guide
      const tripDocRef = doc(db, 'trips', tripId);
      const updatedGuides = tripConfig?.topicGuides?.filter(g => g.id !== guideId) || [];
      await updateDoc(tripDocRef, { topicGuides: updatedGuides });
      
      // Delete the guide document from Firestore
      // Try both locations (topic-guides and guides) since it could be in either
      try {
        const primaryGuideDocRef = doc(db, `trips/${tripId}/topic-guides`, guideId);
        await deleteDoc(primaryGuideDocRef);
      } catch (error) {
        console.log(`Guide not found in topic-guides or error deleting: ${error.message}`);
      }
      
      try {
        const fallbackGuideDocRef = doc(db, `trips/${tripId}/guides`, guideId);
        await deleteDoc(fallbackGuideDocRef);
      } catch (error) {
        console.log(`Guide not found in guides or error deleting: ${error.message}`);
      }
      
      console.log('Successfully removed guide:', guideId);
      
      // Only call refetchTripConfig if it exists and is a function
      if (typeof refetchTripConfig === 'function') {
        try {
          await refetchTripConfig();
        } catch (refetchError) {
          console.warn('Could not refetch trip config:', refetchError);
          // Force a page refresh to show updated data
          window.location.reload();
        }
      } else {
        console.log('No refetch function available, reloading page to show updated guides');
        // Force a page refresh to show updated data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error removing guide:', error);
      alert('Failed to remove guide. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle editing a guide (title and description)
  const handleEditGuide = async () => {
    if (!editingGuide || isUpdating) return;
    
    const finalTitle = editedTitle.trim();
    const finalDescription = editedDescription.trim();

    if (!finalTitle) {
      alert("Guide title cannot be empty.");
      return;
    }
    
    setIsUpdating(true);
    try {
      // Find and update the guide in the trip config
      const tripDocRef = doc(db, 'trips', tripId);
      const updatedGuides = tripConfig.topicGuides.map(guide => 
        guide.id === editingGuide.id 
          ? { ...guide, title: finalTitle, description: finalDescription || guide.description } // Update title and description
          : guide
      );
      
      await updateDoc(tripDocRef, { topicGuides: updatedGuides });
      console.log('Successfully updated guide details for:', editingGuide.id);
      
      // Reset state and close modal
      setEditingGuide(null);
      setEditedTitle('');
      setEditedDescription('');
      document.querySelector('#editGuideModal .btn-close').click(); // Close modal
      
      // Refresh the data
      if (typeof refetchTripConfig === 'function') {
        try {
          await refetchTripConfig();
        } catch (refetchError) {
          console.warn('Could not refetch trip config:', refetchError);
          window.location.reload(); // Fallback refresh
        }
      } else {
        window.location.reload(); // Fallback refresh
      }
    } catch (error) {
      console.error('Error updating guide details:', error);
      alert('Failed to update guide details. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Open edit guide modal
  const openEditGuideModal = (guide) => {
    setEditingGuide(guide);
    setEditedTitle(guide.title); // Set title state
    setEditedDescription(guide.description);
    // Open the modal using Bootstrap's API (assuming modal ID is updated)
    const modalElement = document.getElementById('editGuideModal');
    if (modalElement) {
       // Basic Bootstrap 5 modal opening
       const modal = new bootstrap.Modal(modalElement);
       modal.show();
    } else {
       console.error("Edit modal element not found");
       // Fallback if bootstrap object isn't available or ID is wrong
       document.getElementById('editGuideModal')?.classList.add('show', 'd-block');
    }
  };

  if (configLoading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading destination info...</p>
      </div>
    );
  }

  // Use tripConfig.topicGuides if available, otherwise an empty array
  const guides = tripConfig?.topicGuides || [];

  return (
    <div className="container mt-4 mb-5">
      {/* Header section */}
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-white">
          Know Before You Go
        </h1>
        <p className="lead text-light opacity-75 mb-3">
          Get smart on history, culture, etiquette, and the little things that make a big difference once you land.
        </p>
        <p className="text-primary fw-bold small text-uppercase letter-spacing-1 mb-4">
          Trip Knowledge Center
        </p>
      </div>

      {/* Cards grid */}
      {guides.length > 0 ? (
        <div className="guide-grid">
          {guides.map((topic, idx) => {
            const accentPalette = ['#3b82f6','#14b8a6','#eab308','#ec4899','#f97316','#0ea5e9'];
            const accent = accentPalette[idx % accentPalette.length];
            return (
              <div key={topic.id} className="guide-card" style={{ '--accent': accent, '--index': idx }}>
                <div className="d-flex flex-column h-100">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h3 className="card-title mb-0 text-white fs-5 fw-semibold">
                      {topic.emoji && <span className="me-2 fs-4">{topic.emoji}</span>}
                      {topic.title}
                    </h3>
                  </div>
                  <p className="card-text text-light opacity-75 mb-3 desc-clamp">
                    {topic.description}
                  </p>
                  <div className="mt-auto d-flex justify-content-between align-items-center">
                    <div>
                      <button 
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => openEditGuideModal(topic)}
                        title="Edit guide"
                        data-bs-toggle="modal"
                        data-bs-target="#editGuideModal"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveGuide(topic.id, topic.title)}
                        disabled={isUpdating}
                        title="Remove guide"
                      >
                        🗑️
                      </button>
                    </div>
                    <Link 
                      to={`/trip/${tripId}/guide/${topic.id}`}
                      className="btn btn-outline-primary btn-sm"
                      onMouseEnter={() => prefetchGuide(topic.id)}
                    >
                      Read Guide
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="alert alert-info text-center">
          No specific guides available for this destination yet.
        </div>
      )}

      {/* Add Guide button - similar to "Create New Plan" */}
      <div className="text-center mt-4 mb-5">
        <button 
          className="btn create-plan-btn"
          onClick={() => document.getElementById('addGuideModal').classList.add('show', 'd-block')}
          data-bs-toggle="modal" 
          data-bs-target="#addGuideModal"
        >
          <span className="plus-icon me-2">➕</span>Create New Guide
        </button>
      </div>

      {/* Modal for adding a new guide */}
      <div className="modal fade" id="addGuideModal" tabIndex="-1" aria-labelledby="addGuideModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content bg-dark text-white">
            <div className="modal-header border-secondary">
              <h5 className="modal-title" id="addGuideModalLabel">Create New Guide</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="guideTitle" className="form-label">Guide Title</label>
                <input
                  type="text"
                  className="form-control bg-dark text-light border-secondary"
                  id="guideTitle"
                  placeholder="Enter guide title (e.g. Travel Tips, Local Phrases)"
                  value={newGuideTitle}
                  onChange={(e) => setNewGuideTitle(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="guideDescription" className="form-label">Guide Description</label>
                <textarea
                  className="form-control bg-dark text-light border-secondary"
                  id="guideDescription"
                  placeholder="Enter guide description"
                  value={newGuideDescription}
                  onChange={(e) => setNewGuideDescription(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
            </div>
            <div className="modal-footer border-secondary">
              <button 
                type="button" 
                className="btn btn-secondary" 
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => {
                  handleAddGuide();
                  // Close modal if successful (using jQuery or DOM API)
                  if (newGuideTitle.trim()) {
                    document.querySelector('#addGuideModal .btn-close').click();
                  }
                }}
                disabled={isUpdating || !newGuideTitle.trim()}
              >
                {isUpdating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding...
                  </>
                ) : (
                  'Create Guide'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal for editing guide (title and description) */}
      <div className="modal fade" id="editGuideModal" tabIndex="-1" aria-labelledby="editGuideModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content bg-dark text-white">
            <div className="modal-header border-secondary">
              <h5 className="modal-title" id="editGuideModalLabel">
                Edit Guide
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="editGuideTitle" className="form-label">Guide Title</label>
                <input
                  type="text"
                  className="form-control bg-dark text-light border-secondary"
                  id="editGuideTitle"
                  placeholder="Enter guide title"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editGuideDescription" className="form-label">Guide Description</label>
                <textarea
                  className="form-control bg-dark text-light border-secondary"
                  id="editGuideDescription"
                  placeholder="Enter guide description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  disabled={isUpdating}
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer border-secondary">
              <button 
                type="button" 
                className="btn btn-secondary" 
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleEditGuide}
                disabled={isUpdating || !editedTitle.trim()}
              >
                {isUpdating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
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

        /* New Guide Grid Styles */
        .guide-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
          gap:1.5rem;
        }

        .guide-card{
          background:rgba(255,255,255,0.04);
          backdrop-filter:blur(4px);
          border-radius:.75rem;
          padding:1.25rem 1.25rem 1rem;
          border:2px solid transparent;
          border-image:linear-gradient(135deg,var(--accent),rgba(255,255,255,0)) 1;
          animation:fadeIn .4s ease forwards;
          animation-delay:calc(var(--index)*60ms);
          opacity:0;
          transition:transform .25s,box-shadow .25s,border-color .25s;
        }
        .guide-card:hover{
          transform:translateY(-4px) scale(1.02);
          box-shadow:0 10px 25px rgba(0,0,0,.35);
          border-color:var(--accent);
        }

        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

        .btn-icon{
          background:transparent;
          border:none;
          color:#cbd5e1;
          opacity:.6;
          transition:opacity .15s,color .15s;
          padding:0;
        }
        .btn-icon:hover{opacity:1;color:#ef4444}

        /* Clamp description to 4 lines */
        .desc-clamp{
          display:-webkit-box;
          -webkit-line-clamp:4;
          -webkit-box-orient:vertical;
          overflow:hidden;
        }
      `}</style>

      {/* Back button */}
      <div className="text-center mt-5">
        <Link 
          to={`/trip/${tripId}`} 
          id="back-to-dashboard"
          className="btn btn-outline-light"
        >
          Back to Trip Dashboard
        </Link>
      </div>
    </div>
  );
}

export default AboutTripPage; 