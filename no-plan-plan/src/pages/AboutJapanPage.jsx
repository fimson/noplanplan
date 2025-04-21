import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

const guideTopics = [
  {
    id: 'history',
    title: 'History Overview',
    emoji: '📜',
    description: 'From ancient myths to bullet trains in 2,000 years.'
  },
  {
    id: 'religion-culture',
    title: 'Religion & Culture',
    emoji: '🧘‍♀️',
    description: 'Shrines, rituals, and 8 million kami to discover.'
  },
  {
    id: 'modern-japan',
    title: 'Modern Japan',
    emoji: '💸',
    description: 'More than vending machines (but yes, vending machines too).'
  },
  {
    id: 'etiquette',
    title: 'Etiquette & Behavior',
    emoji: '🍣',
    description: 'Essential customs to avoid ancestral insults.'
  },
  {
    id: 'fun-facts',
    title: 'Fun Facts & Family',
    emoji: '🧠',
    description: 'Fascinating tidbits that will make the kids think you\'re smart.'
  }
];

function AboutJapanPage() {
  const { tripId } = useParams();

  // Prefetch guide content on page load to improve perceived performance
  useEffect(() => {
    const prefetchGuides = async () => {
      if (!tripId) return;
      
      // Prefetch all guide topics to warm up the cache
      for (const topic of guideTopics) {
        try {
          // Try both potential paths for guide content
          const primaryPath = `trips/${tripId}/topic-guides`;
          const fallbackPath = `trips/${tripId}/guides`;
          
          // Attempt to prefetch from primary path
          const primaryRef = doc(db, primaryPath, topic.id);
          console.log(`Prefetching guide: ${topic.id} from ${primaryPath}`);
          await getDoc(primaryRef).catch(() => {
            // Silently ignore errors during prefetch
          });
          
          // Attempt to prefetch from fallback path
          const fallbackRef = doc(db, fallbackPath, topic.id);
          console.log(`Prefetching guide: ${topic.id} from ${fallbackPath}`);
          await getDoc(fallbackRef).catch(() => {
            // Silently ignore errors during prefetch
          });
        } catch (e) {
          // Ignore prefetch errors
          console.log(`Error prefetching guide ${topic.id}:`, e);
        }
      }
    };
    
    prefetchGuides();
  }, [tripId]);
  
  // Function to prefetch a specific guide when hovering
  const prefetchGuide = async (topicId) => {
    if (!tripId) return;
    
    try {
      // Try both potential paths
      const primaryRef = doc(db, `trips/${tripId}/topic-guides`, topicId);
      const fallbackRef = doc(db, `trips/${tripId}/guides`, topicId);
      
      // We use Promise.all with .catch for each promise to handle each request independently
      await Promise.all([
        getDoc(primaryRef).catch(() => null),
        getDoc(fallbackRef).catch(() => null)
      ]);
      
      console.log(`Prefetched guide ${topicId} on hover`);
    } catch (e) {
      // Ignore prefetch errors
      console.log(`Error prefetching guide ${topicId} on hover:`, e);
    }
  };

  return (
    <div className="container mt-4 mb-5">
      {/* Header section */}
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-white">
          JP: About Japan
        </h1>
        <p className="lead text-light opacity-75 mb-3">
          Explore history, culture, customs, and a few surprises before we take off.
        </p>
        <p className="text-primary fw-bold small text-uppercase letter-spacing-1 mb-4">
          Trip Knowledge Center
        </p>
      </div>

      {/* Cards grid */}
      <div className="row g-4">
        {guideTopics.map((topic) => (
          <div className="col-md-6 col-lg-4" key={topic.id}>
            <Link 
              to={`/trip/${tripId}/guide/${topic.id}`} 
              className="text-decoration-none"
              onMouseEnter={() => prefetchGuide(topic.id)}
            >
              <div className="card h-100 bg-dark border-secondary shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h3 className="card-title d-flex align-items-center mb-3 text-white">
                    <span className="me-2 fs-4">{topic.emoji}</span> {topic.title}
                  </h3>
                  <p className="card-text text-light opacity-75 mb-3">
                    {topic.description}
                  </p>
                  <div className="mt-auto text-end">
                    <span className="text-primary fw-medium small">Read more →</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

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

export default AboutJapanPage; 