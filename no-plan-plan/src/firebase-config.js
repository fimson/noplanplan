import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator, collection, doc, getDoc, setDoc } from "firebase/firestore";

// Your web app's Firebase configuration
// Replace the placeholder values below with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyB_qP6M85Y7zXfy_2lcDTWU6QI0dsB6__k",
    authDomain: "noplanplan-559573.firebaseapp.com",
    projectId: "noplanplan-559573",
    storageBucket: "noplanplan-559573.firebasestorage.app",
    messagingSenderId: "899063180560",
    appId: "1:899063180560:web:291bbaed884c0902c14995",
    measurementId: "G-KGKLFQS9L4"
};

console.log("Initializing Firebase with config:", { projectId: firebaseConfig.projectId });

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with error handling
const db = getFirestore(app);

// For development/testing only
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const useEmulator = false; // Set to false to connect to production Firebase instead of emulator
if (isDev && useEmulator) {
    try {
        // Attempt to use emulator when in dev mode
        console.log("Attempting to connect to Firestore emulator");
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        console.log("Connected to Firestore emulator");
    } catch (error) {
        console.log("Not using Firestore emulator:", error.message);
    }
}

// Enable offline persistence and handle errors to prevent app from hanging
try {
    console.log("Attempting to enable IndexedDB persistence for Firestore");
    enableIndexedDbPersistence(db)
        .then(() => {
            console.log("Firestore offline persistence enabled successfully");
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code === 'unimplemented') {
                console.warn('The current browser does not support offline persistence.');
            } else {
                console.error("Error enabling persistence:", err);
            }
        });
} catch (error) {
    console.error("Critical error with persistence:", error);
}

// Simple function to check Firestore connectivity
const checkFirestoreConnection = async () => {
    console.log("Checking Firestore connectivity...");
    try {
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Firestore connection timeout")), 10000)
        );
        
        // This dummy operation will attempt to connect to Firestore
        const testRef = collection(db, "_connection_test");
        const docRef = doc(testRef, "test");
        
        // Add detailed error logging for debugging
        try {
            await Promise.race([
                getDoc(docRef),
                timeout
            ]);
            
            console.log("Firestore connection successful");
            return true;
        } catch (innerError) {
            console.error("Firestore operation failed:", innerError);
            console.error("Error code:", innerError.code);
            console.error("Error message:", innerError.message);
            
            if (innerError.message.includes('404')) {
                console.error("404 error detected - this typically means the database exists but the collection doesn't exist yet");
                // Attempt to create the test collection and document
                try {
                    console.log("Attempting to create test document...");
                    await setDoc(docRef, { test: true, timestamp: new Date() });
                    console.log("Test document created successfully");
                    return true;
                } catch (writeError) {
                    console.error("Failed to create test document:", writeError);
                    throw writeError;
                }
            }
            
            throw innerError;
        }
    } catch (error) {
        console.error("Firestore connection failed:", error.message);
        // Fallback to localStorage or other mechanisms
        return false;
    }
};

// Delay checking the connection to allow Firebase to fully initialize
setTimeout(() => {
    console.log("Starting Firestore connection check...");
    checkFirestoreConnection();
}, 2000);  // 2 second delay

export { db, checkFirestoreConnection }; 