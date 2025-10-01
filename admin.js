// ==========================================
// PANEL DE ADMINISTRACIÓN - CAFÉ AROMA
// ==========================================

// Variables globales
let currentUser = null;
let authToken = null;
let currentReservation = null;
let currentMenuItem = null;
let currentContact = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Ocultar loading screen después de 2 segundos
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        initializeAdmin();
    }, 2000);
});

function initializeAdmin() {
    // Verificar si hay token guardado
    authToken = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (authToken && user) {
        currentUser = JSON.parse(user);
        if (currentUser.role === 'admin') {
            showDashboard();
            loadDashboardData();
        } else {
            showLogin();
        }
    } else {
        showLogin();
    }
    
    // Event listeners
    setupEventListeners();
    
    // Inicializar tiempo y fecha
    updateTimeAndDate();
    setInterval(updateTimeAndDate, 1000);
}

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Navigation - Sidebar menu items
    const menuItems = document.querySelectorAll('.menu-item[data-section]');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section);
            
            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
        });
    });
    
    // Filters
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            loadMenu();
        });
    }
    
    const menuSearch = document.getElementById('menuSearch');
    if (menuSearch) {
        menuSearch.addEventListener('input', debounce(() => {
            loadMenu();
        }, 300));
    }
    
    const contactStatus = document.getElementById('contactStatus');
    if (contactStatus) {
        contactStatus.addEventListener('change', () => {
            loadContacts();
        });
    }
    
    // Forms
    const menuItemForm = document.getElementById('menuItemForm');
    if (menuItemForm) {
        menuItemForm.addEventListener('submit', handleMenuItemSubmit);
    }
    
    const restaurantInfoForm = document.getElementById('restaurantInfoForm');
    if (restaurantInfoForm) {
        restaurantInfoForm.addEventListener('submit', handleRestaurantInfoSubmit);
    }
    
    const hoursForm = document.getElementById('hoursForm');
    if (hoursForm) {
        hoursForm.addEventListener('submit', handleHoursSubmit);
    }
}

// ==========================================
// AUTENTICACIÓN
// ==========================================
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    const errorDiv = document.getElementById('loginError');
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
    submitBtn.disabled = true;
    errorDiv.style.display = 'none';
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (result.success && result.data.user.role === 'admin') {
            authToken = result.data.token;
            currentUser = result.data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            showDashboard();
            loadDashboardData();
            showToast('Inicio de sesión exitoso', 'success');
        } else {
            throw new Error(result.message || 'Credenciales inválidas o sin permisos de administrador');
        }
    } catch (error) {
        console.error('Error en login:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    authToken = null;
    currentUser = null;
    showLogin();
    showToast('Sesión cerrada correctamente', 'success');
}

function showLogin() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    
    if (currentUser) {
        document.getElementById('adminName').textContent = currentUser.name || currentUser.username;
        document.getElementById('adminRole').textContent = 'Administrador';
    }
}

// ==========================================
// NAVEGACIÓN
// ==========================================
function showSection(sectionName) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Actualizar título
    const titles = {
        overview: 'Resumen General',
        reservations: 'Gestión de Reservaciones',
        menu: 'Gestión del Menú',
        contacts: 'Mensajes de Contacto',
        analytics: 'Análisis y Reportes',
        settings: 'Configuración del Sistema'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionName] || 'Resumen General';
    }
    
    // Cargar datos de la sección
    switch (sectionName) {
        case 'overview':
            loadDashboardData();
            break;
        case 'reservations':
            loadReservations();
            break;
        case 'menu':
            loadMenu();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

// Funciones para sidebar responsive
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
    } else {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('full-width');
    }
}

// Función para actualizar fecha y hora
function updateTimeAndDate() {
    const now = new Date();
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');
    
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('es-ES');
    }
    
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.password-toggle i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// ==========================================
// DASHBOARD
// ==========================================
async function loadDashboardData() {
    try {
        // Cargar estadísticas
        const [menuData, reservationsData, contactsData] = await Promise.all([
            apiRequest('/api/menu'),
            apiRequest('/api/reservations'),
            apiRequest('/api/contact')
        ]);
        
        // Actualizar estadísticas del overview
        if (menuData.success) {
            document.getElementById('totalMenuItems').textContent = menuData.data.length || 0;
        }
        
        if (reservationsData.success) {
            const today = new Date().toISOString().split('T')[0];
            const todayReservations = reservationsData.data.filter(r => r.date === today);
            document.getElementById('totalReservations').textContent = todayReservations.length || 0;
        }
        
        if (contactsData.success) {
            const newMessages = contactsData.data.filter(c => c.status === 'new');
            document.getElementById('totalMessages').textContent = newMessages.length || 0;
        }
        
        // Simular ingresos mensuales (esto debería venir de una API real)
        document.getElementById('monthlyRevenue').textContent = '$12,350';
        
        // Cargar actividad reciente
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showToast('Error cargando datos del dashboard', 'error');
    }
}

async function loadRecentActivity() {
    try {
        const recentReservations = await apiRequest('/api/reservations?limit=5');
        const recentContacts = await apiRequest('/api/contact?limit=5');
        
        const activityContainer = document.getElementById('recentActivity');
        let activityHTML = '<h4>Reservas Recientes</h4>';
        
        if (recentReservations.success && recentReservations.data.reservations.length > 0) {
            activityHTML += '<ul>';
            recentReservations.data.reservations.forEach(reservation => {
                activityHTML += `
                    <li>
                        <strong>${reservation.name}</strong> - ${formatDate(reservation.date)} ${reservation.time}
                        <span class="status-badge status-${reservation.status}">${getStatusText(reservation.status)}</span>
                    </li>
                `;
            });
            activityHTML += '</ul>';
        } else {
            activityHTML += '<p>No hay reservas recientes</p>';
        }
        
        activityHTML += '<h4 style="margin-top: 20px;">Mensajes Recientes</h4>';
        
        if (recentContacts.success && recentContacts.data.contacts.length > 0) {
            activityHTML += '<ul>';
            recentContacts.data.contacts.forEach(contact => {
                activityHTML += `
                    <li>
                        <strong>${contact.name}</strong> - ${contact.subject}
                        <span class="status-badge status-${contact.status}">${getContactStatusText(contact.status)}</span>
                    </li>
                `;
            });
            activityHTML += '</ul>';
        } else {
            activityHTML += '<p>No hay mensajes recientes</p>';
        }
        
        activityContainer.innerHTML = activityHTML;
        
    } catch (error) {
        console.error('Error cargando actividad:', error);
        document.getElementById('recentActivity').innerHTML = '<p>Error cargando actividad reciente</p>';
    }
}

// ==========================================
// RESERVAS
// ==========================================
async function loadReservations(page = 1) {
    try {
        showLoading(true);
        
        const status = document.getElementById('reservationStatusFilter').value;
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10'
        });
        
        if (status !== 'all') {
            params.append('status', status);
        }
        
        const response = await apiRequest(`/api/reservations?${params}`);
        
        if (response.success) {
            displayReservations(response.data.reservations);
            displayPagination('reservationsPagination', response.data.pagination, loadReservations);
        } else {
            throw new Error(response.message);
        }
        
    } catch (error) {
        console.error('Error cargando reservas:', error);
        showNotification('Error cargando reservas', 'error');
    } finally {
        showLoading(false);
    }
}

function displayReservations(reservations) {
    const tbody = document.getElementById('reservationsTableBody');
    
    if (!reservations || reservations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay reservas</td></tr>';
        return;
    }
    
    tbody.innerHTML = reservations.map(reservation => `
        <tr>
            <td>#${reservation.id}</td>
            <td>
                <strong>${reservation.name}</strong><br>
                <small>${reservation.email}</small><br>
                <small>${reservation.phone}</small>
            </td>
            <td>${formatDate(reservation.date)}</td>
            <td>${reservation.time}</td>
            <td>${reservation.guests}</td>
            <td>
                <span class="status-badge status-${reservation.status}">
                    ${getStatusText(reservation.status)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view" onclick="viewReservation(${reservation.id})" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit" onclick="updateReservationStatus(${reservation.id}, 'confirmed')" title="Confirmar">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon delete" onclick="updateReservationStatus(${reservation.id}, 'cancelled')" title="Cancelar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function viewReservation(id) {
    try {
        const response = await apiRequest(`/api/reservations`);
        if (response.success) {
            const reservation = response.data.reservations.find(r => r.id === id);
            if (reservation) {
                currentReservation = reservation;
                
                const modalBody = document.getElementById('reservationModalBody');
                modalBody.innerHTML = `
                    <div class="reservation-details">
                        <h4>Información del Cliente</h4>
                        <p><strong>Nombre:</strong> ${reservation.name}</p>
                        <p><strong>Email:</strong> ${reservation.email}</p>
                        <p><strong>Teléfono:</strong> ${reservation.phone}</p>
                        
                        <h4>Detalles de la Reserva</h4>
                        <p><strong>Fecha:</strong> ${formatDate(reservation.date)}</p>
                        <p><strong>Hora:</strong> ${reservation.time}</p>
                        <p><strong>Número de comensales:</strong> ${reservation.guests}</p>
                        <p><strong>Estado:</strong> <span class="status-badge status-${reservation.status}">${getStatusText(reservation.status)}</span></p>
                        
                        ${reservation.message ? `
                            <h4>Notas del cliente</h4>
                            <p>${reservation.message}</p>
                        ` : ''}
                        
                        <p><strong>Fecha de creación:</strong> ${formatDateTime(reservation.created_at)}</p>
                    </div>
                `;
                
                showModal('reservationModal');
            }
        }
    } catch (error) {
        console.error('Error obteniendo reserva:', error);
        showNotification('Error obteniendo detalles de la reserva', 'error');
    }
}

async function updateReservationStatus(id, status) {
    try {
        const response = await apiRequest(`/api/reservations/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        
        if (response.success) {
            showNotification(response.message, 'success');
            loadReservations();
            closeModal('reservationModal');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error actualizando reserva:', error);
        showNotification('Error actualizando estado de la reserva', 'error');
    }
}

function confirmReservation() {
    if (currentReservation) {
        updateReservationStatus(currentReservation.id, 'confirmed');
    }
}

function cancelReservation() {
    if (currentReservation) {
        updateReservationStatus(currentReservation.id, 'cancelled');
    }
}

function refreshReservations() {
    loadReservations();
    showNotification('Reservas actualizadas', 'success');
}

// ==========================================
// MENÚ
// ==========================================
async function loadMenu() {
    try {
        showLoading(true);
        
        const response = await apiRequest('/api/menu/admin');
        
        if (response.success) {
            displayMenu(response.data);
        } else {
            throw new Error(response.message);
        }
        
    } catch (error) {
        console.error('Error cargando menú:', error);
        showNotification('Error cargando menú', 'error');
    } finally {
        showLoading(false);
    }
}

function displayMenu(menuItems) {
    const tbody = document.getElementById('menuTableBody');
    
    if (!menuItems || menuItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay elementos en el menú</td></tr>';
        return;
    }
    
    tbody.innerHTML = menuItems.map(item => `
        <tr>
            <td>#${item.id}</td>
            <td>
                <strong>${item.name}</strong><br>
                <small>${item.description.substring(0, 50)}...</small>
            </td>
            <td>${item.category}</td>
            <td>€${item.price.toFixed(2)}</td>
            <td>
                <span class="status-badge ${item.available ? 'status-confirmed' : 'status-cancelled'}">
                    ${item.available ? 'Disponible' : 'No disponible'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editMenuItem(${item.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon ${item.available ? 'delete' : 'edit'}" 
                            onclick="toggleMenuItemAvailability(${item.id})" 
                            title="${item.available ? 'Deshabilitar' : 'Habilitar'}">
                        <i class="fas fa-${item.available ? 'ban' : 'check'}"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteMenuItem(${item.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function showAddMenuItemModal() {
    currentMenuItem = null;
    document.getElementById('menuModalTitle').textContent = 'Agregar Item al Menú';
    document.getElementById('menuItemForm').reset();
    document.getElementById('menuItemId').value = '';
    showModal('menuItemModal');
}

async function editMenuItem(id) {
    try {
        const response = await apiRequest('/api/menu/admin');
        if (response.success) {
            const item = response.data.find(i => i.id === id);
            if (item) {
                currentMenuItem = item;
                
                document.getElementById('menuModalTitle').textContent = 'Editar Item del Menú';
                document.getElementById('menuItemId').value = item.id;
                document.getElementById('menuItemName').value = item.name;
                document.getElementById('menuItemDescription').value = item.description;
                document.getElementById('menuItemPrice').value = item.price;
                document.getElementById('menuItemCategory').value = item.category;
                document.getElementById('menuItemImage').value = item.image || '';
                document.getElementById('menuItemAvailable').checked = item.available;
                
                showModal('menuItemModal');
            }
        }
    } catch (error) {
        console.error('Error obteniendo item del menú:', error);
        showNotification('Error obteniendo item del menú', 'error');
    }
}

async function saveMenuItem() {
    try {
        const form = document.getElementById('menuItemForm');
        const formData = new FormData(form);
        
        const itemData = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            category: formData.get('category'),
            image: formData.get('image') || null,
            available: formData.has('available')
        };
        
        const id = formData.get('id');
        const isEdit = id && id !== '';
        
        const response = await apiRequest(
            isEdit ? `/api/menu/${id}` : '/api/menu',
            {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(itemData)
            }
        );
        
        if (response.success) {
            showNotification(response.message, 'success');
            loadMenu();
            closeModal('menuItemModal');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error guardando item del menú:', error);
        showNotification('Error guardando item del menú', 'error');
    }
}

async function toggleMenuItemAvailability(id) {
    try {
        const response = await apiRequest(`/api/menu/${id}/availability`, {
            method: 'PATCH'
        });
        
        if (response.success) {
            showNotification(response.message, 'success');
            loadMenu();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error actualizando disponibilidad:', error);
        showNotification('Error actualizando disponibilidad', 'error');
    }
}

async function deleteMenuItem(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este elemento del menú?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/api/menu/${id}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showNotification(response.message, 'success');
            loadMenu();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error eliminando item del menú:', error);
        showNotification('Error eliminando item del menú', 'error');
    }
}

function refreshMenu() {
    loadMenu();
    showNotification('Menú actualizado', 'success');
}

// ==========================================
// CONTACTOS
// ==========================================
async function loadContacts(page = 1) {
    try {
        showLoading(true);
        
        const status = document.getElementById('contactStatusFilter').value;
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10'
        });
        
        if (status !== 'all') {
            params.append('status', status);
        }
        
        const response = await apiRequest(`/api/contact?${params}`);
        
        if (response.success) {
            displayContacts(response.data.contacts);
            displayPagination('contactsPagination', response.data.pagination, loadContacts);
        } else {
            throw new Error(response.message);
        }
        
    } catch (error) {
        console.error('Error cargando contactos:', error);
        showNotification('Error cargando contactos', 'error');
    } finally {
        showLoading(false);
    }
}

function displayContacts(contacts) {
    const tbody = document.getElementById('contactsTableBody');
    
    if (!contacts || contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay mensajes de contacto</td></tr>';
        return;
    }
    
    tbody.innerHTML = contacts.map(contact => `
        <tr>
            <td>#${contact.id}</td>
            <td>${contact.name}</td>
            <td>${contact.email}</td>
            <td>${contact.subject.substring(0, 30)}...</td>
            <td>${formatDate(contact.created_at)}</td>
            <td>
                <span class="status-badge status-${contact.status}">
                    ${getContactStatusText(contact.status)}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view" onclick="viewContact(${contact.id})" title="Ver mensaje">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon edit" onclick="updateContactStatus(${contact.id}, 'read')" title="Marcar como leído">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon edit" onclick="updateContactStatus(${contact.id}, 'replied')" title="Marcar como respondido">
                        <i class="fas fa-reply"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function viewContact(id) {
    try {
        const response = await apiRequest('/api/contact');
        if (response.success) {
            const contact = response.data.contacts.find(c => c.id === id);
            if (contact) {
                currentContact = contact;
                
                const modalBody = document.getElementById('contactModalBody');
                modalBody.innerHTML = `
                    <div class="contact-details">
                        <h4>Información del Contacto</h4>
                        <p><strong>Nombre:</strong> ${contact.name}</p>
                        <p><strong>Email:</strong> ${contact.email}</p>
                        <p><strong>Asunto:</strong> ${contact.subject}</p>
                        <p><strong>Estado:</strong> <span class="status-badge status-${contact.status}">${getContactStatusText(contact.status)}</span></p>
                        
                        <h4>Mensaje</h4>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid var(--primary-color);">
                            ${contact.message.replace(/\n/g, '<br>')}
                        </div>
                        
                        <p style="margin-top: 20px;"><strong>Fecha de envío:</strong> ${formatDateTime(contact.created_at)}</p>
                    </div>
                `;
                
                showModal('contactModal');
                
                // Marcar como leído si no lo está
                if (contact.status === 'unread') {
                    updateContactStatus(id, 'read');
                }
            }
        }
    } catch (error) {
        console.error('Error obteniendo contacto:', error);
        showNotification('Error obteniendo detalles del contacto', 'error');
    }
}

async function updateContactStatus(id, status) {
    try {
        const response = await apiRequest(`/api/contact/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        
        if (response.success) {
            showNotification(response.message, 'success');
            loadContacts();
            closeModal('contactModal');
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error actualizando contacto:', error);
        showNotification('Error actualizando estado del contacto', 'error');
    }
}

function markAsRead() {
    if (currentContact) {
        updateContactStatus(currentContact.id, 'read');
    }
}

function markAsReplied() {
    if (currentContact) {
        updateContactStatus(currentContact.id, 'replied');
    }
}

function refreshContacts() {
    loadContacts();
    showNotification('Contactos actualizados', 'success');
}

// ==========================================
// CONFIGURACIÓN
// ==========================================
async function handleSettingsUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const settings = {};
    
    for (let [key, value] of formData.entries()) {
        settings[key] = value;
    }
    
    try {
        showLoading(true);
        
        // Aquí implementarías la actualización de configuración
        // Por ahora simularemos la respuesta
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showNotification('Configuración actualizada correctamente', 'success');
        
    } catch (error) {
        console.error('Error actualizando configuración:', error);
        showNotification('Error actualizando configuración', 'error');
    } finally {
        showLoading(false);
    }
}

// ==========================================
// UTILIDADES
// ==========================================
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        ...options
    };
    
    const response = await fetch(url, defaultOptions);
    return await response.json();
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }
}

function showNotification(message, type = 'info', duration = 5000) {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = `notification ${type} show`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    return icons[type] || icons.info;
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'info', duration = 5000) {
    const toast = document.getElementById('toast');
    const toastIcon = toast.querySelector('.toast-icon');
    const toastMessage = toast.querySelector('.toast-message');
    
    // Configurar el ícono según el tipo
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toastIcon.className = `toast-icon ${icons[type]}`;
    toastMessage.textContent = message;
    
    // Añadir clase de tipo para colores
    toast.className = `toast ${type}`;
    
    // Mostrar toast
    toast.classList.add('show');
    
    // Ocultar después del tiempo especificado
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================
function openMenuModal(item = null) {
    const modal = document.getElementById('menuModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('menuItemForm');
    
    if (item) {
        // Editar elemento existente
        modalTitle.textContent = 'Editar Elemento del Menú';
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemDescription').value = item.description;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemImage').value = item.image || '';
        document.getElementById('itemAvailable').checked = item.available;
        form.dataset.itemId = item.id;
    } else {
        // Nuevo elemento
        modalTitle.textContent = 'Agregar Elemento al Menú';
        form.reset();
        delete form.dataset.itemId;
    }
    
    modal.classList.add('active');
}

function closeMenuModal() {
    const modal = document.getElementById('menuModal');
    modal.classList.remove('active');
}

// ==========================================
// MENU MANAGEMENT
// ==========================================
async function loadMenu() {
    try {
        const response = await apiRequest('/api/menu');
        
        if (response.success) {
            displayMenuItems(response.data);
        } else {
            showToast('Error cargando el menú', 'error');
        }
    } catch (error) {
        console.error('Error loading menu:', error);
        showToast('Error cargando el menú', 'error');
    }
}

function displayMenuItems(items) {
    const menuList = document.getElementById('menuList');
    const categoryFilter = document.getElementById('categoryFilter').value;
    const searchTerm = document.getElementById('menuSearch').value.toLowerCase();
    
    // Filtrar elementos
    let filteredItems = items;
    
    if (categoryFilter) {
        filteredItems = filteredItems.filter(item => item.category === categoryFilter);
    }
    
    if (searchTerm) {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
    }
    
    menuList.innerHTML = '';
    
    if (filteredItems.length === 0) {
        menuList.innerHTML = '<p>No se encontraron elementos del menú.</p>';
        return;
    }
    
    filteredItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card';
        itemCard.innerHTML = `
            <div class="item-image">
                ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--border-radius);">` : '<i class="fas fa-utensils"></i>'}
            </div>
            <div class="item-details">
                <h4>${item.name}</h4>
                <p>${item.description}</p>
                <div class="item-price">$${parseFloat(item.price).toFixed(2)}</div>
                <div class="item-status">
                    <span class="status-badge ${item.available ? 'status-available' : 'status-unavailable'}">
                        ${item.available ? 'Disponible' : 'No disponible'}
                    </span>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-edit" onclick="openMenuModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-delete" onclick="deleteMenuItem(${item.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        menuList.appendChild(itemCard);
    });
}

async function handleMenuItemSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const itemData = {
        name: formData.get('itemName'),
        description: formData.get('itemDescription'),
        price: parseFloat(formData.get('itemPrice')),
        category: formData.get('itemCategory'),
        image: formData.get('itemImage'),
        available: formData.get('itemAvailable') === 'on'
    };
    
    const itemId = e.target.dataset.itemId;
    
    try {
        let response;
        if (itemId) {
            // Actualizar elemento existente
            response = await apiRequest(`/api/menu/${itemId}`, {
                method: 'PUT',
                body: JSON.stringify(itemData)
            });
        } else {
            // Crear nuevo elemento
            response = await apiRequest('/api/menu', {
                method: 'POST',
                body: JSON.stringify(itemData)
            });
        }
        
        if (response.success) {
            showToast(itemId ? 'Elemento actualizado correctamente' : 'Elemento agregado correctamente', 'success');
            closeMenuModal();
            loadMenu();
        } else {
            showToast('Error guardando el elemento', 'error');
        }
    } catch (error) {
        console.error('Error saving menu item:', error);
        showToast('Error guardando el elemento', 'error');
    }
}

async function deleteMenuItem(itemId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este elemento del menú?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/api/menu/${itemId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showToast('Elemento eliminado correctamente', 'success');
            loadMenu();
        } else {
            showToast('Error eliminando el elemento', 'error');
        }
    } catch (error) {
        console.error('Error deleting menu item:', error);
        showToast('Error eliminando el elemento', 'error');
    }
}

// ==========================================
// RESERVATIONS MANAGEMENT
// ==========================================
async function loadReservations() {
    try {
        const response = await apiRequest('/api/reservations');
        
        if (response.success) {
            displayReservations(response.data);
            updateReservationStats(response.data);
        } else {
            showToast('Error cargando reservaciones', 'error');
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
        showToast('Error cargando reservaciones', 'error');
    }
}

function displayReservations(reservations) {
    const reservationsList = document.getElementById('reservationsList');
    const selectedDate = document.getElementById('reservationDate').value;
    
    // Filtrar por fecha si está seleccionada
    let filteredReservations = reservations;
    if (selectedDate) {
        filteredReservations = reservations.filter(r => r.date === selectedDate);
    }
    
    reservationsList.innerHTML = '';
    
    if (filteredReservations.length === 0) {
        reservationsList.innerHTML = '<p>No se encontraron reservaciones.</p>';
        return;
    }
    
    filteredReservations.forEach(reservation => {
        const reservationCard = document.createElement('div');
        reservationCard.className = 'reservation-card';
        reservationCard.innerHTML = `
            <div class="reservation-header">
                <h4>${reservation.name}</h4>
                <span class="status-badge status-${reservation.status}">
                    ${getStatusText(reservation.status)}
                </span>
            </div>
            <div class="reservation-details">
                <p><i class="fas fa-calendar"></i> ${formatDate(reservation.date)}</p>
                <p><i class="fas fa-clock"></i> ${reservation.time}</p>
                <p><i class="fas fa-users"></i> ${reservation.guests} personas</p>
                <p><i class="fas fa-envelope"></i> ${reservation.email}</p>
                <p><i class="fas fa-phone"></i> ${reservation.phone}</p>
                ${reservation.message ? `<p><i class="fas fa-comment"></i> ${reservation.message}</p>` : ''}
            </div>
            <div class="reservation-actions">
                <button class="btn-view" onclick="updateReservationStatus(${reservation.id}, 'confirmed')">
                    <i class="fas fa-check"></i> Confirmar
                </button>
                <button class="btn-delete" onclick="updateReservationStatus(${reservation.id}, 'cancelled')">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        `;
        reservationsList.appendChild(reservationCard);
    });
}

function updateReservationStats(reservations) {
    const pending = reservations.filter(r => r.status === 'pending').length;
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const cancelled = reservations.filter(r => r.status === 'cancelled').length;
    
    document.getElementById('pendingReservations').textContent = pending;
    document.getElementById('confirmedReservations').textContent = confirmed;
    document.getElementById('cancelledReservations').textContent = cancelled;
}

async function updateReservationStatus(reservationId, status) {
    try {
        const response = await apiRequest(`/api/reservations/${reservationId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        
        if (response.success) {
            showToast(`Reservación ${status === 'confirmed' ? 'confirmada' : 'cancelada'} correctamente`, 'success');
            loadReservations();
        } else {
            showToast('Error actualizando la reservación', 'error');
        }
    } catch (error) {
        console.error('Error updating reservation:', error);
        showToast('Error actualizando la reservación', 'error');
    }
}

function filterReservations() {
    loadReservations();
}

// ==========================================
// CONTACTS MANAGEMENT
// ==========================================
async function loadContacts() {
    try {
        const response = await apiRequest('/api/contact');
        
        if (response.success) {
            displayContacts(response.data);
        } else {
            showToast('Error cargando mensajes de contacto', 'error');
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        showToast('Error cargando mensajes de contacto', 'error');
    }
}

function displayContacts(contacts) {
    const contactsList = document.getElementById('contactsList');
    const statusFilter = document.getElementById('contactStatus').value;
    
    // Filtrar por estado
    let filteredContacts = contacts;
    if (statusFilter) {
        filteredContacts = contacts.filter(c => c.status === statusFilter);
    }
    
    contactsList.innerHTML = '';
    
    if (filteredContacts.length === 0) {
        contactsList.innerHTML = '<p>No se encontraron mensajes de contacto.</p>';
        return;
    }
    
    filteredContacts.forEach(contact => {
        const contactCard = document.createElement('div');
        contactCard.className = 'contact-card';
        contactCard.innerHTML = `
            <div class="contact-header">
                <h4>${contact.name}</h4>
                <span class="status-badge status-${contact.status}">
                    ${getContactStatusText(contact.status)}
                </span>
            </div>
            <div class="contact-details">
                <p><strong>Asunto:</strong> ${contact.subject}</p>
                <p><strong>Email:</strong> ${contact.email}</p>
                <p><strong>Fecha:</strong> ${formatDate(contact.created_at)}</p>
                <p><strong>Mensaje:</strong></p>
                <p class="contact-message">${contact.message}</p>
            </div>
            <div class="contact-actions">
                <button class="btn-view" onclick="markContactAsRead(${contact.id})">
                    <i class="fas fa-eye"></i> Marcar como leído
                </button>
                <button class="btn-edit" onclick="markContactAsReplied(${contact.id})">
                    <i class="fas fa-reply"></i> Marcar como respondido
                </button>
                <button class="btn-delete" onclick="deleteContact(${contact.id})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        contactsList.appendChild(contactCard);
    });
}

async function markContactAsRead(contactId) {
    await updateContactStatus(contactId, 'read');
}

async function markContactAsReplied(contactId) {
    await updateContactStatus(contactId, 'replied');
}

async function updateContactStatus(contactId, status) {
    try {
        const response = await apiRequest(`/api/contact/${contactId}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        
        if (response.success) {
            showToast('Estado actualizado correctamente', 'success');
            loadContacts();
        } else {
            showToast('Error actualizando el estado', 'error');
        }
    } catch (error) {
        console.error('Error updating contact status:', error);
        showToast('Error actualizando el estado', 'error');
    }
}

async function deleteContact(contactId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este mensaje?')) {
        return;
    }
    
    try {
        const response = await apiRequest(`/api/contact/${contactId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showToast('Mensaje eliminado correctamente', 'success');
            loadContacts();
        } else {
            showToast('Error eliminando el mensaje', 'error');
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        showToast('Error eliminando el mensaje', 'error');
    }
}

// ==========================================
// ANALYTICS
// ==========================================
async function loadAnalytics() {
    // Aquí cargarías datos reales de analytics
    // Por ahora mostraremos datos de ejemplo
    showToast('Función de análisis en desarrollo', 'info');
}

// ==========================================
// SETTINGS
// ==========================================
async function loadSettings() {
    // Cargar configuración actual
    showToast('Configuración cargada', 'info');
}

async function handleRestaurantInfoSubmit(e) {
    e.preventDefault();
    // Manejar actualización de información del restaurante
    showToast('Información actualizada correctamente', 'success');
}

async function handleHoursSubmit(e) {
    e.preventDefault();
    // Manejar actualización de horarios
    showToast('Horarios actualizados correctamente', 'success');
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

function getStatusText(status) {
    const statusTexts = {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        cancelled: 'Cancelada'
    };
    return statusTexts[status] || status;
}

function getContactStatusText(status) {
    const statusTexts = {
        new: 'Nuevo',
        read: 'Leído',
        replied: 'Respondido'
    };
    return statusTexts[status] || status;
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Cerrar modal al hacer clic fuera de él
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Responsive sidebar
window.addEventListener('resize', function() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (window.innerWidth > 768) {
        sidebar.classList.remove('open');
        if (!sidebar.classList.contains('collapsed')) {
            mainContent.classList.remove('full-width');
        }
    }
});

function displayPagination(containerId, pagination, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const { page, pages, total } = pagination;
    
    let paginationHTML = '';
    
    // Botón anterior
    paginationHTML += `
        <button ${page <= 1 ? 'disabled' : ''} onclick="${loadFunction.name}(${page - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Páginas
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
        paginationHTML += `
            <button ${i === page ? 'class="active"' : ''} onclick="${loadFunction.name}(${i})">
                ${i}
            </button>
        `;
    }
    
    // Botón siguiente
    paginationHTML += `
        <button ${page >= pages ? 'disabled' : ''} onclick="${loadFunction.name}(${page + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    container.innerHTML = paginationHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
}

function getStatusText(status) {
    const statusTexts = {
        pending: 'Pendiente',
        confirmed: 'Confirmada',
        cancelled: 'Cancelada'
    };
    return statusTexts[status] || status;
}

function getContactStatusText(status) {
    const statusTexts = {
        unread: 'Sin leer',
        read: 'Leído',
        replied: 'Respondido'
    };
    return statusTexts[status] || status;
}