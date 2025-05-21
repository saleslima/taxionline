import { get, ref, update, remove } from "firebase/database";
import { database } from "./config.js";
import { formatPhoneNumber } from "./utils.js";
import { showDriverSelectionModal, showTransferDetailsModal } from "./modals.js";

// Handle status dropdown change
export async function handleStatusChange(event) {
    const id = event.target.dataset.bookingId;
    const value = event.target.value;

    localStorage.setItem(`bookingStatus_${id}`, value);
    
    // Remove new-booking class when status changes to SIM or TRANSFERIR
    if (value === 'SIM' || value === 'TRANSFERIR') {
        const bookingElement = event.target.closest('.data-item');
        if (bookingElement) {
            bookingElement.classList.remove('new-booking');
        }
        
        // Show fare input
        const statusContainer = event.target.closest('.status-select-container');
        if (!statusContainer.querySelector('.fare-container')) {
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
            fareInput.dataset.bookingId = id;
            fareInput.classList.add('fare-input');
            
            const bookingData = (await get(ref(database, `/bookings/${id}`))).val();
            if (bookingData && bookingData.fare) {
                fareInput.value = bookingData.fare;
            }
            
            fareInput.addEventListener('change', async (evt) => {
                try {
                    await update(ref(database, `/bookings/${id}`), {
                        fare: parseFloat(evt.target.value)
                    });
                } catch (error) {
                    console.error("Error updating fare:", error);
                }
            });
            
            fareContainer.appendChild(fareInput);
            statusContainer.appendChild(fareContainer);
        }
    } else {
        // Hide fare input
        const statusContainer = event.target.closest('.status-select-container');
        const fareContainer = statusContainer.querySelector('.fare-container');
        if (fareContainer) {
            fareContainer.remove();
        }
    }

    if (value === 'TRANSFERIR') {
        const bookingDataCurrent = (await get(ref(database, `/bookings/${id}`))).val();

        if (bookingDataCurrent && bookingDataCurrent.transferDetails) {
            showTransferDetailsModal(id, bookingDataCurrent.transferDetails);
        } else {
            showDriverSelectionModal(id);
            update(ref(database, `/bookings/${id}`), { scheduled: true })
                .catch(e => console.error("Failed to update scheduled status to true for TRANSFERIR:", e));
        }
    } else {
        const updates = {
            scheduled: (value === 'SIM'),
            transferDetails: null
        };
        update(ref(database, `/bookings/${id}`), updates)
            .catch(e => console.error("Failed to update scheduled status or remove transfer details:", e));
    }
}

// Handle driver dropdown change
export async function handleDriverDropdownChange(event, booking) {
    const id = event.target.dataset.bookingId;
    const driverId = event.target.value;
    
    if (driverId) {
        // Get the current status from localStorage instead of forcibly setting it to TRANSFERIR
        const currentStatus = localStorage.getItem(`bookingStatus_${id}`) || 'NAO';
        
        // Get driver details
        const driverSnapshot = await get(ref(database, `/drivers/${driverId}`));
        const driverDetails = driverSnapshot.val();
        
        if (driverDetails) {
            // Update booking with driver details
            await update(ref(database, `/bookings/${id}`), {
                scheduled: true,
                transferDetails: {
                    driverId: driverId,
                    driver: driverDetails.name,
                    plate: driverDetails.plate,
                    model: driverDetails.model,
                    color: driverDetails.color
                }
            });
        }
    }
}