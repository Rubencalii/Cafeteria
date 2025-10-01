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
    
    // Listener para cambios en localStorage
    window.addEventListener('storage', function(e) {
        if (e.key === 'reservations' || e.key === 'contactMessages') {
            console.log('Detectado cambio en localStorage, actualizando estadísticas...');
            updateDashboardStats();
        }
    });
    
    // Verificar periódicamente cambios en localStorage (para la misma pestaña)
    setInterval(() => {
        updateDashboardStats();
    }, 5000); // Actualizar cada 5 segundos
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
    if (errorDiv) errorDiv.style.display = 'none';
    
    try {
        // Sistema de login estático para demo
        const validCredentials = {
            email: 'admin@cafearoma.com',
            password: 'admin123'
        };
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 800));
        
        console.log('Intentando login con:', loginData);
        console.log('Credenciales válidas:', validCredentials);
        
        if (loginData.email === validCredentials.email && loginData.password === validCredentials.password) {
            authToken = 'demo-token-' + Date.now();
            currentUser = {
                id: 1,
                name: 'Administrador',
                username: 'admin',
                email: 'admin@cafearoma.com',
                role: 'admin'
            };
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            
            showDashboard();
            loadDashboardDataStatic();
            showToast('Inicio de sesión exitoso', 'success');
        } else {
            throw new Error('Credenciales incorrectas. Intente con: admin@cafearoma.com / admin123');
        }
    } catch (error) {
        console.error('Error en login:', error);
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
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
async function loadDashboardDataStatic() {
    try {
        // Datos estáticos para demo - completamente funcional sin backend
        const menuData = {
            success: true,
            data: [
                {id: 1, name: "Café Americano", price: 2.50, category: "Café Caliente", available: true},
                {id: 2, name: "Cappuccino", price: 3.50, category: "Café Caliente", available: true},
                {id: 3, name: "Latte Macchiato", price: 4.00, category: "Café Caliente", available: true},
                {id: 4, name: "Café Frappé", price: 4.50, category: "Café Frío", available: true},
                {id: 5, name: "Cold Brew", price: 3.80, category: "Café Frío", available: true},
                {id: 6, name: "Tostada de Aguacate", price: 6.50, category: "Desayunos", available: true},
                {id: 7, name: "Croissant de Almendra", price: 3.20, category: "Postres", available: true},
                {id: 8, name: "Cheesecake", price: 5.50, category: "Postres", available: true},
                {id: 9, name: "Bowl de Açaí", price: 7.80, category: "Desayunos", available: true}
            ]
        };
        
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        
        const reservationsData = {
            success: true,
            data: [
                {id: 1, name: "Juan Pérez", email: "juan@email.com", date: today, time: "19:00", guests: 2, status: "confirmed", phone: "+34 666 123 456"},
                {id: 2, name: "María García", email: "maria@email.com", date: today, time: "20:30", guests: 4, status: "pending", phone: "+34 777 234 567"},
                {id: 3, name: "Carlos López", email: "carlos@email.com", date: tomorrow, time: "18:00", guests: 3, status: "confirmed", phone: "+34 888 345 678"},
                {id: 4, name: "Ana Martín", email: "ana@email.com", date: tomorrow, time: "21:00", guests: 2, status: "confirmed", phone: "+34 999 456 789"}
            ]
        };
        
        const contactsData = {
            success: true,
            data: [
                {id: 1, name: "Pedro Ruiz", email: "pedro@email.com", message: "¡Excelente servicio! Volveré pronto.", status: "new", date: new Date().toISOString(), phone: "+34 111 222 333"},
                {id: 2, name: "Laura Sánchez", email: "laura@email.com", message: "¿Tienen opciones veganas?", status: "new", date: new Date().toISOString(), phone: "+34 222 333 444"},
                {id: 3, name: "Miguel Torres", email: "miguel@email.com", message: "Felicitaciones por la nueva ubicación", status: "read", date: new Date(Date.now() - 86400000).toISOString(), phone: "+34 333 444 555"}
            ]
        };
        
        // Actualizar estadísticas del overview con animación
        if (document.getElementById('totalMenuItems')) {
            animateNumber(document.getElementById('totalMenuItems'), menuData.data.length);
        }
        
        if (document.getElementById('totalReservations')) {
            const todayReservations = reservationsData.data.filter(r => r.date === today);
            animateNumber(document.getElementById('totalReservations'), todayReservations.length);
        }
        
        if (document.getElementById('todayReservations')) {
            const todayReservations = reservationsData.data.filter(r => r.date === today);
            animateNumber(document.getElementById('todayReservations'), todayReservations.length);
        }
        
        if (document.getElementById('totalMessages')) {
            const newMessages = contactsData.data.filter(c => c.status === 'new');
            animateNumber(document.getElementById('totalMessages'), newMessages.length);
        }
        
        if (document.getElementById('monthlyRevenue')) {
            document.getElementById('monthlyRevenue').textContent = '€12,350';
        }
        
        // Cargar actividad reciente con datos estáticos
        loadRecentActivityStatic(reservationsData.data, contactsData.data);
        
        // Cargar historial de acciones
        loadActionHistoryWidget();
        
        // Obtener datos adicionales del localStorage
        const savedReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        const savedMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
        
        // Combinar datos estáticos con datos del localStorage
        const allReservations = [...reservationsData.data, ...savedReservations];
        const allContacts = [...contactsData.data, ...savedMessages];
        
        // Actualizar estadísticas con datos combinados
        if (document.getElementById('totalReservations')) {
            const todayReservations = allReservations.filter(r => r.date === today);
            animateNumber(document.getElementById('totalReservations'), todayReservations.length);
        }
        
        if (document.getElementById('totalMessages')) {
            const newMessages = allContacts.filter(c => c.status === 'new');
            animateNumber(document.getElementById('totalMessages'), newMessages.length);
        }
        
        // Almacenar datos combinados para otras funciones
        window.staticData = {
            menu: menuData.data,
            reservations: allReservations,
            contacts: allContacts
        };
        
        console.log('Dashboard cargado exitosamente con datos estáticos');
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        showToast('Error cargando datos del dashboard', 'error');
    }
}

// Función para animar números
function animateNumber(element, target) {
    let current = 0;
    const increment = target / 20;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 50);
}

async function loadDashboardData() {
    // Redirigir a la función estática
    return loadDashboardDataStatic();
}

function loadRecentActivityStatic(reservations, contacts) {
    try {
        const activityContainer = document.getElementById('recentActivity');
        if (!activityContainer) return;
        
        let activityHTML = '<h4>Actividad Reciente</h4>';
        
        // Mostrar reservas recientes (últimas 3)
        const recentReservations = reservations.slice(0, 3);
        if (recentReservations.length > 0) {
            activityHTML += '<div class="activity-section"><h5>📅 Reservas Recientes</h5><ul>';
            recentReservations.forEach(reservation => {
                activityHTML += `
                    <li class="activity-item">
                        <div class="activity-content">
                            <strong>${reservation.name}</strong> - ${formatDate(reservation.date)} ${reservation.time}
                            <br><small>${reservation.guests} personas</small>
                        </div>
                        <span class="status-badge status-${reservation.status}">${getStatusText(reservation.status)}</span>
                    </li>
                `;
            });
            activityHTML += '</ul></div>';
        }
        
        // Mostrar mensajes recientes (últimos 2)
        const recentContacts = contacts.slice(0, 2);
        if (recentContacts.length > 0) {
            activityHTML += '<div class="activity-section"><h5>💬 Mensajes Recientes</h5><ul>';
            recentContacts.forEach(contact => {
                activityHTML += `
                    <li class="activity-item">
                        <div class="activity-content">
                            <strong>${contact.name}</strong>
                            <br><small>${contact.message.substring(0, 50)}...</small>
                        </div>
                        <span class="status-badge status-${contact.status}">${contact.status === 'new' ? 'Nuevo' : 'Leído'}</span>
                    </li>
                `;
            });
            activityHTML += '</ul></div>';
        }
        
        activityContainer.innerHTML = activityHTML;
        
    } catch (error) {
        console.error('Error cargando actividad reciente:', error);
    }
}

async function loadRecentActivity() {
    // Redirigir a función estática si no hay datos globales
    if (window.staticData) {
        loadRecentActivityStatic(window.staticData.reservations, window.staticData.contacts);
    }
}

// ==========================================
// RESERVAS
// ==========================================
async function loadReservations(page = 1) {
    try {
        showLoading(true);
        
        // Cargar reservas del localStorage (las que se crean desde el sitio web)
        const savedReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        
        // Combinar con datos estáticos del sistema
        const staticReservations = window.staticData ? window.staticData.reservations : [];
        
        // Fusionar todas las reservas
        const allReservations = [...staticReservations, ...savedReservations];
        
        // Filtrar por estado si se especifica
        const statusFilter = document.getElementById('reservationStatusFilter')?.value || 'all';
        let filteredReservations = allReservations;
        
        if (statusFilter !== 'all') {
            filteredReservations = allReservations.filter(r => r.status === statusFilter);
        }
        
        // Ordenar por fecha (más recientes primero)
        filteredReservations.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
            const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
            return dateB - dateA;
        });
        
        // Simular paginación simple
        const limit = 10;
        const start = (page - 1) * limit;
        const paginatedReservations = filteredReservations.slice(start, start + limit);
        
        displayReservations(paginatedReservations);
        
        // Mostrar información de paginación simple
        const totalPages = Math.ceil(filteredReservations.length / limit);
        console.log(`Mostrando página ${page} de ${totalPages} (Total: ${filteredReservations.length} reservas)`);
        
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
        // Buscar la reserva en localStorage
        const savedReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        const reservationIndex = savedReservations.findIndex(r => r.id === id);
        
        let reservation = null;
        
        if (reservationIndex !== -1) {
            // Actualizar reserva en localStorage
            savedReservations[reservationIndex].status = status;
            savedReservations[reservationIndex].updatedAt = new Date().toISOString();
            localStorage.setItem('reservations', JSON.stringify(savedReservations));
            reservation = savedReservations[reservationIndex];
        } else {
            // Buscar en datos estáticos y crear copia para localStorage
            const staticReservations = window.staticData?.reservations || [];
            const staticReservation = staticReservations.find(r => r.id === id);
            
            if (staticReservation) {
                reservation = {
                    ...staticReservation,
                    status: status,
                    updatedAt: new Date().toISOString()
                };
                savedReservations.push(reservation);
                localStorage.setItem('reservations', JSON.stringify(savedReservations));
            }
        }
        
        if (reservation) {
            // Enviar notificación por email
            await sendReservationEmail(reservation, status);
            
            // Actualizar historial de acciones
            logReservationAction(reservation.id, status, currentUser.name);
            
            // Actualizar interfaz
            const statusText = status === 'confirmed' ? 'confirmada' : 'rechazada';
            showNotification(`Reserva ${statusText} exitosamente`, 'success');
            loadReservations();
            closeModal('reservationModal');
            
            // Actualizar estadísticas
            updateDashboardStats();
        } else {
            throw new Error('Reserva no encontrada');
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
        
        // Usar datos estáticos del menú
        const menuData = window.staticData ? window.staticData.menu : [
            {id: 1, name: "Café Americano", price: 2.50, category: "Café Caliente", available: true, description: "Café negro clásico"},
            {id: 2, name: "Cappuccino", price: 3.50, category: "Café Caliente", available: true, description: "Café con leche vaporizada"},
            {id: 3, name: "Latte Macchiato", price: 4.00, category: "Café Caliente", available: true, description: "Capas perfectas de café y leche"},
            {id: 4, name: "Café Frappé", price: 4.50, category: "Café Frío", available: true, description: "Bebida helada refrescante"},
            {id: 5, name: "Cold Brew", price: 3.80, category: "Café Frío", available: true, description: "Café extraído en frío"},
            {id: 6, name: "Tostada de Aguacate", price: 6.50, category: "Desayunos", available: true, description: "Pan tostado con aguacate fresco"},
            {id: 7, name: "Croissant de Almendra", price: 3.20, category: "Postres", available: true, description: "Croissant hojaldrado relleno"},
            {id: 8, name: "Cheesecake", price: 5.50, category: "Postres", available: true, description: "Tarta de queso cremosa"},
            {id: 9, name: "Bowl de Açaí", price: 7.80, category: "Desayunos", available: true, description: "Bowl energético con frutas"}
        ];
        
        displayMenu(menuData);
        
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
        
        // Cargar mensajes del localStorage (los que se envían desde el sitio web)
        const savedMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
        
        // Combinar con mensajes estáticos del sistema
        const staticMessages = window.staticData ? window.staticData.contacts : [];
        
        // Fusionar todos los mensajes
        const allMessages = [...staticMessages, ...savedMessages];
        
        // Filtrar por estado si se especifica
        const statusFilter = document.getElementById('contactStatusFilter')?.value || 'all';
        let filteredMessages = allMessages;
        
        if (statusFilter !== 'all') {
            filteredMessages = allMessages.filter(m => m.status === statusFilter);
        }
        
        // Ordenar por fecha (más recientes primero)
        filteredMessages.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
        
        // Simular paginación simple
        const limit = 10;
        const start = (page - 1) * limit;
        const paginatedMessages = filteredMessages.slice(start, start + limit);
        
        displayContacts(paginatedMessages);
        
        // Mostrar información de paginación simple
        const totalPages = Math.ceil(filteredMessages.length / limit);
        console.log(`Mostrando página ${page} de ${totalPages} (Total: ${filteredMessages.length} mensajes)`);
        
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
    // Sistema mock - devolver datos estáticos basados en la URL
    await new Promise(resolve => setTimeout(resolve, 300)); // Simular delay de red
    
    console.log('Mock API llamada a:', url, options);
    
    // Datos estáticos basados en la URL solicitada
    if (url.includes('/api/menu')) {
        return {
            success: true,
            data: window.staticData ? window.staticData.menu : [
                {id: 1, name: "Café Americano", price: 2.50, category: "Café Caliente", available: true, description: "Café negro clásico"},
                {id: 2, name: "Cappuccino", price: 3.50, category: "Café Caliente", available: true, description: "Café con leche vaporizada"},
                {id: 3, name: "Latte Macchiato", price: 4.00, category: "Café Caliente", available: true, description: "Capas perfectas"},
                {id: 4, name: "Café Frappé", price: 4.50, category: "Café Frío", available: true, description: "Bebida helada"},
                {id: 5, name: "Tostada de Aguacate", price: 6.50, category: "Desayunos", available: true, description: "Pan con aguacate"}
            ]
        };
    }
    
    if (url.includes('/api/reservations')) {
        // Obtener reservas del localStorage (las nuevas del sitio web)
        const savedReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        
        // Reservas estáticas por defecto
        const today = new Date().toISOString().split('T')[0];
        const staticReservations = [
            {id: 1, name: "Juan Pérez", email: "juan@email.com", date: today, time: "19:00", guests: 2, status: "confirmed", phone: "+34 666 123 456"},
            {id: 2, name: "María García", email: "maria@email.com", date: today, time: "20:30", guests: 4, status: "pending", phone: "+34 777 234 567"}
        ];
        
        // Combinar ambas fuentes de datos
        const allReservations = [...staticReservations, ...savedReservations];
        
        return {
            success: true,
            data: allReservations
        };
    }
    
    if (url.includes('/api/contact')) {
        // Obtener mensajes del localStorage (los nuevos del sitio web)
        const savedMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
        
        // Mensajes estáticos por defecto
        const staticMessages = [
            {id: 1, name: "Pedro Ruiz", email: "pedro@email.com", message: "¡Excelente servicio! Volveré pronto.", status: "new", date: new Date().toISOString(), phone: "+34 111 222 333"},
            {id: 2, name: "Laura Sánchez", email: "laura@email.com", message: "¿Tienen opciones veganas en el menú?", status: "new", date: new Date().toISOString(), phone: "+34 222 333 444"}
        ];
        
        // Combinar ambas fuentes de datos
        const allMessages = [...staticMessages, ...savedMessages];
        
        return {
            success: true,
            data: allMessages
        };
    }
    
    // Respuesta por defecto para cualquier otra API
    return {
        success: true,
        message: 'Operación completada exitosamente',
        data: {}
    };
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
    // Crear notificación toast
    console.log(`Notificación [${type}]: ${message}`);
    showToast(message, type);
}

function showToast(message, type = 'info') {
    // Crear elemento toast si no existe
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Sistema de notificaciones por email
async function sendReservationEmail(reservation, status) {
    try {
        const emailData = generateEmailTemplate(reservation, status);
        
        // Simular envió de email (en un proyecto real, aquí harías la llamada a un servicio de email)
        console.log('📧 Enviando email a:', reservation.email);
        console.log('📧 Asunto:', emailData.subject);
        console.log('📧 Contenido:', emailData.html);
        
        // Simular delay del envío
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Guardar registro del email enviado
        const emailLog = {
            id: Date.now(),
            reservationId: reservation.id,
            to: reservation.email,
            subject: emailData.subject,
            status: status,
            sentAt: new Date().toISOString(),
            success: true
        };
        
        const emailHistory = JSON.parse(localStorage.getItem('emailHistory') || '[]');
        emailHistory.push(emailLog);
        localStorage.setItem('emailHistory', JSON.stringify(emailHistory));
        
        // Mostrar preview del email enviado
        showEmailPreview(emailData, reservation.email);
        
        console.log('✅ Email enviado exitosamente');
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
        throw error;
    }
}

function generateEmailTemplate(reservation, status) {
    const isConfirmed = status === 'confirmed';
    const subject = isConfirmed 
        ? `✅ Reserva Confirmada - Café Aroma #${reservation.id}`
        : `❌ Reserva Cancelada - Café Aroma #${reservation.id}`;
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isConfirmed ? '#4CAF50' : '#f44336'}; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; }
            .button { display: inline-block; padding: 12px 24px; background: #6F4E37; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${isConfirmed ? '🎉 ¡Reserva Confirmada!' : '😔 Reserva Cancelada'}</h1>
                <p>Café Aroma - Tu lugar especial</p>
            </div>
            
            <div class="content">
                <h2>Estimado/a ${reservation.name},</h2>
                
                ${isConfirmed ? `
                <p>¡Excelentes noticias! Tu reserva ha sido <strong>confirmada</strong> exitosamente.</p>
                <p>Te esperamos con los brazos abiertos para brindarte una experiencia gastronómica inolvidable.</p>
                ` : `
                <p>Lamentamos informarte que tu reserva ha sido <strong>cancelada</strong>.</p>
                <p>Esto puede deberse a disponibilidad limitada o circunstancias imprevistas.</p>
                <p>Te invitamos a realizar una nueva reserva para otra fecha disponible.</p>
                `}
                
                <div class="details">
                    <h3>📋 Detalles de la Reserva</h3>
                    <p><strong>Número de Reserva:</strong> #${reservation.id}</p>
                    <p><strong>Fecha:</strong> ${formatDate(reservation.date)}</p>
                    <p><strong>Hora:</strong> ${reservation.time}</p>
                    <p><strong>Número de Personas:</strong> ${reservation.guests}</p>
                    <p><strong>Estado:</strong> <span style="color: ${isConfirmed ? '#4CAF50' : '#f44336'}; font-weight: bold;">${isConfirmed ? 'CONFIRMADA' : 'CANCELADA'}</span></p>
                </div>
                
                ${isConfirmed ? `
                <h3>📍 Información Importante</h3>
                <ul>
                    <li>Por favor, llega 10 minutos antes de tu hora reservada</li>
                    <li>Si necesitas cancelar, contáctanos con al menos 2 horas de anticipación</li>
                    <li>Mantén este email como comprobante de tu reserva</li>
                </ul>
                
                <p><strong>📍 Dirección:</strong> Av. Principal 123, Centro Histórico</p>
                <p><strong>📞 Teléfono:</strong> +34 900 123 456</p>
                ` : `
                <p>Si deseas realizar una nueva reserva, puedes hacerlo a través de nuestro sitio web o contactándonos directamente.</p>
                <a href="http://localhost:8000" class="button">🌐 Nueva Reserva</a>
                `}
                
                <div class="footer">
                    <p>Gracias por elegir <strong>Café Aroma</strong></p>
                    <p>💌 Este email fue enviado automáticamente el ${new Date().toLocaleString('es-ES')}</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;
    
    return { subject, html };
}

function showEmailPreview(emailData, recipient) {
    // Crear modal para mostrar preview del email
    const modal = document.createElement('div');
    modal.className = 'email-preview-modal';
    modal.innerHTML = `
        <div class="email-preview-content">
            <div class="email-preview-header">
                <h3>📧 Email Enviado</h3>
                <button onclick="this.closest('.email-preview-modal').remove()" class="close-btn">&times;</button>
            </div>
            <div class="email-info">
                <p><strong>Para:</strong> ${recipient}</p>
                <p><strong>Asunto:</strong> ${emailData.subject}</p>
                <p><strong>Enviado:</strong> ${new Date().toLocaleString('es-ES')}</p>
            </div>
            <div class="email-preview-body">
                <iframe srcdoc="${emailData.html.replace(/"/g, '&quot;')}" style="width: 100%; height: 400px; border: 1px solid #ddd; border-radius: 5px;"></iframe>
            </div>
            <div class="email-preview-actions">
                <button onclick="this.closest('.email-preview-modal').remove()" class="btn btn-primary">Cerrar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 10000);
}

// Historial de acciones de reservas
function logReservationAction(reservationId, action, adminName) {
    try {
        const actionLog = {
            id: Date.now(),
            reservationId: reservationId,
            action: action,
            adminName: adminName,
            timestamp: new Date().toISOString(),
            description: `Reserva ${action === 'confirmed' ? 'confirmada' : 'rechazada'} por ${adminName}`
        };
        
        const actionHistory = JSON.parse(localStorage.getItem('reservationActions') || '[]');
        actionHistory.push(actionLog);
        localStorage.setItem('reservationActions', JSON.stringify(actionHistory));
        
        console.log('📝 Acción registrada:', actionLog);
        
    } catch (error) {
        console.error('Error registrando acción:', error);
    }
}

// Función para actualizar estadísticas en tiempo real
function updateDashboardStats() {
    try {
        const savedReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        const savedMessages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
        
        // Obtener datos estáticos si existen
        const staticReservations = window.staticData?.reservations || [];
        const staticMessages = window.staticData?.contacts || [];
        
        // Combinar datos
        const allReservations = [...staticReservations, ...savedReservations];
        const allMessages = [...staticMessages, ...savedMessages];
        
        const today = new Date().toISOString().split('T')[0];
        
        // Actualizar contadores si los elementos existen
        const todayReservations = allReservations.filter(r => r.date === today);
        const newMessages = allMessages.filter(m => m.status === 'new');
        
        // Actualizar contadores por estado de reserva
        const confirmedReservations = allReservations.filter(r => r.status === 'confirmed');
        const pendingReservations = allReservations.filter(r => r.status === 'pending');
        const cancelledReservations = allReservations.filter(r => r.status === 'cancelled');
        
        if (document.getElementById('totalReservations')) {
            document.getElementById('totalReservations').textContent = todayReservations.length;
        }
        
        if (document.getElementById('todayReservations')) {
            document.getElementById('todayReservations').textContent = todayReservations.length;
        }
        
        if (document.getElementById('totalMessages')) {
            document.getElementById('totalMessages').textContent = newMessages.length;
        }
        
        // Actualizar estadísticas de reservas
        if (document.getElementById('confirmedReservations')) {
            document.getElementById('confirmedReservations').textContent = confirmedReservations.length;
        }
        
        if (document.getElementById('pendingReservations')) {
            document.getElementById('pendingReservations').textContent = pendingReservations.length;
        }
        
        if (document.getElementById('cancelledReservations')) {
            document.getElementById('cancelledReservations').textContent = cancelledReservations.length;
        }
        
        console.log(`Estadísticas actualizadas: ${todayReservations.length} reservas hoy, ${newMessages.length} mensajes nuevos`);
        
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

// Widget de historial de acciones
function loadActionHistoryWidget() {
    try {
        const actionHistory = JSON.parse(localStorage.getItem('reservationActions') || '[]');
        const emailHistory = JSON.parse(localStorage.getItem('emailHistory') || '[]');
        
        // Combinar y ordenar por fecha más reciente
        const allActions = [
            ...actionHistory.map(action => ({
                ...action,
                type: 'reservation',
                icon: action.action === 'confirmed' ? 'fa-check-circle' : 'fa-times-circle',
                color: action.action === 'confirmed' ? '#4CAF50' : '#F44336'
            })),
            ...emailHistory.map(email => ({
                ...email,
                type: 'email',
                icon: 'fa-envelope',
                color: '#2196F3',
                description: `Email ${email.status === 'confirmed' ? 'de confirmación' : 'de cancelación'} enviado a ${email.to}`,
                timestamp: email.sentAt
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Mostrar últimas 5 acciones
        const recentActions = allActions.slice(0, 5);
        
        const actionsContainer = document.getElementById('recentActionsWidget');
        if (actionsContainer) {
            if (recentActions.length === 0) {
                actionsContainer.innerHTML = `
                    <div class="no-actions">
                        <i class="fas fa-history"></i>
                        <p>No hay acciones recientes</p>
                    </div>
                `;
            } else {
                actionsContainer.innerHTML = recentActions.map(action => `
                    <div class="action-item">
                        <div class="action-icon" style="color: ${action.color}">
                            <i class="fas ${action.icon}"></i>
                        </div>
                        <div class="action-details">
                            <p class="action-description">${action.description}</p>
                            <small class="action-time">${formatTimeAgo(action.timestamp)}</small>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        console.log(`📋 Cargadas ${recentActions.length} acciones recientes`);
        
    } catch (error) {
        console.error('Error cargando historial de acciones:', error);
    }
}

// Función para formatear tiempo relativo
function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Hace unos segundos';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
}

// Funciones auxiliares para fechas y estado
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getStatusText(status) {
    const statusMap = {
        'confirmed': 'Confirmada',
        'pending': 'Pendiente',
        'cancelled': 'Cancelada',
        'completed': 'Completada',
        'new': 'Nuevo',
        'read': 'Leído',
        'replied': 'Respondido'
    };
    return statusMap[status] || status;
}

function isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

function showNotificationBak(message, type = 'info', duration = 5000) {
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