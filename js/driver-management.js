import { get, push, set, ref, update, remove } from "firebase/database";
import { database, driversRef } from "./config.js";

// DOM elements
const listDriversButton = document.getElementById('list-drivers-button');
const driverListContainer = document.getElementById('driver-list-container');
const driverRegistrationForm = document.getElementById('driver-registration-form');
const currentDriverIdInput = document.getElementById('current-driver-id');
const driverNameInput = document.getElementById('driver-name');
const driverPlateInput = document.getElementById('driver-plate');
const driverModelInput = document.getElementById('driver-model');
const driverColorInput = document.getElementById('driver-color');
const driverYearInput = document.getElementById('driver-year');
const driverWhatsappInput = document.getElementById('driver-whatsapp');
const driverUsernameInput = document.getElementById('driver-username');
const driverPasswordInput = document.getElementById('driver-password');
const registerDriverButton = document.getElementById('register-driver-button');
const editDriverButton = document.getElementById('edit-driver-button');
const deleteDriverButton = document.getElementById('delete-driver-button');
const cancelEditButton = document.getElementById('cancel-edit-button');
const registrationMessageElement = document.getElementById('registration-message');

// Initialize driver management
export function initDriverManagement() {
    listDriversButton.addEventListener('click', listDrivers);
    cancelEditButton.addEventListener('click', clearDriverForm);
    registerDriverButton.addEventListener('click', registerDriver);
    editDriverButton.addEventListener('click', editDriver);
    deleteDriverButton.addEventListener('click', deleteDriver);
    
    // Listen for custom event from auth module
    document.addEventListener('load-drivers', listDrivers);
}

// Clear the driver form
function clearDriverForm() {
    currentDriverIdInput.value = '';
    driverNameInput.value = '';
    driverPlateInput.value = '';
    driverModelInput.value = '';
    driverColorInput.value = '';
    driverYearInput.value = '';
    driverWhatsappInput.value = '';
    driverUsernameInput.value = '';
    driverPasswordInput.value = '';
    registrationMessageElement.textContent = '';

    registerDriverButton.classList.remove('hidden');
    editDriverButton.classList.add('hidden');
    deleteDriverButton.classList.add('hidden');
    cancelEditButton.classList.add('hidden');
    driverRegistrationForm.querySelector('h2').textContent = 'CADASTRAR NOVO MOTORISTA';
}

// List all drivers
async function listDrivers() {
    driverListContainer.innerHTML = '<p>Carregando motoristas...</p>';
    try {
        const snapshot = await get(driversRef);
        const drivers = snapshot.val();

        driverListContainer.innerHTML = '';

        if (drivers) {
            Object.entries(drivers).forEach(([driverId, driver]) => {
                const driverItem = document.createElement('div');
                driverItem.classList.add('driver-list-item');
                driverItem.textContent = String(driver.name || 'N/A').toUpperCase();
                driverItem.dataset.driverId = driverId;
                driverItem.addEventListener('click', () => loadDriverForEdit(driverId, driver));
                driverListContainer.appendChild(driverItem);
            });
        } else {
            driverListContainer.innerHTML = '<p>Nenhum motorista cadastrado.</p>';
        }
    } catch (error) {
        console.error("Erro ao listar motoristas:", error);
        driverListContainer.innerHTML = `<p>ERRO AO CARREGAR MOTORISTAS: ${error.message.toUpperCase()}</p>`;
    }
}

// Load driver data for editing
function loadDriverForEdit(driverId, driver) {
    currentDriverIdInput.value = driverId;
    driverNameInput.value = driver.name || '';
    driverPlateInput.value = driver.plate || '';
    driverModelInput.value = driver.model || '';
    driverColorInput.value = driver.color || '';
    driverYearInput.value = driver.year || '';
    driverWhatsappInput.value = driver.whatsapp || '';
    driverUsernameInput.value = driver.username || '';
    driverPasswordInput.value = driver.password || '';

    registerDriverButton.classList.add('hidden');
    editDriverButton.classList.remove('hidden');
    deleteDriverButton.classList.remove('hidden');
    cancelEditButton.classList.remove('hidden');
    driverRegistrationForm.querySelector('h2').textContent = `EDITAR/EXCLUIR MOTORISTA: ${String(driver.name).toUpperCase()}`;
    registrationMessageElement.textContent = '';
}

// Register a new driver
async function registerDriver() {
    registrationMessageElement.textContent = '';

    const name = driverNameInput.value.trim();
    const plate = driverPlateInput.value.trim().toUpperCase();
    const model = driverModelInput.value.trim();
    const color = driverColorInput.value.trim();
    const year = driverYearInput.value.trim();
    const whatsapp = driverWhatsappInput.value.trim().replace(/\D/g, '');
    const username = driverUsernameInput.value.trim();
    const password = driverPasswordInput.value.trim();

    if (!name || !plate || !model || !color || !username || !password) {
        registrationMessageElement.textContent = 'Campos Nome, Placa, Modelo, Cor, Usuário e Senha são obrigatórios.';
        registrationMessageElement.style.color = 'red';
        return;
    }

    // Check for duplicate username
    const driversSnapshot = await get(driversRef);
    const drivers = driversSnapshot.val();
    if (drivers) {
        const usernameExists = Object.entries(drivers).some(([id, driver]) =>
            driver.username === username
        );
        if (usernameExists) {
            registrationMessageElement.textContent = 'Nome de usuário já existe.';
            registrationMessageElement.style.color = 'red';
            return;
        }
    }

    try {
        const newDriverRef = push(driversRef);
        await set(newDriverRef, {
            name: name,
            plate: plate,
            model: model,
            color: color,
            year: year || null,
            whatsapp: whatsapp || null,
            username: username,
            password: password
        });
        registrationMessageElement.textContent = 'Motorista cadastrado com sucesso!';
        registrationMessageElement.style.color = 'green';
        clearDriverForm();
        listDrivers();
    } catch (error) {
        console.error("Erro ao cadastrar motorista:", error);
        registrationMessageElement.textContent = `Erro ao cadastrar motorista: ${error.message}`;
        registrationMessageElement.style.color = 'red';
    }
}

// Edit an existing driver
async function editDriver() {
    const driverId = currentDriverIdInput.value;
    if (!driverId) {
        registrationMessageElement.textContent = 'Nenhum motorista selecionado para editar.';
        registrationMessageElement.style.color = 'red';
        return;
    }

    registrationMessageElement.textContent = '';

    const name = driverNameInput.value.trim();
    const plate = driverPlateInput.value.trim().toUpperCase();
    const model = driverModelInput.value.trim();
    const color = driverColorInput.value.trim();
    const year = driverYearInput.value.trim();
    const whatsapp = driverWhatsappInput.value.trim().replace(/\D/g, '');
    const username = driverUsernameInput.value.trim();
    const password = driverPasswordInput.value.trim();

    if (!name || !plate || !model || !color || !username || !password) {
        registrationMessageElement.textContent = 'Campos Nome, Placa, Modelo, Cor, Usuário e Senha são obrigatórios.';
        registrationMessageElement.style.color = 'red';
        return;
    }

    // Check for duplicate username
    const driversSnapshot = await get(driversRef);
    const drivers = driversSnapshot.val();
    if (drivers) {
        const usernameExists = Object.entries(drivers).some(([id, driver]) =>
            driver.username === username && id !== driverId
        );
        if (usernameExists) {
            registrationMessageElement.textContent = 'Nome de usuário já existe.';
            registrationMessageElement.style.color = 'red';
            return;
        }
    }

    try {
        await update(ref(database, `/drivers/${driverId}`), {
            name: name,
            plate: plate,
            model: model,
            color: color,
            year: year || null,
            whatsapp: whatsapp || null,
            username: username,
            password: password
        });
        registrationMessageElement.textContent = 'Motorista atualizado com sucesso!';
        registrationMessageElement.style.color = 'green';
        clearDriverForm();
        listDrivers();
    } catch (error) {
        console.error("Erro ao atualizar motorista:", error);
        registrationMessageElement.textContent = `Erro ao atualizar motorista: ${error.message}`;
        registrationMessageElement.style.color = 'red';
    }
}

// Delete a driver
async function deleteDriver() {
    const driverId = currentDriverIdInput.value;
    if (!driverId) {
        registrationMessageElement.textContent = 'Nenhum motorista selecionado para excluir.';
        registrationMessageElement.style.color = 'red';
        return;
    }

    if (confirm('Tem certeza que deseja excluir este motorista?')) {
        try {
            await remove(ref(database, `/drivers/${driverId}`));
            registrationMessageElement.textContent = 'Motorista excluído com sucesso!';
            registrationMessageElement.style.color = 'green';
            clearDriverForm();
            listDrivers();
        } catch (error) {
            console.error("Erro ao excluir motorista:", error);
            registrationMessageElement.textContent = `Erro ao excluir motorista: ${error.message}`;
            registrationMessageElement.style.color = 'red';
        }
    }
}

// Export for use in other modules
export async function getDrivers() {
    const snapshot = await get(driversRef);
    return snapshot.val();
}