// Utility functions for the application

/**
 * Formats a phone number to Brazilian standard
 */
export function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    const digits = String(phoneNumber).replace(/\D/g, '');
    if (digits.length === 11) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    }
    if (digits.length === 10) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    }
    return String(phoneNumber);
}

// Sound utilities
const newBookingSound = new Audio('/asset_new_booking.mp3');
let soundTimeout = null;

export function stopNewBookingSound() {
    newBookingSound.pause();
    newBookingSound.currentTime = 0;
    if (soundTimeout) {
        clearTimeout(soundTimeout);
        soundTimeout = null;
    }
}

export function playNewBookingSound() {
    stopNewBookingSound();
    newBookingSound.loop = true;
    newBookingSound.play().catch(e => console.error("Failed to play sound:", e));

    soundTimeout = setTimeout(() => {
        stopNewBookingSound();
    }, 15000);
}

// Theme management
export function initTheme() {
    const body = document.body;
    const modeToggle = document.getElementById('mode-toggle');
    const modeToggleAdmin = document.getElementById('mode-toggle-admin');
    
    const currentMode = localStorage.getItem('theme');

    if (currentMode === 'dark') {
        body.classList.add('dark-mode');
        if (modeToggle) modeToggle.textContent = 'MODO DIURNO';
        if (modeToggleAdmin) modeToggleAdmin.textContent = 'MODO DIURNO';
    } else {
        if (modeToggle) modeToggle.textContent = 'MODO NOTURNO';
        if (modeToggleAdmin) modeToggleAdmin.textContent = 'MODO NOTURNO';
    }

    if (modeToggle) {
        modeToggle.addEventListener('click', () => toggleDarkMode(modeToggle, modeToggleAdmin));
    }
    
    if (modeToggleAdmin) {
        modeToggleAdmin.addEventListener('click', () => toggleDarkMode(modeToggle, modeToggleAdmin));
    }
}

function toggleDarkMode(modeToggle, modeToggleAdmin) {
    const body = document.body;
    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
        if (modeToggle) modeToggle.textContent = 'MODO DIURNO';
        if (modeToggleAdmin) modeToggleAdmin.textContent = 'MODO DIURNO';
        localStorage.setItem('theme', 'dark');
    } else {
        if (modeToggle) modeToggle.textContent = 'MODO NOTURNO';
        if (modeToggleAdmin) modeToggleAdmin.textContent = 'MODO NOTURNO';
        localStorage.setItem('theme', 'light');
    }
}

