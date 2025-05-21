/**
 * Location-related element creation functions
 */

// Create location element for a booking
export function createLocationElement(booking) {
    const locationContainer = document.createElement('div');
    locationContainer.classList.add('location-container');

    // Handle empty or missing location data
    if (!booking.startLocation && !booking.destinationLocation) {
        const p = document.createElement('p');
        p.classList.add('location-detail');
        p.textContent = 'LOCAIS: DADOS INDISPONÍVEIS';
        locationContainer.appendChild(p);
        return locationContainer;
    }

    if (booking.startLocation) {
        const startLocation = booking.startLocation;
        const p = document.createElement('p');
        p.classList.add('location-detail', 'start-location');
        
        // Handle string only startLocation (simple string format)
        if (typeof startLocation === 'string') {
            p.textContent = `LOCAL INÍCIO: ${startLocation.toUpperCase()}`;
        } else {
            // Handle complex object structure as before
            let address = 'LOCAL INÍCIO: ';
            if (startLocation.name && startLocation.type && String(startLocation.type).toUpperCase() !== 'ADDRESS') {
                address += `${startLocation.name}`;
                if (startLocation.type && String(startLocation.type).toUpperCase() !== 'ADDRESS') {
                    address += ` [${String(startLocation.type).toUpperCase()}]`;
                }
            } else if (startLocation.street) {
                address += `${startLocation.street}`;
                if (startLocation.number) address += `, ${startLocation.number}`;
                if (startLocation.neighborhood) address += ` - ${startLocation.neighborhood}`;
                if (startLocation.city) address += `, ${startLocation.city}`;
                if (startLocation.cep) address += ` (${startLocation.cep})`;
                if (startLocation.type && String(startLocation.type).toUpperCase() !== 'ADDRESS') {
                    address += ` [${String(startLocation.type).toUpperCase()}]`;
                }
            } else if (startLocation.name) {
                address += startLocation.name;
            }
            
            p.textContent = address.toUpperCase();
        }
        locationContainer.appendChild(p);
    }

    if (booking.destinationLocation) {
        const destinationLocation = booking.destinationLocation;
        const p = document.createElement('p');
        p.classList.add('location-detail', 'destination-location');
        
        // Handle string only destinationLocation (simple string format)
        if (typeof destinationLocation === 'string') {
            p.textContent = `DESTINO: ${destinationLocation.toUpperCase()}`;
            locationContainer.appendChild(p);
            return locationContainer;
        }
        
        // Handle simple object with only name property
        if (destinationLocation.name && Object.keys(destinationLocation).length === 1) {
            p.textContent = `DESTINO: ${destinationLocation.name.toUpperCase()}`;
            locationContainer.appendChild(p);
            return locationContainer;
        }
        
        // Original complex object handling
        let destination = 'DESTINO: ';

        if (destinationLocation.name && String(destinationLocation.type).toUpperCase() !== 'ADDRESS') {
            destination += `${destinationLocation.name}`;
            if (destinationLocation.type && String(destinationLocation.type).toUpperCase() !== 'ADDRESS') {
                destination += ` [${String(destinationLocation.type).toUpperCase()}]`;
            }
            if (destinationLocation.airline) destination += `, COMPANHIA: ${String(destinationLocation.airline).toUpperCase()}`;
            if (destinationLocation.terminal) destination += `, TERMINAL: ${String(destinationLocation.terminal).toUpperCase()}`;
        } else if (destinationLocation.street) {
            destination += `${destinationLocation.street}`;
            if (destinationLocation.number) destination += `, ${destinationLocation.number}`;
            if (destinationLocation.neighborhood) destination += ` - ${destinationLocation.neighborhood}`;
            if (destinationLocation.city) destination += `, ${destinationLocation.city}`;
            if (destinationLocation.cep) destination += ` (${destinationLocation.cep})`;
            if (destinationLocation.type && String(destinationLocation.type).toUpperCase() !== 'ADDRESS') {
                destination += ` [${String(destinationLocation.type).toUpperCase()}]`;
            }
        } else {
            const knownKeys = ['cep', 'city', 'neighborhood', 'number', 'street', 'name', 'type', 'airline', 'terminal'];
            const otherDetails = Object.keys(destinationLocation)
                .filter(key => destinationLocation[key] && !knownKeys.includes(key))
                .map(key => `${key.toUpperCase()}: ${String(destinationLocation[key]).toUpperCase()}`)
                .join(', ');

            if (otherDetails) {
                destination += otherDetails;
            } else if (Object.keys(destinationLocation || {}).length > 0) {
                destination += JSON.stringify(destinationLocation).toUpperCase();
            }
        }

        if (destination !== 'DESTINO: ' && destinationLocation.type && String(destinationLocation.type).toUpperCase() !== 'ADDRESS') {
            destination += ` [${String(destinationLocation.type).toUpperCase()}]`;
        }
        if (destination !== 'DESTINO: ') {
            p.textContent = destination;
            locationContainer.appendChild(p);
        } else if (Object.keys(destinationLocation || {}).length === 0) {
            const p = document.createElement('p');
            p.classList.add('location-detail', 'destination-location');
            p.textContent = 'DESTINO: DETALHES INDISPONÍVEIS';
            locationContainer.appendChild(p);
        }
    }

    return locationContainer;
}