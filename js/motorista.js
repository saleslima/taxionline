import { initTheme } from './utils.js';
import { initLogoutButton } from './auth.js';
import { initDriverManagement } from './driver-management.js';

// Initialize all modules when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing motorista page...");
    
    // Initialize theme first for consistent UI
    initTheme();
    
    // Initialize logout button and check user authorization
    initLogoutButton();
    
    // Initialize driver management
    initDriverManagement();
    
    // Trigger driver list loading
    const listDriversEvent = new CustomEvent('load-drivers');
    document.dispatchEvent(listDriversEvent);
    
    console.log("Motorista page initialization complete");
});