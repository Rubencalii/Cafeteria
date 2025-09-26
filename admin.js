// Estado de la aplicación
let currentUser = null;
let currentSection = 'dashboard';
let currentPage = 1;

// Configuración de API
const API_BASE = '';
const TOKEN_KEY = 'cafe_aroma_token';

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Inicializar aplicación
function initializeApp() {
    // Verificar si hay token guardado
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        verifyToken(token);
    } else {
        showLogin();
    }

    // Event listeners
    setupEventListeners();
}

// Configurar event listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const credentials = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Estado de carga
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
    submitBtn.disabled = true;
    hideError();
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Guardar token y datos de usuario
            localStorage.setItem(TOKEN_KEY, result.data.token);
            currentUser = result.data.user;
            
            // Mostrar dashboard
            showDashboard();
        } else {
            throw new Error(result.message || 'Error de autenticación');
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showError(error.message || 'Error al iniciar sesión');
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Verificar token
async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE}/api/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.data.user;
            showDashboard();
        } else {
            localStorage.removeItem(TOKEN_KEY);
            showLogin();
        }
        
    } catch (error) {
        console.error('Error verificando token:', error);
        localStorage.removeItem(TOKEN_KEY);
        showLogin();
    }
}

// Manejar logout
function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    currentUser = null;
    showLogin();
}

// Mostrar login
function showLogin() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('admin-container').style.display = 'none';
}

// Mostrar dashboard
function showDashboard() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-container').style.display = 'block';
    
    // Actualizar información del usuario
    document.getElementById('username-display').textContent = currentUser.username;
    
    // Cargar dashboard
    loadDashboard();
}

// Manejar navegación
function handleNavigation(e) {
    e.preventDefault();
    const section = e.target.getAttribute('href').substring(1);
    showSection(section);
}

// Mostrar sección
function showSection(sectionName) {
    // Actualizar navegación activa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionName}`) {
            link.classList.add('active');
        }
    });
    
    // Mostrar sección correspondiente
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionName).classList.add('active');
    currentSection = sectionName;
    
    // Cargar datos según la sección
    switch (sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'reservations':
            loadReservations();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'menu':
            loadMenu();
            break;
    }
}

// Cargar dashboard
async function loadDashboard() {
    try {
        // Cargar estadísticas de reservas
        const reservationsResponse = await makeAuthenticatedRequest('/api/reservations/stats');
        if (reservationsResponse.success) {
            const stats = reservationsResponse.data;
            document.getElementById('total-reservations').textContent = stats.total || 0;
            document.getElementById('pending-reservations').textContent = stats.pending || 0;
        }
        
        // Cargar estadísticas de mensajes
        const contactsResponse = await makeAuthenticatedRequest('/api/contact/stats');
        if (contactsResponse.success) {
            const stats = contactsResponse.data;
            document.getElementById('total-messages').textContent = stats.total || 0;
            document.getElementById('unread-messages').textContent = stats.unread || 0;
        }
        
    } catch (error) {
        console.error('Error cargando dashboard:', error);
    }
}

// Cargar reservas
async function loadReservations(page = 1) {
    const loading = document.getElementById('reservations-loading');
    const content = document.getElementById('reservations-content');
    
    loading.style.display = 'block';
    content.style.display = 'none';
    
    try {
        const response = await makeAuthenticatedRequest(`/api/reservations?page=${page}&limit=10`);
        
        if (response.success) {
            const { reservations, pagination } = response.data;
            
            // Mostrar reservas en tabla
            const tableBody = document.getElementById('reservations-table');
            tableBody.innerHTML = '';
            
            reservations.forEach(reservation => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${reservation.name}</td>
                    <td>${reservation.email}</td>
                    <td>${reservation.phone}</td>
                    <td>${new Date(reservation.date).toLocaleDateString('es-ES')}</td>
                    <td>${reservation.time}</td>
                    <td>${reservation.guests}</td>
                    <td><span class="status ${reservation.status}">${getStatusText(reservation.status)}</span></td>
                    <td>
                        <div class="btn-group">
                            ${reservation.status === 'pending' ? `
                                <button class="btn btn-success btn-sm" onclick="updateReservationStatus(${reservation.id}, 'confirmed')">
                                    <i class="fas fa-check"></i> Confirmar
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="updateReservationStatus(${reservation.id}, 'cancelled')">
                                    <i class="fas fa-times"></i> Cancelar
                                </button>
                            ` : ''}
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            // Mostrar paginación
            showPagination('reservations-pagination', pagination, loadReservations);
            
            loading.style.display = 'none';
            content.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error cargando reservas:', error);
        loading.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error cargando reservas';
    }
}

// Cargar mensajes de contacto
async function loadContacts(page = 1) {
    const loading = document.getElementById('contacts-loading');
    const content = document.getElementById('contacts-content');
    
    loading.style.display = 'block';
    content.style.display = 'none';
    
    try {
        const response = await makeAuthenticatedRequest(`/api/contact?page=${page}&limit=10`);
        
        if (response.success) {
            const { contacts, pagination } = response.data;
            
            // Mostrar mensajes en tabla
            const tableBody = document.getElementById('contacts-table');
            tableBody.innerHTML = '';
            
            contacts.forEach(contact => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${contact.name}</td>
                    <td>${contact.email}</td>
                    <td>${contact.subject}</td>
                    <td><div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${contact.message}</div></td>
                    <td><span class="status ${contact.status}">${getContactStatusText(contact.status)}</span></td>
                    <td>${new Date(contact.created_at).toLocaleDateString('es-ES')}</td>
                    <td>
                        <div class="btn-group">
                            ${contact.status === 'unread' ? `
                                <button class="btn btn-info btn-sm" onclick="updateContactStatus(${contact.id}, 'read')">
                                    <i class="fas fa-eye"></i> Marcar Leído
                                </button>
                            ` : ''}
                            <button class="btn btn-warning btn-sm" onclick="updateContactStatus(${contact.id}, 'replied')">
                                <i class="fas fa-reply"></i> Responder
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            // Mostrar paginación
            showPagination('contacts-pagination', pagination, loadContacts);
            
            loading.style.display = 'none';
            content.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error cargando mensajes:', error);
        loading.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error cargando mensajes';
    }
}

// Cargar menú
async function loadMenu() {
    const loading = document.getElementById('menu-loading');
    const content = document.getElementById('menu-content');
    
    loading.style.display = 'block';
    content.style.display = 'none';
    
    try {
        const response = await makeAuthenticatedRequest('/api/menu/admin');
        
        if (response.success) {
            const items = response.data;
            
            // Mostrar elementos del menú en tabla
            const tableBody = document.getElementById('menu-table');
            tableBody.innerHTML = '';
            
            items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td><div style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${item.description}</div></td>
                    <td>€${item.price.toFixed(2)}</td>
                    <td>${item.category}</td>
                    <td>
                        <span class="status ${item.available ? 'confirmed' : 'cancelled'}">
                            ${item.available ? 'Disponible' : 'No Disponible'}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-warning btn-sm" onclick="toggleMenuItemAvailability(${item.id})">
                                <i class="fas fa-toggle-${item.available ? 'on' : 'off'}"></i> 
                                ${item.available ? 'Deshabilitar' : 'Habilitar'}
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteMenuItem(${item.id})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            loading.style.display = 'none';
            content.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error cargando menú:', error);
        loading.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error cargando menú';
    }
}

// Actualizar estado de reserva
async function updateReservationStatus(id, status) {
    try {
        const response = await makeAuthenticatedRequest(`/api/reservations/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        
        if (response.success) {
            // Recargar reservas
            loadReservations(currentPage);
            // Actualizar dashboard si es necesario
            if (currentSection === 'dashboard') {
                loadDashboard();
            }
        } else {
            alert('Error actualizando reserva: ' + response.message);
        }
        
    } catch (error) {
        console.error('Error actualizando reserva:', error);
        alert('Error actualizando reserva');
    }
}

// Actualizar estado de mensaje
async function updateContactStatus(id, status) {
    try {
        const response = await makeAuthenticatedRequest(`/api/contact/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        
        if (response.success) {
            // Recargar mensajes
            loadContacts(currentPage);
            // Actualizar dashboard si es necesario
            if (currentSection === 'dashboard') {
                loadDashboard();
            }
        } else {
            alert('Error actualizando mensaje: ' + response.message);
        }
        
    } catch (error) {
        console.error('Error actualizando mensaje:', error);
        alert('Error actualizando mensaje');
    }
}

// Alternar disponibilidad de elemento del menú
async function toggleMenuItemAvailability(id) {
    try {
        const response = await makeAuthenticatedRequest(`/api/menu/${id}/availability`, {
            method: 'PATCH'
        });
        
        if (response.success) {
            // Recargar menú
            loadMenu();
        } else {
            alert('Error actualizando elemento: ' + response.message);
        }
        
    } catch (error) {
        console.error('Error actualizando elemento:', error);
        alert('Error actualizando elemento');
    }
}

// Eliminar elemento del menú
async function deleteMenuItem(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este elemento del menú?')) {
        return;
    }
    
    try {
        const response = await makeAuthenticatedRequest(`/api/menu/${id}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            // Recargar menú
            loadMenu();
        } else {
            alert('Error eliminando elemento: ' + response.message);
        }
        
    } catch (error) {
        console.error('Error eliminando elemento:', error);
        alert('Error eliminando elemento');
    }
}

// Mostrar paginación
function showPagination(containerId, pagination, loadFunction) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (pagination.pages <= 1) return;
    
    // Botón anterior
    if (pagination.page > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Anterior';
        prevBtn.onclick = () => loadFunction(pagination.page - 1);
        container.appendChild(prevBtn);
    }
    
    // Números de página
    for (let i = 1; i <= pagination.pages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.className = i === pagination.page ? 'active' : '';
        pageBtn.onclick = () => loadFunction(i);
        container.appendChild(pageBtn);
    }
    
    // Botón siguiente
    if (pagination.page < pagination.pages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Siguiente →';
        nextBtn.onclick = () => loadFunction(pagination.page + 1);
        container.appendChild(nextBtn);
    }
}

// Realizar petición autenticada
async function makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
        throw new Error('No hay token de autenticación');
    }
    
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    if (finalOptions.headers) {
        finalOptions.headers = { ...defaultOptions.headers, ...finalOptions.headers };
    }
    
    const response = await fetch(`${API_BASE}${url}`, finalOptions);
    const result = await response.json();
    
    // Si el token ha expirado, hacer logout
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem(TOKEN_KEY);
        showLogin();
        throw new Error('Sesión expirada');
    }
    
    return result;
}

// Obtener texto de estado de reserva
function getStatusText(status) {
    const statusTexts = {
        'pending': 'Pendiente',
        'confirmed': 'Confirmada',
        'cancelled': 'Cancelada'
    };
    return statusTexts[status] || status;
}

// Obtener texto de estado de mensaje
function getContactStatusText(status) {
    const statusTexts = {
        'unread': 'Sin leer',
        'read': 'Leído',
        'replied': 'Respondido'
    };
    return statusTexts[status] || status;
}

// Mostrar error
function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Ocultar error
function hideError() {
    const errorElement = document.getElementById('error-message');
    errorElement.style.display = 'none';
}