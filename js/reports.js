import { get, ref, query, orderByChild, startAt, endAt } from "firebase/database";
import { database, driversRef } from "./config.js";
import { formatPhoneNumber } from "./utils.js";

// DOM Elements
const reportButton = document.getElementById('report-button');
const reportControls = document.getElementById('report-controls');
const generateReportButton = document.getElementById('generate-report');
const exportPdfButton = document.getElementById('export-pdf');
const closeReportButton = document.getElementById('close-report');
const reportStartDate = document.getElementById('report-start-date');
const reportEndDate = document.getElementById('report-end-date');
const reportDriverSelect = document.getElementById('report-driver');
const reportResults = document.getElementById('report-results');
const reportData = document.getElementById('report-data');
const reportTotal = document.getElementById('report-total');

// Initialize reports module
export async function initReportsModule() {
    if (!reportButton) return;
    
    // Set default dates (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    reportStartDate.value = formatDateForInput(firstDay);
    reportEndDate.value = formatDateForInput(today);
    
    // Populate driver select
    await populateDriverSelect();
    
    // Event listeners
    reportButton.addEventListener('click', () => {
        reportControls.classList.toggle('hidden');
        reportResults.classList.add('hidden');
    });
    
    closeReportButton.addEventListener('click', () => {
        reportControls.classList.add('hidden');
        reportResults.classList.add('hidden');
    });
    
    generateReportButton.addEventListener('click', generateReport);
    exportPdfButton.addEventListener('click', exportReportToPdf);
}

// Populate driver select dropdown
async function populateDriverSelect() {
    try {
        const driversSnapshot = await get(driversRef);
        const drivers = driversSnapshot.val() || {};
        
        // Clear existing options except the 'all' option
        while (reportDriverSelect.options.length > 1) {
            reportDriverSelect.options.remove(1);
        }
        
        // Add driver options
        Object.entries(drivers).forEach(([driverId, driver]) => {
            const option = document.createElement('option');
            option.value = driverId;
            option.textContent = String(driver.name || 'N/A').toUpperCase();
            reportDriverSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error loading drivers for report:", error);
    }
}

// Generate report based on selected criteria
async function generateReport() {
    const startDate = reportStartDate.value;
    const endDate = reportEndDate.value;
    const driverId = reportDriverSelect.value;
    
    if (!startDate || !endDate) {
        alert('Por favor, selecione as datas de início e fim.');
        return;
    }
    
    try {
        // Get all bookings
        const bookingsSnapshot = await get(ref(database, '/bookings'));
        const allBookings = bookingsSnapshot.val() || {};
        
        // Filter bookings by date and driver
        const filteredBookings = [];
        
        Object.entries(allBookings).forEach(([bookingId, booking]) => {
            // Skip if no date or in wrong format
            if (!booking.date) return;
            
            // Parse and compare dates
            const bookingDate = parseBrazilianDate(booking.date);
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59); // Include the entire end day
            
            if (bookingDate >= startDateObj && bookingDate <= endDateObj) {
                // Filter by driver if specific driver selected
                if (driverId !== 'all') {
                    if (booking.transferDetails && booking.transferDetails.driverId === driverId) {
                        filteredBookings.push({ bookingId, ...booking });
                    }
                } else {
                    // Include all bookings within date range
                    filteredBookings.push({ bookingId, ...booking });
                }
            }
        });
        
        // Sort by date
        filteredBookings.sort((a, b) => {
            const dateA = parseBrazilianDate(a.date);
            const dateB = parseBrazilianDate(b.date);
            return dateA - dateB;
        });
        
        // Display results
        displayReportResults(filteredBookings);
    } catch (error) {
        console.error("Error generating report:", error);
        alert('Erro ao gerar relatório. Verifique o console para detalhes.');
    }
}

// Display report results in the UI
function displayReportResults(bookings) {
    reportData.innerHTML = '';
    
    if (bookings.length === 0) {
        reportData.innerHTML = '<p>Nenhum registro encontrado para os critérios selecionados.</p>';
        reportResults.classList.remove('hidden');
        reportTotal.textContent = 'VALOR TOTAL: R$ 0,00';
        return;
    }
    
    // Create table
    const table = document.createElement('table');
    table.classList.add('report-table');
    
    // Header row
    const headerRow = document.createElement('tr');
    ['DATA', 'BOOKING ID', 'MOTORISTA', 'CLIENTE', 'ORIGEM', 'DESTINO', 'VALOR'].forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Data rows and calculate total
    let totalFare = 0;
    
    bookings.forEach(booking => {
        const row = document.createElement('tr');
        
        // Date
        const dateCell = document.createElement('td');
        dateCell.textContent = booking.date || 'N/A';
        row.appendChild(dateCell);
        
        // Booking ID
        const idCell = document.createElement('td');
        idCell.textContent = booking.bookingId || 'N/A';
        row.appendChild(idCell);
        
        // Driver
        const driverCell = document.createElement('td');
        driverCell.textContent = (booking.transferDetails && booking.transferDetails.driver) 
            ? booking.transferDetails.driver.toUpperCase() 
            : 'N/A';
        row.appendChild(driverCell);
        
        // Client
        const clientCell = document.createElement('td');
        clientCell.textContent = booking.name ? booking.name.toUpperCase() : 'N/A';
        row.appendChild(clientCell);
        
        // Origin
        const originCell = document.createElement('td');
        if (booking.startLocation) {
            if (typeof booking.startLocation === 'string') {
                originCell.textContent = booking.startLocation.toUpperCase();
            } else if (booking.startLocation.name) {
                originCell.textContent = booking.startLocation.name.toUpperCase();
            } else {
                originCell.textContent = 'N/A';
            }
        } else {
            originCell.textContent = 'N/A';
        }
        row.appendChild(originCell);
        
        // Destination
        const destCell = document.createElement('td');
        if (booking.destinationLocation) {
            if (typeof booking.destinationLocation === 'string') {
                destCell.textContent = booking.destinationLocation.toUpperCase();
            } else if (booking.destinationLocation.name) {
                destCell.textContent = booking.destinationLocation.name.toUpperCase();
            } else {
                destCell.textContent = 'N/A';
            }
        } else {
            destCell.textContent = 'N/A';
        }
        row.appendChild(destCell);
        
        // Fare
        const fareCell = document.createElement('td');
        if (booking.fare) {
            fareCell.textContent = `R$ ${booking.fare.toFixed(2)}`;
            totalFare += parseFloat(booking.fare);
        } else {
            fareCell.textContent = 'R$ 0,00';
        }
        row.appendChild(fareCell);
        
        table.appendChild(row);
    });
    
    reportData.appendChild(table);
    reportTotal.textContent = `VALOR TOTAL: R$ ${totalFare.toFixed(2)}`;
    reportResults.classList.remove('hidden');
}

// Export the report to PDF
function exportReportToPdf() {
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
        alert('Biblioteca PDF não carregada. Por favor, verifique sua conexão com a internet.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    
    try {
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(18);
        doc.text('RELATÓRIO DE CORRIDAS', 14, 20);
        
        // Add date range
        doc.setFontSize(12);
        doc.text(`Período: ${reportStartDate.value} até ${reportEndDate.value}`, 14, 30);
        
        // Add driver filter if specific driver selected
        if (reportDriverSelect.value !== 'all') {
            const driverName = reportDriverSelect.options[reportDriverSelect.selectedIndex].text;
            doc.text(`Motorista: ${driverName}`, 14, 40);
        }
        
        // Get table data
        const table = reportData.querySelector('table');
        if (!table) {
            alert('Nenhum dado para exportar. Gere o relatório primeiro.');
            return;
        }
        
        // Convert table to jsPDF autoTable format
        const tableData = [];
        const tableHeader = [];
        
        // Get headers
        const headerRow = table.querySelector('tr');
        if (headerRow) {
            headerRow.querySelectorAll('th').forEach(th => {
                tableHeader.push(th.textContent);
            });
        }
        
        // Get data rows
        table.querySelectorAll('tr:not(:first-child)').forEach(row => {
            const rowData = [];
            row.querySelectorAll('td').forEach(cell => {
                rowData.push(cell.textContent);
            });
            tableData.push(rowData);
        });
        
        // Add total row
        const totalText = reportTotal.textContent;
        tableData.push(['', '', '', '', '', 'TOTAL', totalText.replace('VALOR TOTAL: ', '')]);
        
        // Generate PDF table
        doc.autoTable({
            head: [tableHeader],
            body: tableData,
            startY: 50,
            theme: 'grid',
            styles: {
                fontSize: 8
            },
            headStyles: {
                fillColor: [66, 66, 66]
            }
        });
        
        // Save PDF
        const today = new Date();
        const fileName = `relatorio_corridas_${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert('Erro ao gerar PDF. Verifique o console para detalhes.');
    }
}

// Helper function to format date for input fields (YYYY-MM-DD)
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper function to parse Brazilian date format (DD/MM/YYYY)
function parseBrazilianDate(dateStr) {
    // Handle common Brazilian formats
    if (!dateStr) return new Date(0); // Default to epoch if no date
    
    // Try DD/MM/YYYY format
    if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
    }
    
    // Try DD-MM-YYYY format
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            // Check if year is first (YYYY-MM-DD) or last (DD-MM-YYYY)
            if (parts[0].length === 4) {
                // YYYY-MM-DD format
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                return new Date(year, month, day);
            } else {
                // DD-MM-YYYY format
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
        }
    }
    
    // Fall back to JS date parsing
    return new Date(dateStr);
}