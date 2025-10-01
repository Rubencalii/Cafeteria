// ==========================================
// VARIABLES GLOBALES
// ==========================================

let employeeToken = localStorage.getItem('employeeToken');
let currentEmployee = null;
let currentOrder = {
    items: [],
    table_number: null,
    customer_name: '',
    employee_name: '',
    total: 0,
    notes: '',
    order_type: 'dine_in' // dine_in, takeaway, delivery
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
    
    // Reservas
    setupReservationsEventListeners();
    
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
    } else if (sectionName === 'bills') {
        loadEmployeeBills();
    } else if (sectionName === 'reservations') {
        loadEmployeeReservations();
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
    
    if (!customerName.trim()) {
        showNotification('Por favor ingresa el nombre del cliente', 'warning');
        return;
    }
    
    // Calcular total del pedido
    const totalAmount = currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
        table_number: parseInt(tableNumber),
        customer_name: customerName.trim(),
        employee_name: currentEmployee?.name || 'Empleado',
        employee_id: currentEmployee?.id,
        total_amount: totalAmount,
        items: currentOrder.items.map(item => ({
            menu_item_id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            notes: item.notes || ''
        })),
        notes: orderNotes,
        order_type: currentOrder.order_type || 'dine_in'
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
            // Guardar pedido en localStorage para que aparezca en tiempo real en el admin
            const order = {
                id: result.data.id,
                order_number: result.data.order_number,
                table_number: result.data.table_number,
                customer_name: result.data.customer_name,
                total_amount: result.data.total_amount,
                status: 'pending',
                created_at: new Date().toISOString(),
                employee_name: currentEmployee.name,
                employee_role: currentEmployee.role,
                items: currentOrder.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    category: item.category
                }))
            };
            
            // Agregar a localStorage para sincronización
            const savedOrders = JSON.parse(localStorage.getItem('kitchenOrders') || '[]');
            savedOrders.unshift(order);
            localStorage.setItem('kitchenOrders', JSON.stringify(savedOrders));
            
            showNotification(`¡Pedido ${result.data.order_number} creado exitosamente!`, 'success');
            console.log('✅ Pedido creado y guardado:', order);
            
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
        // Intentar cargar desde el servidor
        const response = await fetch('/api/menu');
        const result = await response.json();
        
        if (result.success && result.data) {
            menuItems = result.data;
            console.log('✅ Menú cargado desde servidor:', menuItems.length, 'elementos');
        } else {
            // Fallback a menú estático si el servidor falla
            menuItems = getStaticMenu();
            console.log('📋 Usando menú estático:', menuItems.length, 'elementos');
        }
        
        displayMenuItems(menuItems);
        
    } catch (error) {
        console.error('Error cargando menú del servidor, usando datos estáticos:', error);
        // Usar menú estático como fallback
        menuItems = getStaticMenu();
        displayMenuItems(menuItems);
    }
}

function getStaticMenu() {
    return [
        {id: 1, name: "Espresso", price: 2.50, category: "Café Caliente", available: true, description: "Café espresso tradicional italiano"},
        {id: 2, name: "Cappuccino", price: 3.75, category: "Café Caliente", available: true, description: "Espresso con leche vaporizada y espuma cremosa"},
        {id: 3, name: "Latte", price: 4.25, category: "Café Caliente", available: true, description: "Espresso suave con leche vaporizada"},
        {id: 4, name: "Americano", price: 3.00, category: "Café Caliente", available: true, description: "Espresso diluido con agua caliente"},
        {id: 5, name: "Mocha", price: 4.50, category: "Café Caliente", available: true, description: "Espresso con chocolate y leche vaporizada"},
        {id: 6, name: "Frappé Vainilla", price: 5.25, category: "Café Frío", available: true, description: "Café frío batido con helado de vainilla"},
        {id: 7, name: "Cold Brew", price: 4.00, category: "Café Frío", available: true, description: "Café de extracción en frío, suave y refrescante"},
        {id: 8, name: "Iced Latte", price: 4.75, category: "Café Frío", available: true, description: "Latte servido con hielo y leche fría"},
        {id: 9, name: "Tiramisú", price: 6.50, category: "Postres", available: true, description: "Postre italiano con café, mascarpone y cacao"},
        {id: 10, name: "Cheesecake de Frutos Rojos", price: 5.75, category: "Postres", available: true, description: "Tarta de queso cremosa con salsa de frutos rojos"},
        {id: 11, name: "Brownie con Helado", price: 6.25, category: "Postres", available: true, description: "Brownie tibio de chocolate con helado de vainilla"},
        {id: 12, name: "Croissant de Almendras", price: 4.50, category: "Postres", available: true, description: "Croissant relleno de crema de almendras"},
        {id: 13, name: "Tostadas Francesas", price: 7.50, category: "Desayunos", available: true, description: "Pan brioche con canela, miel y frutos rojos"},
        {id: 14, name: "Bowl de Açaí", price: 8.25, category: "Desayunos", available: true, description: "Açaí con granola, frutas frescas y miel"},
        {id: 15, name: "Sandwich de Pollo", price: 9.50, category: "Desayunos", available: true, description: "Pan ciabatta con pollo, aguacate y vegetales"},
        {id: 16, name: "Pancakes de Arándanos", price: 8.75, category: "Desayunos", available: true, description: "Pancakes esponjosos con arándanos frescos"}
    ];
}

function displayMenuItems(items) {
    const container = document.getElementById('menuItems');
    if (!container) {
        console.error('Contenedor menuItems no encontrado');
        return;
    }
    
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<p class="no-items">No hay elementos en el menú disponibles</p>';
        return;
    }
    
    items.forEach(item => {
        if (!item.available) return; // Solo mostrar items disponibles
        
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card';
        itemCard.setAttribute('data-item-id', item.id);
        itemCard.innerHTML = `
            <div class="menu-item-content">
                <div class="menu-item-name">${item.name}</div>
                <div class="menu-item-description">${item.description || ''}</div>
                <div class="menu-item-category">${item.category}</div>
                <div class="menu-item-price">€${item.price.toFixed(2)}</div>
            </div>
            <div class="quantity-controls" style="display: none;">
                <button class="quantity-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                <span class="quantity-display">0</span>
                <button class="quantity-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
            </div>
        `;
        
        itemCard.addEventListener('click', () => selectMenuItem(item));
        container.appendChild(itemCard);
    });
    
    console.log(`📋 Mostrados ${items.filter(i => i.available).length} elementos del menú`);
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
// GESTIÓN DE CUENTAS/MESAS
// ==========================================

let currentEmployeeBill = null;

async function loadEmployeeBills() {
    try {
        // Cargar pedidos activos (no pagados) desde localStorage
        const allOrders = JSON.parse(localStorage.getItem('kitchenOrders') || '[]');
        const activeOrders = allOrders.filter(order => 
            !['paid', 'cancelled'].includes(order.status)
        );
        
        // Agrupar por mesa
        const tableOrders = {};
        activeOrders.forEach(order => {
            const tableNum = order.table_number || 'N/A';
            if (!tableOrders[tableNum]) {
                tableOrders[tableNum] = {
                    orders: [],
                    totalAmount: 0,
                    totalItems: 0,
                    lastActivity: null,
                    isReady: false
                };
            }
            tableOrders[tableNum].orders.push(order);
            tableOrders[tableNum].totalAmount += order.total_amount || 0;
            tableOrders[tableNum].totalItems += order.items?.length || 0;
            
            // Actualizar última actividad
            const orderTime = new Date(order.created_at);
            if (!tableOrders[tableNum].lastActivity || orderTime > tableOrders[tableNum].lastActivity) {
                tableOrders[tableNum].lastActivity = orderTime;
            }
            
            // Verificar si está listo para cobrar
            if (order.status === 'served' || order.status === 'ready') {
                tableOrders[tableNum].isReady = true;
            }
        });
        
        // Actualizar estadísticas
        updateBillsStats(tableOrders);
        
        // Mostrar mesas
        displayEmployeeTablesGrid(tableOrders);
        
        console.log(`✅ Cargadas ${Object.keys(tableOrders).length} mesas activas para empleado`);
        
    } catch (error) {
        console.error('❌ Error cargando cuentas:', error);
        showNotification('Error cargando cuentas: ' + error.message, 'error');
    }
}

function updateBillsStats(tableOrders) {
    const activeTables = Object.keys(tableOrders).length;
    const totalPending = Object.values(tableOrders).reduce((sum, table) => sum + table.totalAmount, 0);
    const tablesReady = Object.values(tableOrders).filter(table => table.isReady).length;
    
    // Actualizar elementos del DOM
    const activeTablesElement = document.getElementById('activeTables');
    const totalPendingElement = document.getElementById('totalPending');
    const tablesReadyElement = document.getElementById('tablesReady');
    
    if (activeTablesElement) activeTablesElement.textContent = activeTables;
    if (totalPendingElement) totalPendingElement.textContent = `€${totalPending.toFixed(2)}`;
    if (tablesReadyElement) tablesReadyElement.textContent = tablesReady;
}

function displayEmployeeTablesGrid(tableOrders) {
    const grid = document.getElementById('employeeTablesGrid');
    
    if (!grid) return;
    
    if (Object.keys(tableOrders).length === 0) {
        grid.innerHTML = `
            <div class="no-tables">
                <i class="fas fa-table"></i>
                <p>No hay mesas activas</p>
                <small>Las mesas aparecerán aquí cuando tengan pedidos pendientes</small>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = Object.entries(tableOrders).map(([tableNum, data]) => {
        const statusClass = data.isReady ? 'ready' : 'active';
        const statusIcon = data.isReady ? '✅' : '🕐';
        const statusText = data.isReady ? 'Lista para cobrar' : 'En proceso';
        
        return `
            <div class="employee-table-card ${statusClass}">
                <div class="table-header">
                    <h4>Mesa ${tableNum}</h4>
                    <span class="table-status ${statusClass}">
                        ${statusIcon} ${statusText}
                    </span>
                </div>
                <div class="table-info">
                    <div class="info-row">
                        <span class="info-label">Pedidos:</span>
                        <span class="info-value">${data.orders.length}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Items:</span>
                        <span class="info-value">${data.totalItems}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Total:</span>
                        <span class="info-value total-amount">€${data.totalAmount.toFixed(2)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Cliente:</span>
                        <span class="info-value">${data.orders[0]?.customer_name || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Última actividad:</span>
                        <span class="info-value time-value">${formatTime(data.lastActivity)}</span>
                    </div>
                </div>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm" onclick="viewEmployeeTableBill('${tableNum}')">
                        <i class="fas fa-eye"></i> Ver Cuenta
                    </button>
                    ${data.isReady ? `
                        <button class="btn btn-success btn-sm" onclick="notifyTableReady('${tableNum}')">
                            <i class="fas fa-bell"></i> Avisar Admin
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function formatTime(date) {
    if (!date) return 'N/A';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h ${minutes % 60}min`;
    
    return date.toLocaleString('es-ES');
}

async function viewEmployeeTableBill(tableNumber) {
    try {
        const allOrders = JSON.parse(localStorage.getItem('kitchenOrders') || '[]');
        const tableOrders = allOrders.filter(order => 
            order.table_number == tableNumber && !['paid', 'cancelled'].includes(order.status)
        );
        
        if (tableOrders.length === 0) {
            showNotification('No hay pedidos activos para esta mesa', 'warning');
            return;
        }
        
        // Consolidar items de todos los pedidos de la mesa
        const allItems = [];
        let totalAmount = 0;
        
        tableOrders.forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    const existingItem = allItems.find(i => i.name === item.name);
                    if (existingItem) {
                        existingItem.quantity += item.quantity;
                        existingItem.total += (item.total || item.price * item.quantity);
                    } else {
                        allItems.push({
                            ...item,
                            total: item.total || item.price * item.quantity
                        });
                    }
                });
            }
            totalAmount += order.total_amount || 0;
        });
        
        currentEmployeeBill = {
            tableNumber,
            orders: tableOrders,
            items: allItems,
            totalAmount,
            customerName: tableOrders[0]?.customer_name || 'Cliente',
            timestamp: new Date().toISOString()
        };
        
        showEmployeeBillModal();
        
    } catch (error) {
        console.error('Error viendo cuenta de mesa:', error);
        showNotification('Error cargando la cuenta', 'error');
    }
}

function showEmployeeBillModal() {
    if (!currentEmployeeBill) return;
    
    const title = document.getElementById('employeeBillTitle');
    const details = document.getElementById('employeeBillDetails');
    
    if (title) {
        title.textContent = `Cuenta Mesa ${currentEmployeeBill.tableNumber}`;
    }
    
    if (details) {
        details.innerHTML = `
            <div class="employee-bill-header">
                <div class="bill-info">
                    <h4>☕ Café Aroma</h4>
                    <p><strong>Mesa:</strong> ${currentEmployeeBill.tableNumber}</p>
                    <p><strong>Cliente:</strong> ${currentEmployeeBill.customerName}</p>
                    <p><strong>Pedidos:</strong> ${currentEmployeeBill.orders.length}</p>
                    <p><strong>Fecha:</strong> ${formatDateTime(currentEmployeeBill.timestamp)}</p>
                </div>
            </div>
            
            <div class="employee-bill-items">
                <h4>Detalle de la Cuenta</h4>
                <table class="employee-bill-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Cant.</th>
                            <th>Precio</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentEmployeeBill.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>€${item.price.toFixed(2)}</td>
                                <td>€${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="employee-bill-total">
                            <td colspan="3"><strong>TOTAL</strong></td>
                            <td><strong>€${currentEmployeeBill.totalAmount.toFixed(2)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="order-status-info">
                <h4>Estado de los Pedidos</h4>
                ${currentEmployeeBill.orders.map(order => `
                    <div class="order-status-item">
                        <span class="order-id">Pedido #${order.id}</span>
                        <span class="status-badge status-${order.status}">
                            ${getOrderStatusText(order.status)}
                        </span>
                        <span class="order-time">${formatTime(new Date(order.created_at))}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    const modal = document.getElementById('employeeBillModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeEmployeeBillModal() {
    const modal = document.getElementById('employeeBillModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEmployeeBill = null;
}

function getOrderStatusText(status) {
    const statusTexts = {
        'pending': 'Pendiente',
        'preparing': 'Preparando',
        'ready': 'Listo',
        'served': 'Servido',
        'paid': 'Pagado',
        'cancelled': 'Cancelado'
    };
    return statusTexts[status] || status;
}

async function requestBillPrint() {
    if (!currentEmployeeBill) return;
    
    try {
        // Simular solicitud de impresión al admin
        const printRequests = JSON.parse(localStorage.getItem('printRequests') || '[]');
        printRequests.unshift({
            id: Date.now(),
            tableNumber: currentEmployeeBill.tableNumber,
            employeeName: currentEmployee?.name || 'Empleado',
            timestamp: new Date().toISOString(),
            status: 'pending',
            bill: currentEmployeeBill
        });
        localStorage.setItem('printRequests', JSON.stringify(printRequests));
        
        showNotification(`Solicitud de impresión enviada para Mesa ${currentEmployeeBill.tableNumber}`, 'success');
        closeEmployeeBillModal();
        
    } catch (error) {
        console.error('Error solicitando impresión:', error);
        showNotification('Error enviando solicitud de impresión', 'error');
    }
}

async function markTableAsReady() {
    if (!currentEmployeeBill) return;
    
    try {
        // Marcar todos los pedidos de la mesa como 'served' si no lo están ya
        const allOrders = JSON.parse(localStorage.getItem('kitchenOrders') || '[]');
        let updated = false;
        
        currentEmployeeBill.orders.forEach(billOrder => {
            const orderIndex = allOrders.findIndex(o => o.id === billOrder.id);
            if (orderIndex !== -1 && allOrders[orderIndex].status !== 'served') {
                allOrders[orderIndex].status = 'served';
                allOrders[orderIndex].served_at = new Date().toISOString();
                updated = true;
            }
        });
        
        if (updated) {
            localStorage.setItem('kitchenOrders', JSON.stringify(allOrders));
            showNotification(`Mesa ${currentEmployeeBill.tableNumber} marcada como lista para cobrar`, 'success');
        }
        
        closeEmployeeBillModal();
        loadEmployeeBills(); // Recargar vista
        
    } catch (error) {
        console.error('Error marcando mesa como lista:', error);
        showNotification('Error actualizando estado de la mesa', 'error');
    }
}

async function notifyTableReady(tableNumber) {
    try {
        // Enviar notificación al admin
        const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
        notifications.unshift({
            id: Date.now(),
            type: 'table_ready',
            tableNumber: tableNumber,
            employeeName: currentEmployee?.name || 'Empleado',
            message: `Mesa ${tableNumber} lista para cobrar`,
            timestamp: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        
        showNotification(`Notificación enviada al administrador - Mesa ${tableNumber}`, 'success');
        
    } catch (error) {
        console.error('Error enviando notificación:', error);
        showNotification('Error enviando notificación', 'error');
    }
}

function refreshBills() {
    loadEmployeeBills();
    showNotification('Cuentas actualizadas', 'success');
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES');
}

// ==========================================
// RESERVAS PARA EMPLEADOS
// ==========================================

async function loadEmployeeReservations() {
    try {
        // Obtener reservas del localStorage (las nuevas del sitio web)
        const savedReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        
        // Obtener reservas estáticas
        const today = new Date().toISOString().split('T')[0];
        const staticReservations = [
            {id: 1, name: "Juan Pérez", email: "juan@email.com", date: today, time: "19:00", guests: 2, status: "confirmed", phone: "+34 666 123 456"},
            {id: 2, name: "María García", email: "maria@email.com", date: today, time: "20:30", guests: 4, status: "pending", phone: "+34 777 234 567"},
            {id: 3, name: "Carlos López", email: "carlos@email.com", date: today, time: "18:00", guests: 3, status: "confirmed", phone: "+34 888 345 678"}
        ];
        
        // Combinar reservas
        const allReservations = [...staticReservations, ...savedReservations];
        
        // Filtrar solo las de hoy
        const todayReservations = allReservations.filter(r => r.date === today);
        
        // Ordenar por hora
        todayReservations.sort((a, b) => a.time.localeCompare(b.time));
        
        displayEmployeeReservations(todayReservations);
        updateReservationsSummary(todayReservations);
        
        console.log(`📋 Cargadas ${todayReservations.length} reservas para empleados`);
        
    } catch (error) {
        console.error('Error cargando reservas:', error);
        const container = document.getElementById('reservationsList');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error cargando reservas</p>
                </div>
            `;
        }
    }
}

function displayEmployeeReservations(reservations) {
    const container = document.getElementById('reservationsList');
    if (!container) return;
    
    if (reservations.length === 0) {
        container.innerHTML = `
            <div class="no-reservations">
                <i class="fas fa-calendar-times"></i>
                <p>No hay reservas para hoy</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reservations.map(reservation => {
        const statusClass = reservation.status === 'confirmed' ? 'confirmed' : 
                           reservation.status === 'pending' ? 'pending' : 'cancelled';
        const statusIcon = reservation.status === 'confirmed' ? '✅' : 
                          reservation.status === 'pending' ? '⏳' : '❌';
        
        return `
            <div class="reservation-card ${statusClass}">
                <div class="reservation-header">
                    <div class="reservation-time">
                        <i class="fas fa-clock"></i>
                        <strong>${reservation.time}</strong>
                    </div>
                    <div class="reservation-status">
                        ${statusIcon} ${getReservationStatusText(reservation.status)}
                    </div>
                </div>
                
                <div class="reservation-details">
                    <div class="customer-info">
                        <h4><i class="fas fa-user"></i> ${reservation.name}</h4>
                        <p><i class="fas fa-users"></i> ${reservation.guests} persona${reservation.guests > 1 ? 's' : ''}</p>
                        <p><i class="fas fa-phone"></i> ${reservation.phone}</p>
                    </div>
                    
                    ${reservation.message ? `
                        <div class="reservation-notes">
                            <i class="fas fa-sticky-note"></i>
                            <p>${reservation.message}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="reservation-actions">
                    <button class="table-suggestion-btn" onclick="suggestTable(${reservation.guests})">
                        <i class="fas fa-table"></i>
                        Sugerir Mesa
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateReservationsSummary(reservations) {
    const todayCount = reservations.length;
    const totalGuests = reservations.reduce((sum, r) => sum + r.guests, 0);
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed');
    
    // Próxima reserva
    const nextReservation = confirmedReservations
        .filter(r => r.time > new Date().toTimeString().substr(0, 5))
        .sort((a, b) => a.time.localeCompare(b.time))[0];
    
    document.getElementById('todayReservationsCount').textContent = todayCount;
    document.getElementById('totalGuestsCount').textContent = totalGuests;
    document.getElementById('nextReservationTime').textContent = nextReservation ? nextReservation.time : '--:--';
}

function getReservationStatusText(status) {
    const statusMap = {
        'confirmed': 'Confirmada',
        'pending': 'Pendiente',
        'cancelled': 'Cancelada'
    };
    return statusMap[status] || status;
}

function suggestTable(guests) {
    let suggestedTables = [];
    
    if (guests <= 2) {
        suggestedTables = ['Mesa 1', 'Mesa 2', 'Mesa 5', 'Mesa 8'];
    } else if (guests <= 4) {
        suggestedTables = ['Mesa 3', 'Mesa 4', 'Mesa 6', 'Mesa 7'];
    } else if (guests <= 6) {
        suggestedTables = ['Mesa 9', 'Mesa 10', 'Mesa 11'];
    } else {
        suggestedTables = ['Mesa 12 (Salón)', 'Unir mesas 3+4'];
    }
    
    showNotification(`Mesas recomendadas para ${guests} personas: ${suggestedTables.join(', ')}`, 'info');
}

function filterEmployeeReservations(status) {
    const cards = document.querySelectorAll('.reservation-card');
    
    cards.forEach(card => {
        if (status === 'all' || card.classList.contains(status)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-status="${status}"]`).classList.add('active');
}

// Configurar filtros de reservas
function setupReservationsEventListeners() {
    const filterBtns = document.querySelectorAll('.reservations-filters .filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const status = e.target.dataset.status;
            if (status) {
                filterEmployeeReservations(status);
            }
        });
    });
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
    
    // Auto-refresh cada 30 segundos para cocina
    setInterval(() => {
        if (document.getElementById('kitchenSection').classList.contains('active')) {
            loadKitchenOrders();
        }
    }, 30000);
    
    // Auto-refresh cada 10 segundos para reservas
    setInterval(() => {
        if (document.getElementById('reservationsSection').classList.contains('active')) {
            loadEmployeeReservations();
        }
    }, 10000);
    
    // Auto-refresh cada 15 segundos para cuentas
    setInterval(() => {
        if (document.getElementById('billsSection').classList.contains('active')) {
            loadEmployeeBills();
        }
    }, 15000);
}

async function loadKitchenOrders() {
    try {
        let serverOrders = [];
        
        // Intentar cargar desde el servidor
        try {
            const response = await fetch('/api/orders', {
                headers: {
                    'Authorization': `Bearer ${employeeToken}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    serverOrders = result.data || [];
                }
            }
        } catch (serverError) {
            console.log('Servidor no disponible, usando datos locales');
        }
        
        // Obtener pedidos del localStorage
        const localOrders = JSON.parse(localStorage.getItem('kitchenOrders') || '[]');
        
        // Combinar pedidos del servidor y locales
        allOrders = [...serverOrders, ...localOrders];
        
        // Ordenar por fecha de creación (más recientes primero)
        allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        displayKitchenOrders(allOrders);
        
        console.log(`🍳 Cargados ${allOrders.length} pedidos para cocina`);
        
    } catch (error) {
        console.error('Error cargando pedidos de cocina:', error);
        // Mostrar solo pedidos locales como fallback
        const localOrders = JSON.parse(localStorage.getItem('kitchenOrders') || '[]');
        allOrders = localOrders;
        displayKitchenOrders(allOrders);
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
        let serverUpdated = false;
        
        // Intentar actualizar en el servidor
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${employeeToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    serverUpdated = true;
                }
            }
        } catch (serverError) {
            console.log('Servidor no disponible, actualizando localmente');
        }
        
        // Actualizar en localStorage
        const localOrders = JSON.parse(localStorage.getItem('kitchenOrders') || '[]');
        const orderIndex = localOrders.findIndex(order => order.id == orderId);
        
        if (orderIndex !== -1) {
            localOrders[orderIndex].status = newStatus;
            localOrders[orderIndex].updated_at = new Date().toISOString();
            localStorage.setItem('kitchenOrders', JSON.stringify(localOrders));
        }
        
        // Actualizar en allOrders para la vista actual
        const currentOrderIndex = allOrders.findIndex(order => order.id == orderId);
        if (currentOrderIndex !== -1) {
            allOrders[currentOrderIndex].status = newStatus;
        }
        
        showNotification(`Pedido actualizado a: ${getStatusLabel(newStatus)}`, 'success');
        loadKitchenOrders();
        
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
window.loadEmployeeReservations = loadEmployeeReservations;
window.suggestTable = suggestTable;