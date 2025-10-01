// ==========================================
// VARIABLES GLOBALES
// ==========================================

let employeeToken = localStorage.getItem('employeeToken');
let currentEmployee = null;
let currentOrder = {
    items: [],
    table_number: null,
    customer_name: '',
    total: 0
};
let menuItems = [];
let allOrders = [];

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    if (employeeToken) {
        showEmployeePanel();
    } else {
        showLoginScreen();
    }
    
    setupEventListeners();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
}

function setupEventListeners() {
    // Login
    const loginForm = document.getElementById('employeeLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Navegación
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            showSection(section);
        });
    });
    
    // Fichaje
    setupClockEventListeners();
    
    // Pedidos
    setupOrderEventListeners();
    
    // Cocina
    setupKitchenEventListeners();
    
    // Historial
    setupHistoryEventListeners();
}

// ==========================================
// AUTENTICACIÓN
// ==========================================

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        employee_code: formData.get('employee_code'),
        password: formData.get('password')
    };
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/employees/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            employeeToken = result.data.token;
            currentEmployee = result.data.employee;
            localStorage.setItem('employeeToken', employeeToken);
            
            showNotification('¡Bienvenido! Inicio de sesión exitoso', 'success');
            setTimeout(() => {
                showEmployeePanel();
            }, 1000);
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showNotification('Error: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function handleLogout() {
    employeeToken = null;
    currentEmployee = null;
    localStorage.removeItem('employeeToken');
    
    showNotification('Sesión cerrada exitosamente', 'info');
    setTimeout(() => {
        showLoginScreen();
    }, 1000);
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('employeePanel').style.display = 'none';
}

function showEmployeePanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('employeePanel').style.display = 'flex';
    
    if (currentEmployee) {
        document.getElementById('employeeName').textContent = currentEmployee.name;
        document.getElementById('employeeRole').textContent = currentEmployee.role;
    }
    
    // Cargar datos iniciales
    loadEmployeeStatus();
    loadMenuItems();
    loadEmployeeStats();
}

// ==========================================
// NAVEGACIÓN
// ==========================================

function showSection(sectionName) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Remover clase active de todos los botones de navegación
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar sección seleccionada
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Marcar botón activo
    const activeBtn = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Cargar datos específicos de la sección
    if (sectionName === 'kitchen') {
        loadKitchenOrders();
    } else if (sectionName === 'history') {
        loadTimeEntries();
    }
}

// ==========================================
// SISTEMA DE FICHAJE
// ==========================================

function setupClockEventListeners() {
    const clockInBtn = document.getElementById('clockInBtn');
    const clockOutBtn = document.getElementById('clockOutBtn');
    const breakStartBtn = document.getElementById('breakStartBtn');
    const breakEndBtn = document.getElementById('breakEndBtn');
    
    if (clockInBtn) clockInBtn.addEventListener('click', () => clockAction('clock_in'));
    if (clockOutBtn) clockOutBtn.addEventListener('click', () => clockAction('clock_out'));
    if (breakStartBtn) breakStartBtn.addEventListener('click', () => clockAction('break_start'));
    if (breakEndBtn) breakEndBtn.addEventListener('click', () => clockAction('break_end'));
}

async function clockAction(entryType) {
    const notes = document.getElementById('clockNotes').value;
    
    try {
        const response = await fetch('/api/employees/clock', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${employeeToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                entry_type: entryType,
                notes: notes
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(result.message, 'success');
            document.getElementById('clockNotes').value = '';
            loadEmployeeStatus();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error en fichaje:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

async function loadEmployeeStatus() {
    try {
        const response = await fetch('/api/employees/status', {
            headers: {
                'Authorization': `Bearer ${employeeToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateStatusDisplay(result.data);
            updateClockButtons(result.data);
        }
        
    } catch (error) {
        console.error('Error cargando estado del empleado:', error);
    }
}

function updateStatusDisplay(statusData) {
    const statusTitle = document.getElementById('statusTitle');
    const statusMessage = document.getElementById('statusMessage');
    const statusTime = document.getElementById('statusTime');
    
    if (statusData.isWorking && !statusData.onBreak) {
        statusTitle.textContent = '🟢 Trabajando';
        statusMessage.textContent = 'Estás fichado y trabajando';
    } else if (statusData.onBreak) {
        statusTitle.textContent = '🟡 En Descanso';
        statusMessage.textContent = 'Estás en descanso';
    } else {
        statusTitle.textContent = '🔴 Fuera de Servicio';
        statusMessage.textContent = 'No has fichado entrada';
    }
    
    if (statusData.lastEntry) {
        const entryTime = new Date(statusData.lastEntry.timestamp);
        statusTime.textContent = `Último registro: ${entryTime.toLocaleString('es-ES')}`;
    }
}

function updateClockButtons(statusData) {
    const clockInBtn = document.getElementById('clockInBtn');
    const clockOutBtn = document.getElementById('clockOutBtn');
    const breakStartBtn = document.getElementById('breakStartBtn');
    const breakEndBtn = document.getElementById('breakEndBtn');
    
    // Resetear todos los botones
    [clockInBtn, clockOutBtn, breakStartBtn, breakEndBtn].forEach(btn => {
        if (btn) btn.disabled = false;
    });
    
    if (statusData.isWorking && !statusData.onBreak) {
        // Trabajando normalmente
        if (clockInBtn) clockInBtn.disabled = true;
        if (breakEndBtn) breakEndBtn.disabled = true;
    } else if (statusData.onBreak) {
        // En descanso
        if (clockInBtn) clockInBtn.disabled = true;
        if (clockOutBtn) clockOutBtn.disabled = true;
        if (breakStartBtn) breakStartBtn.disabled = true;
    } else {
        // No trabajando
        if (clockOutBtn) clockOutBtn.disabled = true;
        if (breakStartBtn) breakStartBtn.disabled = true;
        if (breakEndBtn) breakEndBtn.disabled = true;
    }
}

// ==========================================
// SISTEMA DE PEDIDOS
// ==========================================

function setupOrderEventListeners() {
    const newOrderBtn = document.getElementById('newOrderBtn');
    const cancelOrderBtn = document.getElementById('cancelOrderBtn');
    const submitOrderBtn = document.getElementById('submitOrderBtn');
    
    if (newOrderBtn) newOrderBtn.addEventListener('click', startNewOrder);
    if (cancelOrderBtn) cancelOrderBtn.addEventListener('click', cancelOrder);
    if (submitOrderBtn) submitOrderBtn.addEventListener('click', submitOrder);
    
    // Categorías del menú
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            filterMenuByCategory(category);
            
            // Actualizar botón activo
            categoryBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
}

function startNewOrder() {
    document.getElementById('orderForm').style.display = 'block';
    document.getElementById('newOrderBtn').style.display = 'none';
    
    currentOrder = {
        items: [],
        table_number: null,
        customer_name: '',
        total: 0
    };
    
    updateOrderSummary();
}

function cancelOrder() {
    document.getElementById('orderForm').style.display = 'none';
    document.getElementById('newOrderBtn').style.display = 'block';
    
    currentOrder = {
        items: [],
        table_number: null,
        customer_name: '',
        total: 0
    };
    
    // Limpiar formulario
    document.getElementById('tableNumber').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('orderNotes').value = '';
    updateOrderSummary();
}

async function submitOrder() {
    const tableNumber = document.getElementById('tableNumber').value;
    const customerName = document.getElementById('customerName').value;
    const orderNotes = document.getElementById('orderNotes').value;
    
    if (!tableNumber || currentOrder.items.length === 0) {
        showNotification('Debes seleccionar una mesa e items del menú', 'error');
        return;
    }
    
    const orderData = {
        table_number: parseInt(tableNumber),
        customer_name: customerName,
        items: currentOrder.items.map(item => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            notes: item.notes || ''
        })),
        notes: orderNotes
    };
    
    const submitBtn = document.getElementById('submitOrderBtn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${employeeToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`¡Pedido ${result.data.order_number} creado exitosamente!`, 'success');
            cancelOrder();
            loadEmployeeStats();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error creando pedido:', error);
        showNotification('Error: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function loadMenuItems() {
    try {
        const response = await fetch('/api/menu');
        const result = await response.json();
        
        if (result.success) {
            menuItems = result.data;
            displayMenuItems(menuItems);
        }
        
    } catch (error) {
        console.error('Error cargando menú:', error);
    }
}

function displayMenuItems(items) {
    const container = document.getElementById('menuItems');
    if (!container) return;
    
    container.innerHTML = '';
    
    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card';
        itemCard.innerHTML = `
            <div class="menu-item-name">${item.name}</div>
            <div class="menu-item-description">${item.description || ''}</div>
            <div class="menu-item-price">€${item.price.toFixed(2)}</div>
            <div class="quantity-controls" style="display: none;">
                <button class="quantity-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                <span class="quantity-display">0</span>
                <button class="quantity-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
            </div>
        `;
        
        itemCard.addEventListener('click', () => selectMenuItem(item));
        container.appendChild(itemCard);
    });
}

function selectMenuItem(item) {
    const existingItem = currentOrder.items.find(i => i.id === item.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentOrder.items.push({
            ...item,
            quantity: 1
        });
    }
    
    updateOrderSummary();
    updateMenuItemDisplay(item.id);
}

function changeQuantity(itemId, change) {
    const item = currentOrder.items.find(i => i.id === itemId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            currentOrder.items = currentOrder.items.filter(i => i.id !== itemId);
        }
        
        updateOrderSummary();
        updateMenuItemDisplay(itemId);
    }
}

function updateMenuItemDisplay(itemId) {
    const cards = document.querySelectorAll('.menu-item-card');
    cards.forEach(card => {
        const itemData = menuItems.find(item => item.id === itemId);
        if (!itemData) return;
        
        const orderItem = currentOrder.items.find(i => i.id === itemId);
        const controls = card.querySelector('.quantity-controls');
        const quantityDisplay = card.querySelector('.quantity-display');
        
        if (orderItem && orderItem.quantity > 0) {
            card.classList.add('selected');
            controls.style.display = 'flex';
            quantityDisplay.textContent = orderItem.quantity;
        } else {
            card.classList.remove('selected');
            controls.style.display = 'none';
        }
    });
}

function updateOrderSummary() {
    const orderItemsContainer = document.getElementById('orderItems');
    const orderTotalElement = document.getElementById('orderTotal');
    
    if (currentOrder.items.length === 0) {
        orderItemsContainer.innerHTML = '<p class="no-items">No hay items seleccionados</p>';
        orderTotalElement.textContent = '0.00';
        return;
    }
    
    let total = 0;
    let html = '';
    
    currentOrder.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        html += `
            <div class="order-item">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-details">${item.quantity}x €${item.price.toFixed(2)}</div>
                </div>
                <div class="item-price">€${itemTotal.toFixed(2)}</div>
                <button class="remove-item" onclick="removeOrderItem(${item.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    });
    
    orderItemsContainer.innerHTML = html;
    orderTotalElement.textContent = total.toFixed(2);
    currentOrder.total = total;
}

function removeOrderItem(itemId) {
    currentOrder.items = currentOrder.items.filter(i => i.id !== itemId);
    updateOrderSummary();
    updateMenuItemDisplay(itemId);
}

function filterMenuByCategory(category) {
    const filteredItems = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === category);
    
    displayMenuItems(filteredItems);
}

// ==========================================
// COCINA/BAR
// ==========================================

function setupKitchenEventListeners() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const status = e.target.dataset.status;
            filterKitchenOrders(status);
            
            // Actualizar botón activo
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
    
    // Auto-refresh cada 30 segundos
    setInterval(() => {
        if (document.getElementById('kitchenSection').classList.contains('active')) {
            loadKitchenOrders();
        }
    }, 30000);
}

async function loadKitchenOrders() {
    try {
        const response = await fetch('/api/orders', {
            headers: {
                'Authorization': `Bearer ${employeeToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            allOrders = result.data;
            displayKitchenOrders(allOrders);
        }
        
    } catch (error) {
        console.error('Error cargando pedidos de cocina:', error);
    }
}

function displayKitchenOrders(orders) {
    const container = document.getElementById('kitchenOrders');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="no-items">No hay pedidos para mostrar</p>';
        return;
    }
    
    orders.forEach(order => {
        const orderTicket = createOrderTicket(order);
        container.appendChild(orderTicket);
    });
}

function createOrderTicket(order) {
    const ticket = document.createElement('div');
    ticket.className = `order-ticket ${order.status}`;
    
    const createdAt = new Date(order.created_at);
    const timeAgo = getTimeAgo(createdAt);
    
    ticket.innerHTML = `
        <div class="ticket-header">
            <div class="order-number">#${order.order_number}</div>
            <div class="order-time">${timeAgo}</div>
        </div>
        
        <div class="table-info">
            Mesa ${order.table_number}
            ${order.customer_name ? ` - ${order.customer_name}` : ''}
        </div>
        
        <div class="order-items-list">
            ${order.items.map(item => `
                <div class="ticket-item">
                    <span class="item-quantity">${item.quantity}</span>
                    <span class="item-name">${item.item_name}</span>
                </div>
            `).join('')}
        </div>
        
        ${order.notes ? `<div class="order-notes"><strong>Notas:</strong> ${order.notes}</div>` : ''}
        
        <div class="ticket-actions">
            ${getOrderStatusButtons(order)}
        </div>
        
        <div class="order-employee">
            <small>Por: ${order.employee_name} (${order.employee_role})</small>
        </div>
    `;
    
    return ticket;
}

function getOrderStatusButtons(order) {
    const buttons = [];
    
    if (order.status === 'pending') {
        buttons.push(`<button class="status-btn preparing" onclick="updateOrderStatus('${order.id}', 'preparing')">Preparar</button>`);
    }
    
    if (order.status === 'preparing') {
        buttons.push(`<button class="status-btn ready" onclick="updateOrderStatus('${order.id}', 'ready')">Listo</button>`);
    }
    
    if (order.status === 'ready') {
        buttons.push(`<button class="status-btn served" onclick="updateOrderStatus('${order.id}', 'served')">Servido</button>`);
    }
    
    return buttons.join('');
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${employeeToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Pedido actualizado a: ${newStatus}`, 'success');
            loadKitchenOrders();
        } else {
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('Error actualizando estado del pedido:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

function filterKitchenOrders(status) {
    const filteredOrders = status === 'all' 
        ? allOrders 
        : allOrders.filter(order => order.status === status);
    
    displayKitchenOrders(filteredOrders);
}

// ==========================================
// HISTORIAL
// ==========================================

function setupHistoryEventListeners() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            showHistoryTab(tab);
        });
    });
}

function showHistoryTab(tabName) {
    // Ocultar todos los tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remover clase active de todos los botones
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar tab seleccionado
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Marcar botón activo
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Cargar datos del tab
    if (tabName === 'time-entries') {
        loadTimeEntries();
    } else if (tabName === 'my-orders') {
        loadMyOrders();
    }
}

async function loadTimeEntries() {
    try {
        const response = await fetch('/api/employees/time-entries', {
            headers: {
                'Authorization': `Bearer ${employeeToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayTimeEntries(result.data);
        }
        
    } catch (error) {
        console.error('Error cargando historial de fichajes:', error);
    }
}

function displayTimeEntries(entries) {
    const container = document.getElementById('timeEntriesList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (entries.length === 0) {
        container.innerHTML = '<p class="no-items">No hay fichajes registrados</p>';
        return;
    }
    
    entries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'time-entry-item';
        
        const entryTime = new Date(entry.timestamp);
        const entryTypeMap = {
            'clock_in': '🟢 Entrada',
            'clock_out': '🔴 Salida',
            'break_start': '☕ Inicio Descanso',
            'break_end': '💼 Fin Descanso'
        };
        
        entryElement.innerHTML = `
            <div class="entry-info">
                <div class="entry-type">${entryTypeMap[entry.entry_type] || entry.entry_type}</div>
                <div class="entry-time">${entryTime.toLocaleString('es-ES')}</div>
                ${entry.notes ? `<div class="entry-notes">${entry.notes}</div>` : ''}
            </div>
        `;
        
        container.appendChild(entryElement);
    });
}

async function loadMyOrders() {
    try {
        const response = await fetch('/api/orders?employee_only=true', {
            headers: {
                'Authorization': `Bearer ${employeeToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const myOrders = result.data.filter(order => order.employee_name === currentEmployee.name);
            displayMyOrders(myOrders);
        }
        
    } catch (error) {
        console.error('Error cargando mis pedidos:', error);
    }
}

function displayMyOrders(orders) {
    const container = document.getElementById('myOrdersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="no-items">No has creado pedidos aún</p>';
        return;
    }
    
    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order-history-item';
        
        const createdAt = new Date(order.created_at);
        
        orderElement.innerHTML = `
            <div class="order-info">
                <div class="order-number">#${order.order_number} - Mesa ${order.table_number}</div>
                <div class="order-details">${order.items.length} items - €${order.total_amount}</div>
                <div class="order-date">${createdAt.toLocaleString('es-ES')}</div>
            </div>
            <div class="order-status ${order.status}">${getStatusLabel(order.status)}</div>
        `;
        
        container.appendChild(orderElement);
    });
}

// ==========================================
// ESTADÍSTICAS DEL EMPLEADO
// ==========================================

async function loadEmployeeStats() {
    try {
        const response = await fetch('/api/orders/employee/stats', {
            headers: {
                'Authorization': `Bearer ${employeeToken}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateEmployeeStats(result.data);
        }
        
    } catch (error) {
        console.error('Error cargando estadísticas del empleado:', error);
    }
}

function updateEmployeeStats(stats) {
    const todayOrdersElement = document.getElementById('todayOrders');
    const totalSalesElement = document.getElementById('totalSales');
    
    if (todayOrdersElement) {
        todayOrdersElement.textContent = stats.today_orders || 0;
    }
    
    if (totalSalesElement) {
        totalSalesElement.textContent = `€${(stats.total_sales || 0).toFixed(2)}`;
    }
}

// ==========================================
// UTILIDADES
// ==========================================

function updateCurrentTime() {
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString('es-ES');
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
    
    return date.toLocaleDateString('es-ES');
}

function getStatusLabel(status) {
    const statusMap = {
        'pending': '⏳ Pendiente',
        'preparing': '👨‍🍳 Preparando',
        'ready': '✅ Listo',
        'served': '🍽️ Servido',
        'cancelled': '❌ Cancelado'
    };
    
    return statusMap[status] || status;
}

function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="${icons[type] || icons.info}"></i>
        <span>${message}</span>
    `;
    
    notifications.appendChild(notification);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Hacer funciones globales disponibles
window.changeQuantity = changeQuantity;
window.removeOrderItem = removeOrderItem;
window.updateOrderStatus = updateOrderStatus;