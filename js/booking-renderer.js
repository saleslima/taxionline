import { get, ref, update, remove } from "firebase/database";
import { database, driversRef } from "./config.js";
import { formatPhoneNumber } from "./utils.js";
import { createPhoneElement } from "./booking-elements/phone-element.js";
import { createLocationElement } from "./booking-elements/location-element.js";
import { createStatusElement } from "./booking-elements/status-element.js";
import { createDriverSelectElement } from "./booking-elements/driver-element.js";

// Create a DOM element for a booking
export async function createBookingElement(bookingId, booking) {
    if (!booking) {
        console.error("Booking data missing for ID:", bookingId);
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('data-item', 'error-item');
        errorDiv.textContent = `ERRO: DADOS FALTANDO PARA BOOKING ID ${bookingId}`;
        return errorDiv;
    }
    
    const bookingDiv = document.createElement('div');
    bookingDiv.classList.add('data-item');
    bookingDiv.dataset.bookingId = bookingId;
    
    // Add flashing animation for unscheduled bookings
    if (!booking.scheduled) {
        bookingDiv.classList.add('unscheduled-booking');
    } else {
        bookingDiv.classList.add('scheduled-booking');
    }
    
    // Add timestamp for new booking detection
    const storedTimestamp = localStorage.getItem(`bookingTimestamp_${bookingId}`);
    const currentTimestamp = Date.now();
    
    if (!storedTimestamp) {
        localStorage.setItem(`bookingTimestamp_${bookingId}`, currentTimestamp);
        bookingDiv.dataset.timestamp = currentTimestamp;
    } else {
        bookingDiv.dataset.timestamp = storedTimestamp;
    }
    
    // Booking title
    const bookingTitle = document.createElement('h3');
    bookingTitle.textContent = `BOOKING ID: ${bookingId.toUpperCase()}`;
    bookingDiv.appendChild(bookingTitle);
    
    // Inline details (name, date, time)
    const inlineDetailsDiv = document.createElement('div');
    inlineDetailsDiv.classList.add('inline-details');
    
    if (booking.name) {
        const p = document.createElement('p');
        p.textContent = `NOME: ${String(booking.name).toUpperCase()}`;
        inlineDetailsDiv.appendChild(p);
    }

    if (booking.date) {
        const p = document.createElement('p');
        p.textContent = `DATA: ${String(booking.date).toUpperCase()}`;
        inlineDetailsDiv.appendChild(p);
    }

    if (booking.time) {
        const p = document.createElement('p');
        p.textContent = `HORA: ${String(booking.time).toUpperCase()}`;
        inlineDetailsDiv.appendChild(p);
    }
    
    bookingDiv.appendChild(inlineDetailsDiv);

    // Location details
    const locationContainer = await createLocationElement(booking);
    bookingDiv.appendChild(locationContainer);

    // Phone and status container
    const phoneAndStatusContainer = document.createElement('div');
    phoneAndStatusContainer.classList.add('phone-status-container');
    
    // Phone with WhatsApp link
    if (booking.phone) {
        const pPhone = await createPhoneElement(booking.phone);
        phoneAndStatusContainer.appendChild(pPhone);
    }

    // Status dropdown
    const statusContainer = await createStatusElement(bookingId, booking);
    phoneAndStatusContainer.appendChild(statusContainer);

    // Driver selection dropdown
    const driverContainer = await createDriverSelectElement(bookingId, booking);
    phoneAndStatusContainer.appendChild(driverContainer);
    
    bookingDiv.appendChild(phoneAndStatusContainer);

    // Transfer details section if assigned
    if (booking.transferDetails) {
        const transferDetailsDiv = document.createElement('div');
        transferDetailsDiv.classList.add('transfer-details');
        transferDetailsDiv.innerHTML = `
            <h4>TRANSFERIDO PARA:</h4>
            <p>MOTORISTA: ${String(booking.transferDetails.driver || 'N/A').toUpperCase()}</p>
            <p>VEÍCULO: ${String(booking.transferDetails.color || 'N/A').toUpperCase()} ${String(booking.transferDetails.model || 'N/A').toUpperCase()} (PLACA: ${String(booking.transferDetails.plate || 'N/A').toUpperCase()})</p>
        `;
        bookingDiv.appendChild(transferDetailsDiv);
    }

    // Add booking actions - Complete and Delete buttons
    const actionsContainer = document.createElement('div');
    actionsContainer.classList.add('booking-actions');
    
    const completeButton = document.createElement('button');
    completeButton.textContent = 'ENCERRAR';
    completeButton.classList.add('complete-button');
    completeButton.dataset.bookingId = bookingId;
    completeButton.addEventListener('click', async (event) => {
        const id = event.target.dataset.bookingId;
        if (confirm('Deseja encerrar esta corrida? Ela não aparecerá mais na listagem ativa.')) {
            try {
                await update(ref(database, `/bookings/${id}`), {
                    completed: true,
                    completedAt: new Date().toISOString()
                });
                event.target.closest('.data-item').remove();
            } catch (error) {
                console.error("Error completing booking:", error);
            }
        }
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'EXCLUIR';
    deleteButton.classList.add('delete-button');
    deleteButton.dataset.bookingId = bookingId;
    deleteButton.addEventListener('click', async (event) => {
        const id = event.target.dataset.bookingId;
        if (confirm('Deseja excluir permanentemente esta corrida? Esta ação não pode ser desfeita.')) {
            try {
                await remove(ref(database, `/bookings/${id}`));
                event.target.closest('.data-item').remove();
            } catch (error) {
                console.error("Error deleting booking:", error);
            }
        }
    });
    
    actionsContainer.appendChild(completeButton);
    actionsContainer.appendChild(deleteButton);
    bookingDiv.appendChild(actionsContainer);

    // Copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = 'COPIAR DADOS';
    copyButton.classList.add('copy-button');
    copyButton.dataset.bookingId = bookingId;
    copyButton.addEventListener('click', (event) => handleCopyButtonClick(event));
    bookingDiv.appendChild(copyButton);

    return bookingDiv;
}

// Handle copy button click
export async function handleCopyButtonClick(event) {
    const idToCopy = event.target.dataset.bookingId;
    const bookingDataToCopy = (await get(ref(database, `/bookings/${idToCopy}`))).val();

    if (!bookingDataToCopy) {
        console.error("Dados para copiar não encontrados:", idToCopy);
        return;
    }

    let copyText = '';

    if (bookingDataToCopy.name) copyText += `NOME: ${String(bookingDataToCopy.name).toUpperCase()}\n\n`;
    if (bookingDataToCopy.date) copyText += `DATA: ${String(bookingDataToCopy.date).toUpperCase()}\n\n`;
    if (bookingDataToCopy.time) copyText += `HORA: ${String(bookingDataToCopy.time).toUpperCase()}\n\n`;

    // Add location information
    if (bookingDataToCopy.startLocation) {
        // Handle string or object startLocation
        if (typeof bookingDataToCopy.startLocation === 'string') {
            copyText += `LOCAL INÍCIO: ${bookingDataToCopy.startLocation.toUpperCase()}\n\n`;
        } else {
            let startAddress = 'LOCAL INÍCIO: ';
            if (bookingDataToCopy.startLocation.name && bookingDataToCopy.startLocation.type && String(bookingDataToCopy.startLocation.type).toUpperCase() !== 'ADDRESS') {
                startAddress += `${bookingDataToCopy.startLocation.name}`;
                if (bookingDataToCopy.startLocation.type && String(bookingDataToCopy.startLocation.type).toUpperCase() !== 'ADDRESS') {
                    startAddress += ` [${String(bookingDataToCopy.startLocation.type).toUpperCase()}]`;
                }
            } else if (bookingDataToCopy.startLocation.street) {
                startAddress += `${bookingDataToCopy.startLocation.street}`;
                if (bookingDataToCopy.startLocation.number) startAddress += `, ${bookingDataToCopy.startLocation.number}`;
                if (bookingDataToCopy.startLocation.neighborhood) startAddress += ` - ${bookingDataToCopy.startLocation.neighborhood}`;
                if (bookingDataToCopy.startLocation.city) startAddress += `, ${bookingDataToCopy.startLocation.city}`;
                if (bookingDataToCopy.startLocation.cep) startAddress += ` (${bookingDataToCopy.startLocation.cep})`;
                if (bookingDataToCopy.startLocation.type && String(bookingDataToCopy.startLocation.type).toUpperCase() !== 'ADDRESS') {
                    startAddress += ` [${String(bookingDataToCopy.startLocation.type).toUpperCase()}]`;
                }
            } else if (bookingDataToCopy.startLocation.name) {
                startAddress += bookingDataToCopy.startLocation.name;
            }
            copyText += `${startAddress.toUpperCase()}\n\n`;
        }
    }

    // Add destination information
    if (bookingDataToCopy.destinationLocation) {
        // Handle string or object destinationLocation
        if (typeof bookingDataToCopy.destinationLocation === 'string') {
            copyText += `DESTINO: ${bookingDataToCopy.destinationLocation.toUpperCase()}\n\n`;
        } else if (bookingDataToCopy.destinationLocation.name && Object.keys(bookingDataToCopy.destinationLocation).length === 1) {
            copyText += `DESTINO: ${bookingDataToCopy.destinationLocation.name.toUpperCase()}\n\n`;
        } else {
            let destination = 'DESTINO: ';
            if (bookingDataToCopy.destinationLocation.name && bookingDataToCopy.destinationLocation.type && String(bookingDataToCopy.destinationLocation.type).toUpperCase() !== 'ADDRESS') {
                destination += `${bookingDataToCopy.destinationLocation.name}`;
                if (bookingDataToCopy.destinationLocation.type && String(bookingDataToCopy.destinationLocation.type).toUpperCase() !== 'ADDRESS') {
                    destination += ` [${String(bookingDataToCopy.destinationLocation.type).toUpperCase()}]`;
                }
                if (bookingDataToCopy.destinationLocation.airline) destination += `, COMPANHIA: ${String(bookingDataToCopy.destinationLocation.airline).toUpperCase()}`;
                if (bookingDataToCopy.destinationLocation.terminal) destination += `, TERMINAL: ${String(bookingDataToCopy.destinationLocation.terminal).toUpperCase()}`;
            } else if (bookingDataToCopy.destinationLocation.street) {
                destination += `${bookingDataToCopy.destinationLocation.street}`;
                if (bookingDataToCopy.destinationLocation.number) destination += `, ${bookingDataToCopy.destinationLocation.number}`;
                if (bookingDataToCopy.destinationLocation.neighborhood) destination += ` - ${bookingDataToCopy.destinationLocation.neighborhood}`;
                if (bookingDataToCopy.destinationLocation.city) destination += `, ${bookingDataToCopy.destinationLocation.city}`;
                if (bookingDataToCopy.destinationLocation.cep) destination += ` (${bookingDataToCopy.destinationLocation.cep})`;
                if (bookingDataToCopy.destinationLocation.type && String(bookingDataToCopy.destinationLocation.type).toUpperCase() !== 'ADDRESS') {
                    destination += ` [${String(bookingDataToCopy.destinationLocation.type).toUpperCase()}]`;
                }
            } else {
                const knownKeys = ['cep', 'city', 'neighborhood', 'number', 'street', 'name', 'type', 'airline', 'terminal'];
                const otherDetails = Object.keys(bookingDataToCopy.destinationLocation)
                    .filter(key => bookingDataToCopy.destinationLocation[key] && !knownKeys.includes(key))
                    .map(key => `${key.toUpperCase()}: ${String(bookingDataToCopy.destinationLocation[key]).toUpperCase()}`)
                    .join(', ');

                if (otherDetails) {
                    destination += otherDetails;
                } else if (Object.keys(bookingDataToCopy.destinationLocation).length > 0) {
                    destination += JSON.stringify(bookingDataToCopy.destinationLocation).toUpperCase();
                }
            }
            copyText += `${destination}\n\n`;
        }
    }

    // Add phone and status
    if (bookingDataToCopy.phone) {
        const formattedPhoneForCopy = formatPhoneNumber(bookingDataToCopy.phone);
        copyText += `TELEFONE: ${formattedPhoneForCopy.toUpperCase()}\n\n`;
    }

    const currentSelectedStatus = event.target.parentNode.querySelector('select').value;
    copyText += `AGENDADO: ${currentSelectedStatus.toUpperCase()}\n`;

    // Add transfer details if available
    if (currentSelectedStatus === 'TRANSFERIR' && bookingDataToCopy.transferDetails) {
        copyText += `DETALHES TRANSFERÊNCIA:\n`;
        if (bookingDataToCopy.transferDetails.driver) copyText += `MOTORISTA: ${String(bookingDataToCopy.transferDetails.driver).toUpperCase()}\n`;
        if (bookingDataToCopy.transferDetails.plate) copyText += `PLACA: ${String(bookingDataToCopy.transferDetails.plate).toUpperCase()}\n`;
        if (bookingDataToCopy.transferDetails.color) copyText += `COR: ${String(bookingDataToCopy.transferDetails.color).toUpperCase()}\n`;
        if (bookingDataToCopy.transferDetails.model) copyText += `MODELO: ${String(bookingDataToCopy.transferDetails.model).toUpperCase()}\n`;
    }

    // Copy to clipboard
    try {
        await navigator.clipboard.writeText(copyText);
        console.log('Dados copiados:', copyText);
        event.target.textContent = 'COPIADO!';
        event.target.classList.add('copied');
        setTimeout(() => {
            event.target.textContent = 'COPIAR DADOS';
            event.target.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Falha ao copiar texto:', err);
        event.target.textContent = 'ERRO AO COPIAR';
        event.target.classList.add('error');
        setTimeout(() => {
            event.target.textContent = 'COPIAR DADOS';
            event.target.classList.remove('error');
        }, 2000);
    }
}