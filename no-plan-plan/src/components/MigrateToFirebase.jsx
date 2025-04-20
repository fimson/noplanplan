import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

function MigrateToFirebase() {
  const [migrationStatus, setMigrationStatus] = useState('idle');
  const [localStorageData, setLocalStorageData] = useState({});
  const [migrationStats, setMigrationStats] = useState({
    wishlistItems: 0,
    guides: 0, 
    regions: 0,
    activities: 0,
    other: 0
  });
  const [logs, setLogs] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  
  // Create a logger function
  const log = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, timestamp, type }]);
  };

  // Collect all localStorage data
  useEffect(() => {
    if (migrationStatus === 'scanning') {
      try {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          try {
            const value = JSON.parse(localStorage.getItem(key));
            data[key] = value;
          } catch (e) {
            // Skip non-JSON values
            data[key] = localStorage.getItem(key);
            log(`Skipping non-JSON item: ${key}`, 'warning');
          }
        }
        setLocalStorageData(data);
        log(`Found ${Object.keys(data).length} items in localStorage`);
        setMigrationStatus('ready');
      } catch (error) {
        log(`Error scanning localStorage: ${error.message}`, 'error');
        setMigrationStatus('error');
      }
    }
  }, [migrationStatus]);

  // Start scanning localStorage
  const startScan = () => {
    setMigrationStatus('scanning');
    setLogs([]);
    log('Starting localStorage scan...');
  };

  // Actual migration process
  const migrateToFirebase = async () => {
    setMigrationStatus('migrating');
    log('Starting migration to Firebase...');
    const stats = { wishlistItems: 0, guides: 0, regions: 0, activities: 0, other: 0 };
    
    try {
      // Organize data by type
      const tripIds = new Set();
      const wishlistsByTripId = {};
      const guidesByTripId = {};
      const regionsByTripId = {};
      const activitiesByTripId = {};
      
      // Process all localStorage entries
      for (const [key, value] of Object.entries(localStorageData)) {
        // Process wishlist items
        if (key.startsWith('wishlist-')) {
          const tripId = key.replace('wishlist-', '');
          tripIds.add(tripId);
          wishlistsByTripId[tripId] = value;
          log(`Found wishlist for trip: ${tripId} with ${value.length} items`);
        }
        // Process guides
        else if (key.startsWith('firestoreMock/trips/') && key.includes('/guides/')) {
          const parts = key.split('/');
          const tripId = parts[2];
          const itemId = parts[4];
          tripIds.add(tripId);
          
          if (!guidesByTripId[tripId]) guidesByTripId[tripId] = {};
          guidesByTripId[tripId][itemId] = value;
          log(`Found guide for trip: ${tripId}, item: ${itemId}`);
        }
        // Process regions
        else if (key.startsWith('regions-')) {
          const tripId = key.replace('regions-', '');
          tripIds.add(tripId);
          regionsByTripId[tripId] = value;
          log(`Found regions for trip: ${tripId} with ${value.length} regions`);
        }
        // Process activities
        else if (key.startsWith('activities-')) {
          const tripId = key.replace('activities-', '');
          tripIds.add(tripId);
          activitiesByTripId[tripId] = value;
          log(`Found activities for trip: ${tripId} with ${value.length} activities`);
        }
        // Everything else is counted as "other"
        else {
          stats.other++;
        }
      }
      
      // Upload to Firebase by trip ID
      for (const tripId of tripIds) {
        log(`Migrating data for trip: ${tripId}...`);
        
        // Migrate trip details (create a default if none exists)
        await setDoc(doc(db, 'trips', tripId), {
          id: tripId,
          title: tripId.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          createdAt: new Date(),
          lastUpdated: new Date()
        }, { merge: true });
        
        // Migrate wishlist items
        if (wishlistsByTripId[tripId]) {
          for (const item of wishlistsByTripId[tripId]) {
            await setDoc(doc(db, `trips/${tripId}/wishlist`, item.id), {
              title: item.title,
              description: item.description || '',
              imageUrl: item.imageUrl || '',
              link: item.link || '',
              votes: item.votes || 0,
              regionId: item.regionId || null,
              planned: item.planned || false,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
            });
            stats.wishlistItems++;
          }
          log(`Migrated ${wishlistsByTripId[tripId].length} wishlist items for trip: ${tripId}`);
        }
        
        // Migrate guides
        if (guidesByTripId[tripId]) {
          for (const [itemId, guide] of Object.entries(guidesByTripId[tripId])) {
            await setDoc(doc(db, `trips/${tripId}/guides`, itemId), {
              content: guide.content || '',
              lastUpdated: guide.lastUpdated ? new Date(guide.lastUpdated) : new Date()
            });
            stats.guides++;
          }
          log(`Migrated ${Object.keys(guidesByTripId[tripId]).length} guides for trip: ${tripId}`);
        }
        
        // Migrate regions
        if (regionsByTripId[tripId]) {
          for (const region of regionsByTripId[tripId]) {
            await setDoc(doc(db, `trips/${tripId}/regions`, region.id), {
              name: region.name,
              notes: region.notes || ''
            });
            stats.regions++;
          }
          log(`Migrated ${regionsByTripId[tripId].length} regions for trip: ${tripId}`);
        }
        
        // Migrate activities
        if (activitiesByTripId[tripId]) {
          for (const activity of activitiesByTripId[tripId]) {
            await setDoc(doc(db, `trips/${tripId}/activities`, activity.id.toString()), {
              title: activity.title,
              description: activity.description || '',
              day: activity.day || 1,
              startTime: activity.startTime || '',
              endTime: activity.endTime || '',
              location: activity.location || '',
              wishlistItemId: activity.wishlistItemId || null
            });
            stats.activities++;
          }
          log(`Migrated ${activitiesByTripId[tripId].length} activities for trip: ${tripId}`);
        }
      }
      
      setMigrationStats(stats);
      log(`Migration completed successfully!`, 'success');
      log(`Migrated ${stats.wishlistItems} wishlist items, ${stats.guides} guides, ${stats.regions} regions, ${stats.activities} activities`);
      setMigrationStatus('completed');
    } catch (error) {
      log(`Error during migration: ${error.message}`, 'error');
      console.error("Migration error:", error);
      setMigrationStatus('error');
    }
  };
  
  // Clear localStorage after successful migration
  const clearLocalStorage = () => {
    try {
      localStorage.clear();
      log('localStorage cleared successfully', 'success');
    } catch (error) {
      log(`Error clearing localStorage: ${error.message}`, 'error');
    }
  };

  return (
    <div className="container mt-4">
      <div className="card bg-dark">
        <div className="card-header">
          <h3>Firebase Migration Utility</h3>
        </div>
        <div className="card-body">
          <div className="alert alert-info">
            <p>This utility will migrate your data from browser localStorage to Firebase Firestore.</p>
            <p><strong>Important:</strong> This process might take a few moments. Make sure you have a stable internet connection.</p>
          </div>
          
          {migrationStatus === 'idle' && (
            <button 
              className="btn btn-primary" 
              onClick={startScan}
            >
              Start Migration
            </button>
          )}
          
          {migrationStatus === 'scanning' && (
            <div className="d-flex align-items-center">
              <div className="spinner-border text-primary me-2" role="status">
                <span className="visually-hidden">Scanning...</span>
              </div>
              <span>Scanning localStorage...</span>
            </div>
          )}
          
          {migrationStatus === 'ready' && (
            <div>
              <div className="alert alert-warning">
                <p><strong>Found {Object.keys(localStorageData).length} items in localStorage</strong></p>
                <p>Proceed with migration to Firebase?</p>
              </div>
              
              <div className="d-flex">
                <button 
                  className="btn btn-success me-2" 
                  onClick={migrateToFirebase}
                >
                  Migrate to Firebase
                </button>
                <button 
                  className="btn btn-outline-info" 
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              {showDetails && (
                <div className="mt-3">
                  <h5>localStorage Contents:</h5>
                  <pre className="bg-dark text-light p-3" style={{ maxHeight: '300px', overflow: 'auto' }}>
                    {JSON.stringify(localStorageData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          {migrationStatus === 'migrating' && (
            <div className="d-flex align-items-center">
              <div className="spinner-border text-primary me-2" role="status">
                <span className="visually-hidden">Migrating...</span>
              </div>
              <span>Migrating to Firebase... (this may take a moment)</span>
            </div>
          )}
          
          {migrationStatus === 'completed' && (
            <div>
              <div className="alert alert-success">
                <h5>Migration Completed!</h5>
                <p>Your data has been successfully migrated to Firebase Firestore.</p>
                <ul>
                  <li>Wishlist Items: {migrationStats.wishlistItems}</li>
                  <li>Guides: {migrationStats.guides}</li>
                  <li>Regions: {migrationStats.regions}</li>
                  <li>Activities: {migrationStats.activities}</li>
                </ul>
              </div>
              
              <div className="alert alert-warning">
                <p><strong>Next steps:</strong></p>
                <p>1. Make sure everything is working correctly with the Firebase data.</p>
                <p>2. Once verified, you can safely clear localStorage to avoid any conflicts.</p>
              </div>
              
              <button 
                className="btn btn-danger" 
                onClick={clearLocalStorage}
              >
                Clear localStorage
              </button>
            </div>
          )}
          
          {migrationStatus === 'error' && (
            <div className="alert alert-danger">
              <h5>Error During Migration</h5>
              <p>Something went wrong during the migration process. See the logs for details.</p>
              <button 
                className="btn btn-primary mt-2" 
                onClick={startScan}
              >
                Try Again
              </button>
            </div>
          )}
          
          <div className="mt-4">
            <h5>Migration Logs:</h5>
            <div className="logs-container bg-dark text-light p-3" style={{ maxHeight: '300px', overflow: 'auto' }}>
              {logs.map((log, i) => (
                <div key={i} className={`log-entry text-${log.type === 'error' ? 'danger' : log.type === 'warning' ? 'warning' : log.type === 'success' ? 'success' : 'light'}`}>
                  <span className="log-time">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
              {logs.length === 0 && <p className="text-muted">No logs yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MigrateToFirebase; 