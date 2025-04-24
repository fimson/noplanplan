import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

/**
 * Generic hook that returns a configuration object for the given tripId.
 * The configuration is pulled from Firestore `trips/{tripId}`.
 * If the document or certain fields are missing, sensible fallbacks are provided.
 */
export default function useTripConfig(tripId) {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create a memoized refetch function that can be called to manually refresh the data
  const refetch = useCallback(async () => {
    if (!tripId) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const ref = doc(db, 'trips', tripId);
      const snap = await getDoc(ref);
      let data = {};
      if (snap.exists()) {
        data = snap.data();
      }

      const fallbackTitle = `Trip (${tripId})`;

      const defaultConfig = {
        title: data.title || fallbackTitle,
        description:
          data.description || 'Plan your adventure with NoPlanPlan!',
        heroImage:
          data.image ||
          'https://source.unsplash.com/featured/?travel,' + encodeURIComponent(tripId),
        flagEmoji: data.flagEmoji || '🌍',
        tagline: data.tagline || 'Your adventure awaits',
        defaultStartDate: data.defaultStartDate || '',
        defaultEndDate: data.defaultEndDate || '',
        defaultRegions: data.defaultRegions || [],
        sampleWishlist: data.sampleWishlist || [],
        topicGuides: data.topicGuides || [],
      };

      setConfig(defaultConfig);
      return defaultConfig;
    } catch (err) {
      console.error('Failed to load trip config', err);
      setError(err);
      setConfig(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (!tripId) {
      setConfig(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchConfig = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const ref = doc(db, 'trips', tripId);
        const snap = await getDoc(ref);
        let data = {};
        if (snap.exists()) {
          data = snap.data();
        }

        const fallbackTitle = `Trip (${tripId})`;

        const defaultConfig = {
          title: data.title || fallbackTitle,
          description:
            data.description || 'Plan your adventure with NoPlanPlan!',
          heroImage:
            data.image ||
            'https://source.unsplash.com/featured/?travel,' + encodeURIComponent(tripId),
          flagEmoji: data.flagEmoji || '🌍',
          tagline: data.tagline || 'Your adventure awaits',
          defaultStartDate: data.defaultStartDate || '',
          defaultEndDate: data.defaultEndDate || '',
          defaultRegions: data.defaultRegions || [],
          sampleWishlist: data.sampleWishlist || [],
          topicGuides: data.topicGuides || [],
        };

        if (isMounted) {
          setConfig(defaultConfig);
        }
      } catch (err) {
        console.error('Failed to load trip config', err);
        if (isMounted) {
          setError(err);
          setConfig(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchConfig();

    return () => {
      isMounted = false;
    };
  }, [tripId]);

  return { config, isLoading, error, refetch };
} 