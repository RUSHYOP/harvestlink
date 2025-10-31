document.addEventListener('DOMContentLoaded', async function() {
    // Authentication and user setup (currentUser is from script.js)
    if (!currentUser) {
        // Corrected path to root
        window.location.href = '/';
        return;
    }
    if (currentUser.userType !== 'buyer') {
        alert('Access denied. This page is for buyers only.');
        // Corrected path to root
        window.location.href = '/';
        return;
    }

    // Populate user-specific elements
    document.getElementById('userInitials').textContent = getUserInitials(currentUser.firstName, currentUser.lastName);
    document.getElementById('profileName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;

    // Initial data loading
    await populateStateFilter();
    await loadStock();
    await loadBuyerOrders();

    // Attach event listeners
    document.getElementById('searchCrop')?.addEventListener('keyup', filterStock);
    document.getElementById('filterState')?.addEventListener('change', filterStock);
    document.getElementById('filterQuality')?.addEventListener('change', filterStock);
    document.getElementById('buyQuantity')?.addEventListener('input', calculateTotal);
    document.getElementById('buyForm')?.addEventListener('submit', placeOrder);
    
    // Event listeners for closing the modal
    document.querySelector('#buyModal .close')?.addEventListener('click', closeBuyModal);
    document.querySelector('#buyModal .btn-secondary')?.addEventListener('click', closeBuyModal);
});


async function populateStateFilter() {
    const states = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"];
    const filterState = document.getElementById('filterState');
    if (!filterState) return;
    
    filterState.innerHTML = '<option value="">All States</option>';
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        filterState.appendChild(option);
    });
}

async function loadStock() {
    try {
        const inventory = await getInventory();
        const orders = await getOrders();
        const stockGrid = document.getElementById('stockGrid');
        if (!stockGrid) return;

        const availableInventory = inventory.filter(item => {
            const itemOrders = orders.filter(o => o.inventoryId === item.id && o.status === 'active');
            const orderedQuantity = itemOrders.reduce((sum, o) => sum + o.quantity, 0);
            return (item.totalQuantity - orderedQuantity) > 0;
        });

        if (availableInventory.length === 0) {
            stockGrid.innerHTML = `<div class="empty-state"><p>No crops available at the moment. Check back later!</p></div>`;
            return;
        }

        stockGrid.innerHTML = '';
        availableInventory.forEach(item => {
            const itemOrders = orders.filter(o => o.inventoryId === item.id && o.status === 'active');
            const orderedQuantity = itemOrders.reduce((sum, o) => sum + o.quantity, 0);
            const currentQuantity = item.totalQuantity - orderedQuantity;

            const stockDiv = document.createElement('div');
            stockDiv.className = 'stock-item';
            stockDiv.dataset.cropName = item.cropName.toLowerCase();
            stockDiv.dataset.state = item.state;
            stockDiv.dataset.quality = item.quality;

            // Pass the whole item as a stringified JSON to avoid another fetch
            const itemData = JSON.stringify(item).replace(/'/g, "&apos;");

            stockDiv.innerHTML = `
                <h3>${item.cropName}</h3>
                <div class="stock-details">
                    <p><strong>Available Quantity:</strong> ${currentQuantity.toFixed(2)} kg</p>
                    <p><strong>Price per kg:</strong> ${formatCurrency(item.pricePerKg)}</p>
                    <p><strong>Quality:</strong> <span class="quality-badge quality-${item.quality}">${item.quality.toUpperCase()}</span></p>
                </div>
                <div class="stock-farmer">
                    <p><strong>Farmer:</strong> ${item.farmerName}</p>
                    <p><strong>Location:</strong> ${item.state}</p>
                    <p><strong>Contact:</strong> ${item.farmerPhone}</p>
                </div>
                <button class="btn btn-success" onclick='showBuyModal(${itemData}, ${currentQuantity})'>Buy Now</button>
            `;
            stockGrid.appendChild(stockDiv);
        });
    } catch (error) {
        console.error('Failed to load stock:', error.message);
        document.getElementById('stockGrid').innerHTML = `<div class="empty-state"><p>Error loading stock. Please try again later.</p></div>`;
    }
}

function filterStock() {
    const searchTerm = document.getElementById('searchCrop').value.toLowerCase();
    const filterState = document.getElementById('filterState').value;
    const filterQuality = document.getElementById('filterQuality').value;
    
    document.querySelectorAll('.stock-item').forEach(item => {
        const matchesSearch = item.dataset.cropName.includes(searchTerm);
        const matchesState = !filterState || item.dataset.state === filterState;
        const matchesQuality = !filterQuality || item.dataset.quality === filterQuality;
        item.style.display = (matchesSearch && matchesState && matchesQuality) ? 'block' : 'none';
    });
}

function showBuyModal(item, maxQuantity) {
    if (!item) return;
    
    document.getElementById('buyInventoryId').value = item.id;
    document.getElementById('buyMaxQuantity').value = maxQuantity;
    document.getElementById('buyPricePerKg').value = item.pricePerKg;
    document.getElementById('buyQuantity').value = '';
    document.getElementById('totalPrice').textContent = '0.00';

    const modalDetails = document.getElementById('buyModalDetails');
    modalDetails.innerHTML = `
        <p><strong>Crop:</strong> ${item.cropName}</p>
        <p><strong>Quality:</strong> ${item.quality.toUpperCase()}</p>
        <p><strong>Farmer:</strong> ${item.farmerName}</p>
        <p><strong>Available:</strong> ${maxQuantity.toFixed(2)} kg</p>
        <p><strong>Price per kg:</strong> ${formatCurrency(item.pricePerKg)}</p>
    `;
    const modal = document.getElementById('buyModal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeBuyModal() {
    const buyModal = document.getElementById('buyModal');
    buyModal.classList.remove('active');
    buyModal.classList.add('hidden');
    document.getElementById('buyForm').reset();
    document.getElementById('totalPrice').textContent = '0.00';
}

function calculateTotal() {
    const quantity = parseFloat(document.getElementById('buyQuantity').value) || 0;
    const pricePerKg = parseFloat(document.getElementById('buyPricePerKg').value);
    const maxQuantity = parseFloat(document.getElementById('buyMaxQuantity').value);

    if (quantity > maxQuantity) {
        alert(`Maximum available quantity is ${maxQuantity} kg`);
        document.getElementById('buyQuantity').value = maxQuantity;
    }
    document.getElementById('totalPrice').textContent = (quantity * pricePerKg).toFixed(2);
}

async function placeOrder(event) {
    event.preventDefault();
    const inventoryId = document.getElementById('buyInventoryId').value;
    const quantity = parseFloat(document.getElementById('buyQuantity').value);
    const maxQuantity = parseFloat(document.getElementById('buyMaxQuantity').value);

    if (quantity <= 0) {
        alert('Please enter a valid quantity.');
        return;
    }
    if (quantity > maxQuantity) {
        alert('Quantity exceeds available stock!');
        return;
    }

    try {
        const inventory = await getInventory(); // Fetch latest inventory to get farmer details
        const item = inventory.find(i => i.id === inventoryId);
        if (!item) {
            alert('This item is no longer available.');
            return;
        }

        const order = {
            id: generateId(),
            buyerId: currentUser.id,
            farmerId: item.farmerId,
            inventoryId: inventoryId,
            cropName: item.cropName,
            quantity: quantity,
            pricePerKg: item.pricePerKg,
            totalPrice: quantity * item.pricePerKg,
            quality: item.quality,
            farmerName: item.farmerName,
            farmerPhone: item.farmerPhone,
            farmerEmail: item.farmerEmail,
            state: item.state,
            status: 'active',
            orderDate: new Date().toISOString()
        };

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(order),
        });
        if (!response.ok) throw new Error('Failed to place order');
        
        alert('Order placed successfully!');
        closeBuyModal();
        await loadStock();
        await loadBuyerOrders();

    } catch (error) {
        alert(error.message);
    }
}

async function loadBuyerOrders() {
    try {
        const allOrders = await getOrders();
        const buyerOrders = allOrders.filter(order => order.buyerId === currentUser.id && order.status === 'active');
        const ordersContainer = document.getElementById('ordersContainer');
        if (!ordersContainer) return;

        if (buyerOrders.length === 0) {
            ordersContainer.innerHTML = '<div class="empty-state"><p>No active orders. Browse available stock and place your first order!</p></div>';
            return;
        }

        ordersContainer.innerHTML = '';
        buyerOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order-card';
            orderDiv.innerHTML = `
                <h3>${order.cropName}</h3>
                <div class="order-details">
                    <p><strong>Quantity:</strong> ${order.quantity} kg</p>
                    <p><strong>Price per kg:</strong> ${formatCurrency(order.pricePerKg)}</p>
                    <p><strong>Total Price:</strong> ${formatCurrency(order.totalPrice)}</p>
                    <p><strong>Quality:</strong> <span class="quality-badge quality-${order.quality}">${order.quality.toUpperCase()}</span></p>
                    <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
                <div class="contact-info">
                    <h4>Farmer Information</h4>
                    <p><strong>Name:</strong> ${order.farmerName}</p>
                    <p><strong>Location:</strong> ${order.state}</p>
                    <p><strong>Phone:</strong> ${order.farmerPhone}</p>
                    <p><strong>Email:</strong> ${order.farmerEmail}</p>
                </div>
            `;
            ordersContainer.appendChild(orderDiv);
        });
    } catch (error) {
        console.error('Failed to load orders:', error.message);
        document.getElementById('ordersContainer').innerHTML = `<div class="empty-state"><p>Error loading your orders.</p></div>`;
    }
}