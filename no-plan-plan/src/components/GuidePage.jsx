import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeExternalLinks from 'rehype-external-links';
// Assume Firestore is initialized and 'db' is exported from firebase config
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase-config'; // Adjust path as needed
import { guideTopics, slugify } from '../constants'; // Import from constants
import './GuidePage.css'; // Import the CSS file

// Define the topic titles and emojis

// Helper: Generate slug ids identical to those used in markdown links

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
  // Add state for AI generation
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState(null);
  // Add state to track if content was AI-generated
  const [isAIGenerated, setIsAIGenerated] = useState(false);

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
          // Set AI-generated flag if present
          setIsAIGenerated(data.isAIGenerated || false);
          
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
        lastUpdated: serverTimestamp(), // Real Firestore serverTimestamp
        isAIGenerated: isAIGenerated // Store this flag in Firestore
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

  // --- Add AI Generation Handler ---
  const handleGenerateAI = async () => {
    const userPrompt = window.prompt("Enter your prompt for the AI:");
    if (!userPrompt) {
      return; // User cancelled
    }

    setIsGeneratingAI(true);
    setAiError(null); // Clear previous AI errors

    // Define the persona context
    const personaContext = `Act as "Hiro," a sarcastic, storytelling, highly knowledgeable tour guide.

Write long, detailed, immersive answers with structured sections and optional markdown TOC.

Style: humorous, dryly sarcastic, sharp-witted but deeply respectful toward local culture.

Mix history, culture, etiquette, food, and daily life into lively narratives, not just bullet points.

Call out absurdities (especially bureaucracy, tourist mistakes, etc.) with humor.

Assume the reader is smart but unfamiliar with local's quirks.

Use occasional rhetorical questions and witty metaphors.
No sugar-coating. Always speak like you're giving the real story to curious, slightly overwhelmed travelers.`;

    try {
      // Use a direct Cloud Function URL similar to Wishlist implementation
      // URL should match your deployed Cloud Function in the same project
      const functionUrl = "https://generateguide-vsjk6mhqqq-uc.a.run.app";
      console.log(`Calling AI guide generation for language: ${language}`);
      
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          language: language,
          context: personaContext,
          guideType: isTopicGuide ? 'topic' : 'wishlist',
          tripId: tripId,
          itemId: itemId
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Cloud Function Error Response:", errorBody);
        throw new Error(`AI generation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if the response contains the generated text
      if (data.generatedText) {
        setGuideContent(data.generatedText);
        setIsAIGenerated(true); // Mark this content as AI-generated
        console.log("Successfully generated guide content with AI");
      } else {
        throw new Error("Received invalid response from AI service - missing generatedText field");
      }

    } catch (err) {
      console.error("Error generating AI content:", err);
      setAiError(err.message || "An unknown error occurred during AI generation.");
    } finally {
      setIsGeneratingAI(false);
    }
  };
  // --- End AI Generation Handler ---

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
                    disabled={isSaving || isGeneratingAI} // Disable if saving or generating
                    style={{ minHeight: '300px' }}
                  />
                  {/* Display AI Error */}
                  {aiError && <div className="alert alert-danger mt-2 py-1 px-2" style={{fontSize: '0.9em'}}>{aiError}</div>}

                  <div className="d-flex justify-content-end gap-2 mt-3">
                     {/* Add the new AI button */}
                     <button
                       onClick={handleGenerateAI}
                       className="btn btn-outline-info d-flex align-items-center" // Use outline-info or another style
                       disabled={isSaving || isGeneratingAI}
                       style={{ padding: '0.375rem 0.75rem' }} // Match styling of other buttons if needed
                     >
                       {isGeneratingAI ? (
                         <>
                           <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                           Generating...
                         </>
                       ) : (
                         <>
                           <span className="me-2" style={{fontSize: '1.1em'}}>🧠</span> {/* Brain Icon */}
                           Generate with AI
                         </>
                       )}
                     </button>

                    <button onClick={handleCancel} className="btn btn-secondary" disabled={isSaving || isGeneratingAI}>
                      Cancel
                    </button>
                    <button onClick={handleSave} className="btn btn-success" disabled={isSaving || isGeneratingAI}>
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
                    <div className={`markdown-content ${isAIGenerated ? 'ai-content-padding' : ''}`}>
                      {/* AI Generated Banner */}
                      {isAIGenerated && (
                        <div className="ai-generated-banner">
                          <div className="ai-badge">
                            <span className="ai-icon">🧠</span> Generated with AI
                          </div>
                        </div>
                      )}
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node, ...props }) => {
                            const { href, children } = props;
                            console.log("Link rendered:", { href, children });
                            
                            if (!href) {
                              console.log("No href provided for link");
                              return <a {...props} />;
                            }
                            
                            // External links - don't intercept them
                            if (href.startsWith('http://') || href.startsWith('https://')) {
                              console.log("External link detected:", href);
                              return (
                                <a 
                                  href={href} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="external-link"
                                  onClick={(e) => console.log("External link clicked:", href)}
                                  {...props} 
                                />
                              );
                            }
                            
                            // Anchor/fragment links - handle with direct scrolling
                            if (href.startsWith('#')) {
                              console.log("Anchor link detected:", href);
                              return (
                                <a 
                                  href={href}
                                  className="anchor-link" 
                                  onClick={(e) => {
                                    // Don't prevent default, let the browser handle it natively
                                    console.log("Anchor link clicked, letting browser handle:", href);
                                  }}
                                  {...props} 
                                />
                              );
                            }
                            
                            // Internal navigation links - use React Router
                            if (href.startsWith('/')) {
                              console.log("Internal navigation link detected:", href);
                              const hrefFinal = href; // Capture href in closure
                              return (
                                <Link 
                                  to={hrefFinal}
                                  className="internal-link" 
                                  {...props} 
                                />
                              );
                            }
                            
                            // Default case - render as normal anchor
                            console.log("Default link handling for:", href);
                            return <a href={href} className="default-link" {...props} />;
                          },
                          h1: ({ node, ...props }) => {
                            const id = slugify(props.children);
                            return <h1 id={id} {...props} />;
                          },
                          h2: ({ node, ...props }) => {
                            const id = slugify(props.children);
                            return <h2 id={id} {...props} />;
                          },
                          h3: ({ node, ...props }) => {
                            const id = slugify(props.children);
                            return <h3 id={id} {...props} />;
                          },
                          h4: ({ node, ...props }) => {
                            const id = slugify(props.children);
                            return <h4 id={id} {...props} />;
                          }
                        }}
                        rehypePlugins={[
                          rehypeRaw,
                          [rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noreferrer'] }]
                        ]}
                      >
                        {guideContent}
                      </ReactMarkdown>
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

      <style>{`
        .ai-generated-banner {
          position: relative;
          margin-bottom: 1rem;
          height: 30px; /* Fixed height to create space */
        }
        
        .ai-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          font-size: 0.8rem;
          padding: 0.3rem 0.6rem;
          border-radius: 0.3rem;
          display: flex;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 100;
          animation: fadeIn 0.5s ease-out;
        }
        
        .ai-icon {
          margin-right: 0.3rem;
          font-size: 1.1em;
        }
        
        /* Add padding to the content when AI-generated */
        .markdown-content {
          position: relative;
        }
        
        .ai-content-padding {
          padding-top: 40px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default GuidePage; 