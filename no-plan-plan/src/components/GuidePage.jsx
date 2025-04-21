import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
// Assume Firestore is initialized and 'db' is exported from firebase config
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config'; // Adjust path as needed
import './GuidePage.css'; // Import the CSS file

// Define the topic titles and emojis
const guideTopics = {
  'history': { title: 'History Overview', emoji: '📜' },
  'religion-culture': { title: 'Religion & Culture', emoji: '🧘‍♀️' },
  'modern-japan': { title: 'Modern Japan', emoji: '💸' },
  'etiquette': { title: 'Etiquette & Behavior', emoji: '🍣' },
  'fun-facts': { title: 'Fun Facts & Family Pre-Reading', emoji: '🧠' }
};

// --- LocalStorage Mock Firestore Functions (Replace with actual imports in production) ---

// Helper to simulate Firestore document path as localStorage key
/*
const getLocalStorageKey = (docRef) => `firestoreMock/${docRef.path}`;

const doc = (db, collection, id) => ({ 
    // db is unused in mock, only needed for actual Firestore
    path: `${collection}/${id}` 
});

const getDoc = async (docRef) => {
  const key = getLocalStorageKey(docRef);
  console.log(`LocalStorage Mock: Getting doc ${key}`);
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate short delay
  const storedValue = localStorage.getItem(key);
  
  if (storedValue) {
      try {
          const data = JSON.parse(storedValue);
          // Handle potential stored ISO string dates for lastUpdated
          if (data.lastUpdated && typeof data.lastUpdated === 'string') {
              data.lastUpdated = new Date(data.lastUpdated);
          }
          return {
              exists: () => true,
              data: () => data,
              id: docRef.path.split('/').pop(), // Extract ID from path
          };
      } catch (e) {
          console.error(`LocalStorage Mock: Error parsing JSON for key ${key}`, e);
          localStorage.removeItem(key); // Clear corrupted data
          return { exists: () => false, data: () => undefined, id: docRef.path.split('/').pop() };
      }
  } else {
      return {
          exists: () => false,
          data: () => undefined,
          id: docRef.path.split('/').pop(),
      };
  }
};

const setDoc = async (docRef, data, options = {}) => {
  const key = getLocalStorageKey(docRef);
  console.log(`LocalStorage Mock: Setting doc ${key}`, data, options);
  let dataToStore = { ...data };

  // Simulate serverTimestamp with ISO string for localStorage compatibility
  if (data.lastUpdated === 'SERVER_TIMESTAMP_PLACEHOLDER') {
      dataToStore.lastUpdated = new Date().toISOString(); 
  }

  let finalData = dataToStore;
  if (options.merge) {
      const existingDoc = await getDoc(docRef);
      if (existingDoc.exists()) {
          finalData = { ...existingDoc.data(), ...dataToStore };
      }
  }

  try {
      localStorage.setItem(key, JSON.stringify(finalData));
  } catch (e) {
      console.error(`LocalStorage Mock: Error setting item for key ${key}`, e);
      // Handle potential quota exceeded errors if necessary
  }
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate short delay
  return Promise.resolve();
};

// Returns a placeholder string, setDoc handles conversion to ISO string
const serverTimestamp = () => 'SERVER_TIMESTAMP_PLACEHOLDER'; 

// --- Initialize Mock Data in LocalStorage (if not already present) ---
const initializeMockData = () => {
    const shibuyaWishlistKey = getLocalStorageKey(doc(null, 'trips/japan-2025/wishlist', 'shibuya'));
    const shibuyaGuideKey = getLocalStorageKey(doc(null, 'trips/japan-2025/guides', 'shibuya'));
    const nikkoWishlistKey = getLocalStorageKey(doc(null, 'trips/japan-2025/wishlist', 'nikko'));

    if (!localStorage.getItem(shibuyaWishlistKey)) {
        localStorage.setItem(shibuyaWishlistKey, JSON.stringify({ title: 'Tokyo Shibuya', region: 'Tokyo Area' }));
    }
    if (!localStorage.getItem(shibuyaGuideKey)) {
        localStorage.setItem(shibuyaGuideKey, JSON.stringify({ 
            content: `# Shibuya Guide\n\n*   Visit the crossing!\n*   Explore nearby shops.`,
            lastUpdated: new Date(Date.now() - 86400000).toISOString() 
        }));
    }
     if (!localStorage.getItem(nikkoWishlistKey)) {
        localStorage.setItem(nikkoWishlistKey, JSON.stringify({ title: 'Nikko', region: 'Kanto' }));
    }
    // No guide initially for Nikko, so no key set for it
};

initializeMockData(); // Run once on script load
*/
// --- End Mock Firestore Functions ---


function GuidePage() {
  const { tripId, itemId } = useParams();

  const [guideContent, setGuideContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [itemDetails, setItemDetails] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState('en');
  const [isTopicGuide, setIsTopicGuide] = useState(false);

  // Check if this is a topic-based guide or a wishlist item guide
  useEffect(() => {
    console.log('GuidePage - URL params:', { tripId, itemId });
    console.log('GuidePage - Is topic in guide topics?', !!guideTopics[itemId]);
    
    if (itemId && guideTopics[itemId]) {
      console.log('GuidePage - This is a topic guide');
      setIsTopicGuide(true);
    } else {
      console.log('GuidePage - This is not a topic guide');
      setIsTopicGuide(false);
    }
  }, [itemId]);

  // Mocks now use localStorage, no 'db' instance needed for doc() here -> Now use real Firestore + db
  const guideDocRef = useCallback(() => {
      if (!tripId || !itemId) return null;
      
      // For topic guides accessed through /trip/:tripId/guide/:itemId, 
      // the content might be in a collection called topic-guides
      let collectionPath;
      if (isTopicGuide) {
        collectionPath = `trips/${tripId}/topic-guides`;
      } else {
        collectionPath = `trips/${tripId}/guides`;
      }
      
      console.log('GuidePage - Using collection path:', collectionPath);
      
      // Use imported 'doc' and 'db'
      return doc(db, collectionPath, itemId);
  }, [tripId, itemId, isTopicGuide]);

  const itemDocRef = useCallback(() => {
      if (!tripId || !itemId) return null;
      // Use imported 'doc' and 'db'
      return doc(db, `trips/${tripId}/wishlist`, itemId);
  }, [tripId, itemId]);

  // Fetch guide content and item details
  useEffect(() => {
    const fetchGuideData = async () => {
      if (!tripId || !itemId) {
          setError("Missing Trip ID or Item ID.");
          setIsLoading(false);
          return;
      }
      
      setIsLoading(true);
      setError(null);
      setEditMode(false); // Reset edit mode on ID change

      // Check if we already have this content in sessionStorage
      // to prevent unnecessary loading flashes in production
      try {
        const cacheKey = `guide_${tripId}_${itemId}_${language}`;
        const cachedContent = sessionStorage.getItem(cacheKey);
        const itemDetailsKey = `guide_details_${tripId}_${itemId}`;
        const cachedDetails = sessionStorage.getItem(itemDetailsKey);
        
        // If we have cached content, set it immediately to prevent flash
        if (cachedContent) {
          console.log('Setting cached content immediately to prevent flash');
          setGuideContent(cachedContent);
          setOriginalContent(cachedContent);
          
          if (cachedDetails) {
            try {
              setItemDetails(JSON.parse(cachedDetails));
            } catch (e) {
              console.warn('Failed to parse cached item details');
            }
          }
        }
      } catch (e) {
        console.warn('Error accessing sessionStorage:', e);
      }

      try {
        // For topic guides, we don't need to fetch item details from wishlist
        if (isTopicGuide) {
          // Set item details based on the predefined topics
          const topicInfo = guideTopics[itemId];
          if (topicInfo) {
            const details = {
              title: `${topicInfo.emoji} ${topicInfo.title}`,
              region: 'Japan Guide' // Set a generic region name
            };
            setItemDetails(details);
            
            // Cache item details
            try {
              const itemDetailsKey = `guide_details_${tripId}_${itemId}`;
              sessionStorage.setItem(itemDetailsKey, JSON.stringify(details));
            } catch (e) {
              console.warn('Failed to cache item details:', e);
            }
          } else {
            // Fallback if topic not found
            setItemDetails({ title: `Guide: ${itemId}`, region: 'Japan Guide' });
          }
        } else {
          // Fetch Item Details for wishlist item (for header)
          const itemRef = itemDocRef();
          try {
            const itemSnap = await getDoc(itemRef); // Uses real getDoc
            if (itemSnap.exists()) {
              const details = itemSnap.data();
              setItemDetails(details);
              
              // Cache item details
              try {
                const itemDetailsKey = `guide_details_${tripId}_${itemId}`;
                sessionStorage.setItem(itemDetailsKey, JSON.stringify(details));
              } catch (e) {
                console.warn('Failed to cache item details:', e);
              }
            } else {
              // Wishlist item might legitimately not exist in Firestore
              console.warn(`Firestore: Wishlist item ${itemId} not found for trip ${tripId}.`);
              setItemDetails({ title: `Item: ${itemId}`, region: 'Unknown' }); // Fallback title
            }
          } catch (itemErr) {
            console.error("Error fetching wishlist item:", itemErr);
            setItemDetails({ title: `Item: ${itemId}`, region: 'Unknown' });
          }
        }

        // Fetch Guide Content
        let docSnap = null;
        
        // First try the primary collection path
        const guideRef = guideDocRef();
        console.log('Fetching guide from:', guideRef.path);
        
        try {
          docSnap = await getDoc(guideRef);
        } catch (err) {
          console.error("Error fetching from primary path:", err);
        }
        
        // If we're dealing with a topic guide and the document doesn't exist or caused error,
        // try an alternative collection path as a fallback
        if (isTopicGuide && (!docSnap || !docSnap.exists())) {
          try {
            console.log('Topic guide not found in primary path, trying fallback...');
            // Try regular guides collection as fallback for topic guides
            const fallbackRef = doc(db, `trips/${tripId}/guides`, itemId);
            console.log('Fetching guide from fallback:', fallbackRef.path);
            const fallbackSnap = await getDoc(fallbackRef);
            
            if (fallbackSnap.exists()) {
              console.log('Found topic guide in fallback location');
              docSnap = fallbackSnap;
            }
          } catch (fallbackErr) {
            console.error("Error fetching from fallback path:", fallbackErr);
          }
        }

        if (docSnap && docSnap.exists()) {
          const data = docSnap.data();
          console.log('Guide data found:', data);
          // Get content based on current language
          const content = data[language] || '';
          setGuideContent(content);
          setOriginalContent(content);
          // Firestore Timestamps are objects, convert to JS Date if needed
          setLastUpdated(data.lastUpdated?.toDate ? data.lastUpdated.toDate() : null); 
          
          // Store in sessionStorage as a backup in case of network issues
          try {
            const cacheKey = `guide_${tripId}_${itemId}_${language}`;
            sessionStorage.setItem(cacheKey, content);
            console.log('Guide content cached in sessionStorage');
          } catch (cacheErr) {
            console.warn('Failed to cache guide content:', cacheErr);
          }
        } else {
          // No guide exists yet in Firestore
          console.log('No guide content found for', itemId);
          
          // Try to get from session storage cache
          try {
            const cacheKey = `guide_${tripId}_${itemId}_${language}`;
            const cachedContent = sessionStorage.getItem(cacheKey);
            if (cachedContent) {
              console.log('Retrieved guide content from sessionStorage cache');
              setGuideContent(cachedContent);
              setOriginalContent(cachedContent);
            } else {
              setGuideContent('');
              setOriginalContent('');
            }
          } catch (cacheErr) {
            console.warn('Failed to retrieve cached guide content:', cacheErr);
            setGuideContent('');
            setOriginalContent('');
          }
          
          setLastUpdated(null);
        }
      } catch (err) {
        console.error("Error fetching guide from Firestore:", err);
        setError("Failed to load guide. Please try again.");
        
        // On error, try to use cached content
        try {
          const cacheKey = `guide_${tripId}_${itemId}_${language}`;
          const cachedContent = sessionStorage.getItem(cacheKey);
          if (cachedContent) {
            console.log('Error occurred, falling back to cached content');
            setGuideContent(cachedContent);
            setOriginalContent(cachedContent);
            setError(null); // Clear error if we have cached content
          } else {
            setGuideContent('');
            setOriginalContent('');
          }
        } catch (cacheErr) {
          console.warn('Failed to retrieve cached guide content:', cacheErr);
          setGuideContent('');
          setOriginalContent('');
        }
        
        setLastUpdated(null);
        setItemDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGuideData();
  }, [tripId, itemId, language, guideDocRef, itemDocRef, isTopicGuide, guideTopics]);

  const handleEdit = () => {
    setOriginalContent(guideContent); // Store current content in case of cancel
    setEditMode(true);
  };

  const handleCancel = () => {
    setGuideContent(originalContent); // Restore original content
    setEditMode(false);
  };

  const handleSave = async () => {
    const currentGuideRef = guideDocRef(); // Get the ref
    if (!currentGuideRef) return;
    setIsSaving(true);
    setError(null);

    try {
      console.log('Saving guide to:', currentGuideRef.path);
      
      // Get existing document first to preserve other language content
      const docSnap = await getDoc(currentGuideRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};
      
      // Update only the current language content
      await setDoc(currentGuideRef, { 
        [language]: guideContent,
        lastUpdated: serverTimestamp() // Real Firestore serverTimestamp
      }, { merge: true }); 

      console.log('Guide saved successfully');
      setOriginalContent(guideContent); 
      setEditMode(false);
      
      // Refetch to get the updated timestamp (which is now a Date object)
      const updatedDoc = await getDoc(currentGuideRef);
      if (updatedDoc.exists()) {
           const data = updatedDoc.data();
           // Convert Firestore timestamp to JS Date
           setLastUpdated(data.lastUpdated?.toDate ? data.lastUpdated.toDate() : null); 
      }

    } catch (err) {
      console.error("Error saving guide to Firestore:", err);
      setError("Failed to save guide. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = (lang) => {
    if (editMode) {
      // If in edit mode, confirm before switching language
      if (window.confirm('You have unsaved changes. Switch language anyway?')) {
        setLanguage(lang);
      }
    } else {
      setLanguage(lang);
    }
  };

  return (
    <div className="container mt-4 guide-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          {isTopicGuide && (
            <Link to={`/trip/${tripId}/about`} className="btn btn-sm btn-outline-secondary">
              Back to Guides
            </Link>
          )}
        </div>
        
        <div className="d-flex gap-2">
          <button 
            onClick={() => handleLanguageChange('en')} 
            className={`btn btn-sm ${language === 'en' ? 'btn-primary' : 'btn-dark'}`}
          >
            EN
          </button>
          <button 
            onClick={() => handleLanguageChange('ru')} 
            className={`btn btn-sm ${language === 'ru' ? 'btn-primary' : 'btn-dark'}`}
          >
            RU
          </button>
          
          {!editMode && !isLoading && (
            <button onClick={handleEdit} className="btn btn-primary btn-sm ms-3" disabled={isSaving}>
              Edit Guide
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}
      
      {error && <div className="alert alert-danger">{error}</div>}

      {!isLoading && !error && (
        <>
          <header className="mb-4 text-left">
            <h1 className="display-6">{itemDetails?.title || 'Guide'}</h1>
            {itemDetails?.region && <p className="text-muted mb-0">Region: {itemDetails.region}</p>}
            {lastUpdated && !editMode && (
               <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                 {/* Ensure lastUpdated is a Date object before calling methods */}
                 Last updated: {lastUpdated instanceof Date ? lastUpdated.toLocaleString() : 'N/A'}
               </p>
            )}
          </header>

          <div className="card bg-dark text-white">
            <div className="card-body">
              {editMode ? (
                <>
                  <textarea
                    className="form-control bg-dark text-white mb-3"
                    rows="15"
                    value={guideContent}
                    onChange={(e) => setGuideContent(e.target.value)}
                    placeholder={guideContent ? '' : `No guide written yet in ${language.toUpperCase()}. Write the first one!`}
                    disabled={isSaving}
                    style={{ minHeight: '300px' }}
                  />
                  <div className="d-flex justify-content-end gap-2">
                    <button onClick={handleCancel} className="btn btn-secondary" disabled={isSaving}>
                      Cancel
                    </button>
                    <button onClick={handleSave} className="btn btn-success" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Guide'
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {guideContent ? (
                    <div className="markdown-content">
                      <ReactMarkdown>{guideContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-muted fst-italic mt-3">
                      No guide written yet in {language.toUpperCase()}. Click 'Edit Guide' to start.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GuidePage; 