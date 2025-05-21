/**
 * Driver-related element creation functions
 */
import { get } from "firebase/database";
import { driversRef } from "../config.js";
import { handleDriverDropdownChange } from "../booking-handlers.js";

// Create driver selection dropdown
export async function createDriverSelectElement(bookingId, booking) {
    const driverContainer = document.createElement('div');
    driverContainer.classList.add('status-select-container');

    const driverLabel = document.createElement('label');
    driverLabel.textContent = 'MOTORISTA:';
    driverContainer.appendChild(driverLabel);

    const driverSelect = document.createElement('select');
    driverSelect.dataset.bookingId = bookingId;

    // Add default "Selecionar" option
    const optionDefault = document.createElement('option');
    optionDefault.value = '';
    optionDefault.textContent = 'SELECIONAR';
    driverSelect.appendChild(optionDefault);

    // Fetch and add all drivers
    try {
        const driversSnapshot = await get(driversRef);
        const driversData = driversSnapshot.val();
        if (driversData) {
            Object.entries(driversData).forEach(([driverId, driver]) => {
                const option = document.createElement('option');
                option.value = driverId;
                option.textContent = String(driver.name || 'N/A').toUpperCase();
                driverSelect.appendChild(option);
                
                // Pre-select the driver if this booking already has assigned driver
                if (booking.transferDetails && booking.transferDetails.driverId === driverId) {
                    driverSelect.value = driverId;
                }
            });
        }
    } catch (error) {
        console.error("Error loading drivers for dropdown:", error);
    }

    // Add event listener for driver selection
    driverSelect.addEventListener('change', async (event) => {
        await handleDriverDropdownChange(event, booking);
    });

    driverContainer.appendChild(driverSelect);
    return driverContainer;
}