import { initAuth } from './auth.js';
import { initDriverManagement } from './driver-management.js';
import { initBookingDisplay } from './booking-display.js';
import { initModals } from './modals.js';
import { initTheme } from './utils.js';

// Initialize all modules when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing application...");
    
    // Initialize theme first for consistent UI
    initTheme();
    
    // Initialize core functionality
    initAuth();
    initDriverManagement();
    
    // Initialize modals
    initModals();
    
    // Check if user is already authenticated from a previous session
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'driver') {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('admin-driver-management').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        initBookingDisplay();
    } else if (userRole === 'superadmin') {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('main-content').classList.add('hidden');
        document.getElementById('admin-driver-management').classList.remove('hidden');
        const listDriversEvent = new CustomEvent('load-drivers');
        document.dispatchEvent(listDriversEvent);
    }
    
    // Listen for init-booking-display event
    document.addEventListener('init-booking-display', () => {
        initBookingDisplay();
    });
    
    console.log("Application initialization complete");
});