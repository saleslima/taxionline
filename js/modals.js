import { get, ref, update } from "firebase/database";
import { database, driversRef } from "./config.js";

// DOM elements
const driverSelectionModal = document.getElementById('driver-selection-modal');
const transferDetailsModal = document.getElementById('transfer-details-modal');
const modalBookingIdSelection = document.getElementById('modal-booking-id-selection');
const modalBookingIdDetails = document.getElementById('modal-booking-id-details');
const driverListElement = document.getElementById('driver-list');
const modalAssignedDriverElement = document.getElementById('modal-assigned-driver');
const modalAssignedPlateElement = document.getElementById('modal-assigned-plate');
const modalAssignedColorElement = document.getElementById('modal-assigned-color');
const modalAssignedModelElement = document.getElementById('modal-assigned-model');
const closeButtons = document.querySelectorAll('.close-button');

let currentBookingIdForModal = null;

// Initialize modals
export function initModals() {
    // Close modals when clicking the close button
    closeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            hideModal(event.target.closest('.modal'));
        });
    });

    // Close modals when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === driverSelectionModal) {
            hideModal(driverSelectionModal);
        }
        if (event.target === transferDetailsModal) {
            hideModal(transferDetailsModal);
        }
    });
}

// Show a modal
export function showModal(modalElement) {
    modalElement.classList.remove('hidden');
}

// Hide a modal
export function hideModal(modalElement) {
    modalElement.classList.add('hidden');
    currentBookingIdForModal = null;
}

// Show driver selection modal
export async function showDriverSelectionModal(bookingId) {
    currentBookingIdForModal = bookingId;
    modalBookingIdSelection.textContent = bookingId ? bookingId.toUpperCase() : 'ID INDISPONÍVEL';
    await populateDriverList(bookingId);
    showModal(driverSelectionModal);
}

// Show transfer details modal
export async function showTransferDetailsModal(bookingId, transferDetails) {
    currentBookingIdForModal = bookingId;
    modalBookingIdDetails.textContent = bookingId ? bookingId.toUpperCase() : 'ID INDISPONÍVEL';
    modalAssignedDriverElement.textContent = transferDetails.driver ? `MOTORISTA: ${String(transferDetails.driver).toUpperCase()}` : 'MOTORISTA: N/A';
    modalAssignedPlateElement.textContent = transferDetails.plate ? `PLACA: ${String(transferDetails.plate).toUpperCase()}` : 'PLACA: N/A';
    modalAssignedColorElement.textContent = transferDetails.color ? `COR: ${String(transferDetails.color).toUpperCase()}` : 'COR: N/A';
    modalAssignedModelElement.textContent = transferDetails.model ? `MODELO: ${String(transferDetails.model).toUpperCase()}` : 'MODELO: N/A';
    showModal(transferDetailsModal);
}

// Populate driver list in driver selection modal
async function populateDriverList(bookingId) {
    driverListElement.innerHTML = '<p>Carregando motoristas...</p>';
    const driversSnapshot = await get(driversRef);
    const drivers = driversSnapshot.val();

    driverListElement.innerHTML = '';

    if (drivers) {
        const driverItems = Object.entries(drivers).map(([driverId, driver]) => {
            const div = document.createElement('div');
            div.classList.add('driver-item');
            div.dataset.driverId = driverId;
            div.innerHTML = `
                <p><strong>${String(driver.name || 'N/A').toUpperCase()}</strong></p>
                <p>PLACA: ${String(driver.plate || 'N/A').toUpperCase()}</p>
                <p>MODELO: ${String(driver.model || 'N/A').toUpperCase()}</p>
                <p>COR: ${String(driver.color || 'N/A').toUpperCase()}</p>
            `;
            div.addEventListener('click', () => handleDriverSelection(bookingId, driverId, driver));
            return div;
        });
        driverItems.forEach(item => driverListElement.appendChild(item));
    } else {
        driverListElement.innerHTML = '<p>Nenhum motorista cadastrado.</p>';
    }
}

// Handle driver selection for a booking
async function handleDriverSelection(bookingId, driverId, driverDetails) {
    console.log(`Assigning booking ${bookingId} to driver ${driverId}`);

    try {
        await update(ref(database, `/bookings/${bookingId}`), {
            scheduled: true,
            transferDetails: {
                driverId: driverId,
                driver: driverDetails.name,
                plate: driverDetails.plate,
                model: driverDetails.model,
                color: driverDetails.color
            }
        });
        console.log("Booking updated with transfer details");
        hideModal(driverSelectionModal);
        localStorage.setItem(`bookingStatus_${bookingId}`, 'TRANSFERIR');
    } catch (error) {
        console.error("Error assigning driver:", error);
    }
}

export { driverSelectionModal, transferDetailsModal };