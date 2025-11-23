document.addEventListener('DOMContentLoaded', async function() {
    // Authentication and user setup (currentUser is from script.js)
    if (!currentUser) {
        window.location.href = '/';
        return;
    }
    if (currentUser.userType !== 'farmer') {
        alert('Access denied. This page is for farmers only.');
        window.location.href = '/';
        return;
    }

    // Populate user-specific elements
    document.getElementById('userInitials').textContent = getUserInitials(currentUser.firstName, currentUser.lastName);
    document.getElementById('profileName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;

    // Initial data loading
    await loadCropsDatalist();
    await loadInventory();
    await loadOrders();

    // Attach event listeners
    document.getElementById('addCropBtn')?.addEventListener('click', showAddCropModal);
    document.getElementById('addCropForm')?.addEventListener('submit', addCrop);
    document.getElementById('closeAddCropModalBtn')?.addEventListener('click', closeAddCropModal);
    document.getElementById('cancelAddCropBtn')?.addEventListener('click', closeAddCropModal);
    
    document.getElementById('editCropForm')?.addEventListener('submit', updateCrop);
    document.getElementById('closeEditCropModalBtn')?.addEventListener('click', closeEditCropModal);
    document.getElementById('cancelEditCropBtn')?.addEventListener('click', closeEditCropModal);
});

async function loadCropsDatalist() {
    try {
        const response = await fetch('/api/crops');
        if (!response.ok) throw new Error('Failed to fetch crop list');
        const data = await response.json();

        const allCropsList = [...data.crops, ...data.dairy_products, ...data.other];
        const datalist = document.getElementById('cropsList');
        if (!datalist) return;
        datalist.innerHTML = ''; // Clear existing options

        allCropsList.forEach(crop => {
            const option = document.createElement('option');
            option.value = crop;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading crops datalist:', error);
    }
}

async function validateCropName(cropName) {
    try {
        const response = await fetch('/api/crops');
        const data = await response.json();
        const allCropsList = [...data.crops, ...data.dairy_products, ...data.other];
        return allCropsList.some(crop => crop.toLowerCase() === cropName.toLowerCase());
    } catch (error) {
        console.error('Error validating crop:', error);
        return false; // Fail safely
    }
}

function showAddCropModal() {
    const modal = document.getElementById('addCropModal');
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeAddCropModal() {
    const modal = document.getElementById('addCropModal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
    document.getElementById('addCropForm').reset();
}

async function addCrop(event) {
    event.preventDefault();
    const form = event.target;

    // Validate form
    if (!validateForm(form)) {
        toast.error('Please fill in all required fields correctly');
        return;
    }

    const cropName = document.getElementById('cropName').value.trim();
    if (!await validateCropName(cropName)) {
        toast.error('Invalid crop name! Please select a valid crop from the list.');
        return;
    }

    const inventoryItem = {
        id: generateId(),
        farmerId: currentUser.id,
        farmerName: `${currentUser.firstName} ${currentUser.lastName}`,
        farmerPhone: currentUser.phone,
        farmerEmail: currentUser.email,
        state: currentUser.state,
        cropName,
        totalQuantity: parseFloat(document.getElementById('totalQuantity').value),
        pricePerKg: parseFloat(document.getElementById('pricePerKg').value),
        quality: document.getElementById('quality').value,
        addedAt: new Date().toISOString()
    };

    try {
        const response = await fetch('/api/inventory', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(inventoryItem)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add crop to inventory');
        }
        
        toast.success(`${cropName} added to inventory successfully!`);
        closeAddCropModal();
        await loadInventory();
    } catch (error) {
        toast.error(error.message);
    }
}

async function loadInventory() {
    try {
        const [inventory, orders] = await Promise.all([getInventory(), getOrders()]);
        const farmerInventory = inventory.filter(item => item.farmerId === currentUser.id);
        const inventoryGrid = document.getElementById('inventoryGrid');
        
        if (farmerInventory.length === 0) {
            inventoryGrid.innerHTML = '<div class="empty-state"><p>No crops in inventory. Click "+ Add Crop" to get started!</p></div>';
            return;
        }

        inventoryGrid.innerHTML = '';
        farmerInventory.sort((a,b) => new Date(b.addedAt) - new Date(a.addedAt)).forEach(item => {
            const orderedQuantity = orders
                .filter(o => o.inventoryId === item.id && o.status === 'active')
                .reduce((sum, o) => sum + o.quantity, 0);
            const currentQuantity = item.totalQuantity - orderedQuantity;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.innerHTML = `
                <h3>${item.cropName}</h3>
                <div class="inventory-details">
                    <p><strong>Total Quantity:</strong> ${item.totalQuantity} kg</p>
                    <p><strong>Currently Available:</strong> ${currentQuantity.toFixed(2)} kg</p>
                    <p><strong>Price per kg:</strong> ${formatCurrency(item.pricePerKg)}</p>
                    <p><strong>Quality:</strong> <span class="quality-badge quality-${item.quality}">${item.quality.toUpperCase()}</span></p>
                </div>
                <div class="inventory-actions">
                    <button class="btn btn-primary" onclick="showEditCropModal('${item.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="deleteCrop('${item.id}')">Delete</button>
                </div>
            `;
            inventoryGrid.appendChild(itemDiv);
        });
    } catch (error) {
        console.error('Failed to load inventory:', error);
    }
}

async function showEditCropModal(cropId) {
    try {
        const inventory = await getInventory();
        const item = inventory.find(i => i.id === cropId);
        if (!item) return;

        document.getElementById('editCropId').value = item.id;
        document.getElementById('editCropName').value = item.cropName;
        document.getElementById('editTotalQuantity').value = item.totalQuantity;
        document.getElementById('editPricePerKg').value = item.pricePerKg;
        document.getElementById('editQuality').value = item.quality;

        const modal = document.getElementById('editCropModal');
        modal.classList.remove('hidden');
        modal.classList.add('active');

    } catch (error) {
        console.error('Failed to show edit modal:', error);
    }
}

function closeEditCropModal() {
    const modal = document.getElementById('editCropModal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
    document.getElementById('editCropForm').reset();
}

async function updateCrop(event) {
    event.preventDefault();
    const form = event.target;

    // Validate form
    if (!validateForm(form)) {
        toast.error('Please fill in all required fields correctly');
        return;
    }

    const cropId = document.getElementById('editCropId').value;
    
    try {
        const inventory = await getInventory();
        const originalItem = inventory.find(i => i.id === cropId);
        if (!originalItem) throw new Error('Item not found');

        const updatedItem = {
            ...originalItem,
            totalQuantity: parseFloat(document.getElementById('editTotalQuantity').value),
            pricePerKg: parseFloat(document.getElementById('editPricePerKg').value),
            quality: document.getElementById('editQuality').value,
        };

        const response = await fetch(`/api/inventory/${cropId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(updatedItem)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update crop');
        }

        toast.success('Crop updated successfully!');
        closeEditCropModal();
        await loadInventory();
    } catch (error) {
        toast.error(error.message);
    }
}

async function deleteCrop(cropId) {
    if (!confirm('Are you sure you want to delete this crop? This action cannot be undone.')) return;

    try {
        const orders = await getOrders();
        if (orders.some(order => order.inventoryId === cropId && order.status === 'active')) {
            toast.warning('Cannot delete this crop as there are active orders for it.');
            return;
        }

        const response = await fetch(`/api/inventory/${cropId}`, { method: 'DELETE' });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete crop');
        }

        toast.success('Crop deleted successfully!');
        await loadInventory();
    } catch (error) {
        toast.error(error.message);
    }
}

// **THIS FUNCTION IS NOW CORRECTED**
async function loadOrders() {
    try {
        // **FIX:** Changed getInventory() to getOrders()
        const [orders, users] = await Promise.all([getOrders(), getUsers()]);
        const farmerOrders = orders.filter(order => order.farmerId === currentUser.id && order.status === 'active');
        const ordersContainer = document.getElementById('ordersContainer');
        
        if (farmerOrders.length === 0) {
            ordersContainer.innerHTML = '<div class="empty-state"><p>No ongoing orders at the moment.</p></div>';
            return;
        }

        ordersContainer.innerHTML = '';
        farmerOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).forEach(order => {
            const buyer = users.find(u => u.id === order.buyerId);
            const orderDiv = document.createElement('div');
            orderDiv.className = 'order-card';
            orderDiv.innerHTML = `
                <h3>${order.cropName}</h3>
                <div class="order-details">
                    <p><strong>Quantity:</strong> ${order.quantity} kg</p>
                    <p><strong>Total Price:</strong> ${formatCurrency(order.totalPrice)}</p>
                    <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                </div>
                <div class="contact-info">
                    <h4>Buyer Information</h4>
                    <p><strong>Name:</strong> ${buyer ? `${buyer.firstName} ${buyer.lastName}` : 'N/A'}</p>
                    <p><strong>Phone:</strong> ${buyer ? buyer.phone : 'N/A'}</p>
                    <p><strong>Email:</strong> ${buyer ? buyer.email : 'N/A'}</p>
                </div>
                <div class="order-actions">
                    <button class="btn btn-danger" onclick="cancelOrder('${order.id}')">Cancel Order</button>
                </div>
            `;
            ordersContainer.appendChild(orderDiv);
        });
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
        const orders = await getOrders();
        const orderToCancel = orders.find(o => o.id === orderId);
        if (!orderToCancel) throw new Error('Order not found');

        orderToCancel.status = 'cancelled';

        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(orderToCancel)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to cancel order');
        }

        toast.success('Order cancelled successfully!');
        await loadOrders();
        await loadInventory();
    } catch (error) {
        toast.error(error.message);
    }
}