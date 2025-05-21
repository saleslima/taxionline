// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getDatabase, ref } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyCuT9htDTRZcp3yMC7YKvRA3lbo57W6NSk",
    authDomain: "choque-fabe6.firebaseapp.com",
    databaseURL: "https://choque-fabe6-default-rtdb.firebaseio.com",
    projectId: "choque-fabe6",
    storageBucket: "choque-fabe6-storage.appspot.com",
    messagingSenderId: "757585856703",
    appId: "1:757585856703:web:11febda2700d8fc1e71e0a",
    measurementId: "G-057CJD4J5W"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Database references
const bookingsRef = ref(database, '/bookings');
const driversRef = ref(database, '/drivers');

// Static configuration
const superadminCredentials = { username: 'super', password: 'superadmin' };

// Export for use in other modules
export { app, database, bookingsRef, driversRef, superadminCredentials };