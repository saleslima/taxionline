import { get } from "firebase/database";
import { driversRef, superadminCredentials } from "./config.js";

// Handle login form submission
export async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginErrorElement = document.getElementById('login-error');
    loginErrorElement.textContent = '';

    if (!username || !password) {
        loginErrorElement.textContent = 'Por favor, insira usuário e senha.';
        return;
    }

    // First check if it's the superadmin
    if (username === superadminCredentials.username && password === superadminCredentials.password) {
        console.log("Superadmin logged in");
        localStorage.setItem('userRole', 'superadmin');
        // Redirect to the motorista.html page
        window.location.href = 'motorista.html';
        return;
    }

    // Then check if it's a driver
    try {
        const driversSnapshot = await get(driversRef);
        const drivers = driversSnapshot.val();

        let authenticatedDriver = null;
        if (drivers) {
            for (const driverId in drivers) {
                const driver = drivers[driverId];
                if (driver.username === username && driver.password === password) {
                    authenticatedDriver = driver;
                    authenticatedDriver.driverId = driverId; 
                    break;
                }
            }
        }

        if (authenticatedDriver) {
            console.log("Driver logged in:", authenticatedDriver.name);
            localStorage.setItem('userRole', 'driver');
            localStorage.setItem('driverId', authenticatedDriver.driverId);
            
            // Redirect to the agenda.html page
            window.location.href = 'agenda.html';
        } else {
            loginErrorElement.textContent = 'Usuário ou senha inválidos.';
        }
    } catch (error) {
        console.error("Login error:", error);
        loginErrorElement.textContent = 'Erro ao fazer login. Tente novamente.';
    }
}

// Handle logout
export function logout() {
    localStorage.removeItem('userRole');
    localStorage.removeItem('driverId');
    
    // Redirect to login page
    window.location.href = 'index.html';
}

// Initialize login page
export function initLoginPage() {
    // Check if user is already logged in, redirect if necessary
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'driver') {
        window.location.href = 'agenda.html';
    } else if (userRole === 'superadmin') {
        window.location.href = 'motorista.html';
    }

    // Set up login button event listener
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }
}

// Initialize page with logout button
export function initLogoutButton() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    // Check if user should be on this page
    const userRole = localStorage.getItem('userRole');
    if (!userRole) {
        // Not logged in, redirect to login page
        window.location.href = 'index.html';
    } else if (userRole === 'driver' && window.location.pathname.includes('motorista.html')) {
        // Driver trying to access admin page
        window.location.href = 'agenda.html';
    } else if (userRole === 'superadmin' && window.location.pathname.includes('agenda.html')) {
        // Admin trying to access driver page
        window.location.href = 'motorista.html';
    }
}