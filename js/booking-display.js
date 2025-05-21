import { onValue, get, ref, update, remove } from "firebase/database";
import { bookingsRef, database } from "./config.js";
import { formatPhoneNumber, playNewBookingSound, stopNewBookingSound } from "./utils.js";
import { showDriverSelectionModal, showTransferDetailsModal } from "./modals.js";
import { createBookingElement } from "./booking-renderer.js";
import { handleStatusChange, handleDriverDropdownChange } from "./booking-handlers.js";

// DOM elements
const dataContainer = document.getElementById('data-container');

// Track displayed bookings and timestamps
let displayedBookingIds = new Set();

// Initialize booking display
export function initBookingDisplay() {
    // Start checking for new booking animations
    setInterval(checkNewBookingAnimations, 1000);
    
    // Listen for database changes
    onValue(bookingsRef, async (snapshot) => {
        await handleBookingsUpdate(snapshot);
    }, (error) => {
        console.error("ERRO AO BUSCAR DADOS:", error);
        dataContainer.innerHTML = `<p>ERRO AO CARREGAR DADOS: ${error.message.toUpperCase()}</p>`;
        displayedBookingIds.clear();
        stopNewBookingSound();
    });
}

// Check and update animation for bookings less than 1 minute old
function checkNewBookingAnimations() {
    const now = Date.now();
    const oneMinuteMs = 60 * 1000;
    
    document.querySelectorAll('.data-item').forEach(element => {
        const bookingId = element.dataset.bookingId;
        const timestamp = parseInt(element.dataset.timestamp || '0');
        
        if (now - timestamp < oneMinuteMs) {
            element.classList.add('new-booking');
        } else {
            element.classList.remove('new-booking');
        }
        
        // Store the timestamp in localStorage if it's not already there
        if (!localStorage.getItem(`bookingTimestamp_${bookingId}`)) {
            localStorage.setItem(`bookingTimestamp_${bookingId}`, timestamp);
        }
    });
}

// Handle updates to the bookings in the database
async function handleBookingsUpdate(snapshot) {
    const data = snapshot.val();
    
    // Filter out completed bookings
    const activeBookings = {};
    if (data) {
        Object.entries(data).forEach(([id, booking]) => {
            if (!booking.completed) {
                activeBookings[id] = booking;
            }
        });
    }
    
    const newBookingIds = new Set(Object.keys(activeBookings || {}));
    const incomingBookingIds = Object.keys(activeBookings || {});

    if (activeBookings && incomingBookingIds.length > 0) {
        dataContainer.innerHTML = ''; // Clear container first before adding new elements
        const sortedBookingIds = incomingBookingIds.sort((a, b) => {
            return b.localeCompare(a);
        });

        let hasNewBooking = false;

        for (const bookingId of sortedBookingIds) {
            const booking = activeBookings[bookingId];
            const bookingElement = await createBookingElement(bookingId, booking);
            
            if (displayedBookingIds.size > 0 && !displayedBookingIds.has(bookingId)) {
                hasNewBooking = true;
                // Only set timestamp for new bookings if not already set
                if (!localStorage.getItem(`bookingTimestamp_${bookingId}`)) {
                    localStorage.setItem(`bookingTimestamp_${bookingId}`, Date.now());
                }
            }
            
            dataContainer.appendChild(bookingElement);
        }

        if (hasNewBooking && displayedBookingIds.size > 0) {
            playNewBookingSound();
        }
    } else {
        dataContainer.innerHTML = '<p>NENHUM DADO ENCONTRADO NO CAMINHO /BOOKINGS.</p>';
        displayedBookingIds.clear();
        stopNewBookingSound();
    }

    displayedBookingIds = newBookingIds;
}

// Export handlers for use in other modules
export { handleStatusChange, handleDriverDropdownChange };