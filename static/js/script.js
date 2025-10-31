// Global variables
let currentUser = null;
let allCrops = [];

// =================================================================
// INITIALIZATION & CORE APP LOGIC
// =================================================================
document.addEventListener('DOMContentLoaded', async function() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        // Redirect to appropriate dashboard if on the landing page
        const path = window.location.pathname;
        if (path === '/') {
            redirectToDashboard();
        }
    }
    // Load crops for validation on the index page
    if (document.getElementById('choicePanel')) {
       await loadCrops();
    }
    // Add event listener for clicks outside the profile menu
    document.addEventListener('click', closeProfileMenuOnClickOutside);
});

// =================================================================
// API DATA FETCHING FUNCTIONS (CENTRALIZED)
// =================================================================

// Fetch users from server
async function getUsers() {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Could not fetch users');
    const data = await res.json();
    return data.users || data;
}

// Fetch inventory from server
async function getInventory() {
    const res = await fetch('/api/inventory');
    if (!res.ok) throw new Error('Failed to fetch inventory');
    const data = await res.json();
    return data.inventory || data;
}

// Fetch orders from server
async function getOrders() {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    const data = await res.json();
    return data.orders || data;
}

// Load crops from server
async function loadCrops() {
    try {
        const response = await fetch('/api/crops');
        const data = await response.json();
        allCrops = [...data.crops, ...data.dairy_products, ...data.other];
    } catch (error) {
        console.error('Error loading crops:', error);
        // Fallback crops list
        allCrops = ["Rice", "Wheat", "Corn", "Tomato", "Potato", "Onion", "Milk", "Eggs"];
    }
}

// Save single user to server
async function saveUser(user) {
    const res = await fetch('/api/users', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(user),
    });
    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save user');
    }
    return await res.json();
}

// =================================================================
// UI & PANEL VISIBILITY (for index.html)
// =================================================================

function showChoice() {
    hideAllPanels();
    document.getElementById('choicePanel')?.classList.remove('hidden');
}

function showRegisterFarmer() {
    hideAllPanels();
    document.getElementById('registerFarmerPanel')?.classList.remove('hidden');
}

function showRegisterBuyer() {
    hideAllPanels();
    document.getElementById('registerBuyerPanel')?.classList.remove('hidden');
}

function showLogin() {
    hideAllPanels();
    document.getElementById('loginPanel')?.classList.remove('hidden');
}

function hideAllPanels() {
    const panels = document.querySelectorAll('.auth-panel');
    panels.forEach(panel => panel.classList.add('hidden'));
}

// Toggle profile menu
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu?.classList.toggle('hidden');
}

// Close profile menu when clicking outside
function closeProfileMenuOnClickOutside(event) {
    const profileCircle = document.querySelector('.profile-circle');
    const profileMenu = document.getElementById('profileMenu');
    if (profileCircle && profileMenu && !profileCircle.contains(event.target) && !profileMenu.contains(event.target)) {
        profileMenu.classList.add('hidden');
    }
}

// =================================================================
// USER AUTHENTICATION & REGISTRATION
// =================================================================

async function registerFarmer(event) {
    event.preventDefault();
    const email = document.getElementById('farmerEmail').value;
    const password = document.getElementById('farmerPassword').value;
    const confirmPassword = document.getElementById('farmerConfirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const users = await getUsers();
        if (users.find(u => u.email === email)) {
            alert('This email is already registered. Please login.');
            return;
        }
        
        const newUser = {
            id: generateId(),
            email,
            password, // In a real app, this should be hashed server-side
            userType: 'farmer',
            firstName: document.getElementById('farmerFirstName').value,
            lastName: document.getElementById('farmerLastName').value,
            phone: document.getElementById('farmerPhone').value,
            dateOfBirth: document.getElementById('farmerDOB').value,
            gender: document.getElementById('farmerGender').value,
            yearsOfPractice: document.getElementById('farmerExperience').value,
            state: document.getElementById('farmerState').value,
            registeredAt: new Date().toISOString()
        };
        await saveUser(newUser);
        alert('Registration successful! Please login.');
        showLogin();
        document.getElementById('farmerRegisterForm').reset();
    } catch (error) {
        alert('Error during registration: ' + error.message);
    }
}

async function registerBuyer(event) {
    event.preventDefault();
    const email = document.getElementById('buyerEmail').value;
    const password = document.getElementById('buyerPassword').value;
    const confirmPassword = document.getElementById('buyerConfirmPassword').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const users = await getUsers();
        if (users.find(u => u.email === email)) {
            alert('This email is already registered. Please login.');
            return;
        }
        
        const newUser = {
            id: generateId(),
            email,
            password,
            userType: 'buyer',
            firstName: document.getElementById('buyerFirstName').value,
            lastName: document.getElementById('buyerLastName').value,
            phone: document.getElementById('buyerPhone').value,
            dateOfBirth: document.getElementById('buyerDOB').value,
            gender: document.getElementById('buyerGender').value,
            state: document.getElementById('buyerState').value,
            businessName: document.getElementById('buyerBusinessName').value || '',
            registeredAt: new Date().toISOString()
        };
        await saveUser(newUser);
        alert('Registration successful! Please login.');
        showLogin();
        document.getElementById('buyerRegisterForm').reset();
    } catch (error) {
        alert('Error during registration: ' + error.message);
    }
}

async function login(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const users = await getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (!user) {
            alert('Invalid email or password!');
            return;
        }
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        redirectToDashboard();
    } catch (error) {
        alert('Error during login: ' + error.message);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.href = '/'; // Redirect to root
}

// **THIS FUNCTION IS NOW CORRECTED**
function redirectToDashboard() {
    if (!currentUser) return;
    if (currentUser.userType === 'farmer') {
        // Redirects to the clean URL: /farmer
        window.location.href = '/farmer';
    } else if (currentUser.userType === 'buyer') {
        // Redirects to the clean URL: /buyer
        window.location.href = '/buyer';
    }
}


// =================================================================
// UTILITY/HELPER FUNCTIONS (SHARED)
// =================================================================

function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getUserInitials(firstName, lastName) {
    if (!firstName || !lastName) return '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toFixed(2);
}