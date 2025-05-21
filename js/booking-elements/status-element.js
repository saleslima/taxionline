/**
 * Status-related element creation functions
 */
import { handleStatusChange } from "../booking-handlers.js";
import { database } from "../config.js";
import { ref, update } from "firebase/database";

// Create status dropdown element
export async function createStatusElement(bookingId, booking) {
    const statusContainer = document.createElement('div');
    statusContainer.classList.add('status-select-container');

    const statusLabel = document.createElement('label');
    statusLabel.textContent = 'AGENDADO:';
    statusContainer.appendChild(statusLabel);

    const statusSelect = document.createElement('select');
    statusSelect.dataset.bookingId = bookingId;

    const optionNo = document.createElement('option');
    optionNo.value = 'NAO';
    optionNo.textContent = 'NÃO';
    statusSelect.appendChild(optionNo);

    const optionYes = document.createElement('option');
    optionYes.value = 'SIM';
    optionYes.textContent = 'SIM';
    statusSelect.appendChild(optionYes);

    const optionTransfer = document.createElement('option');
    optionTransfer.value = 'TRANSFERIR';
    optionTransfer.textContent = 'TRANSFERIR';
    statusSelect.appendChild(optionTransfer);

    let firebaseStatus = 'NAO';
    if (booking.scheduled === true && !booking.transferDetails) {
        firebaseStatus = 'SIM';
    } else if (booking.transferDetails) {
        firebaseStatus = 'TRANSFERIR';
    }

    const savedStatus = localStorage.getItem(`bookingStatus_${bookingId}`) || firebaseStatus;
    statusSelect.value = savedStatus;

    statusSelect.addEventListener('change', async (event) => {
        await handleStatusChange(event);
    });

    statusContainer.appendChild(statusSelect);
    
    // Fare input field - shown when scheduled or transferred
    const fareContainer = document.createElement('div');
    fareContainer.classList.add('fare-container');
    
    const fareLabel = document.createElement('label');
    fareLabel.textContent = 'VALOR (R$):';
    fareContainer.appendChild(fareLabel);
    
    const fareInput = document.createElement('input');
    fareInput.type = 'number';
    fareInput.min = '0';
    fareInput.step = '0.01';
    fareInput.placeholder = '0,00';
    fareInput.dataset.bookingId = bookingId;
    fareInput.classList.add('fare-input');
    
    // Check if we already have a fare value
    if (booking.fare) {
        fareInput.value = booking.fare;
    }
    
    fareInput.addEventListener('change', async (event) => {
        const id = event.target.dataset.bookingId;
        const value = event.target.value;
        
        try {
            await update(ref(database, `/bookings/${id}`), {
                fare: parseFloat(value)
            });
            console.log("Fare updated for booking", id);
        } catch (error) {
            console.error("Error updating fare:", error);
        }
    });
    
    fareContainer.appendChild(fareInput);
    
    // Only show fare input if status is SIM or TRANSFERIR
    if (savedStatus === 'SIM' || savedStatus === 'TRANSFERIR') {
        statusContainer.appendChild(fareContainer);
    }
    
    return statusContainer;
}