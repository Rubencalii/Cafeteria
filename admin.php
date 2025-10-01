<?php
// Inicializar sesión
session_start();

// Incluir configuración
require_once 'php/config/config.php';

// Verificar si el usuario está autenticado
$auth = new Auth();
$isAuthenticated = $auth->isAuthenticated();
$currentUser = $isAuthenticated ? $auth->getCurrentUser() : null;
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - Café Aroma</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        /* Estilos adicionales para el panel de administración */
        .admin-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .admin-header {
            background: linear-gradient(135deg, #8B4513, #A0522D);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .admin-nav {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
        }
        
        .admin-nav-btn {
            background: #8B4513;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
        }
        
        .admin-nav-btn:hover,
        .admin-nav-btn.active {
            background: #654321;
            transform: translateY(-2px);
        }
        
        .admin-section {
            display: none;
            background: white;
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .admin-section.active {
            display: block;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 1.5rem;
            border-radius: 10px;
            text-align: center;
            border-left: 4px solid #8B4513;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #8B4513;
            display: block;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }
        
        .data-table th,
        .data-table td {
            text-align: left;
            padding: 0.75rem;
            border-bottom: 1px solid #dee2e6;
        }
        
        .data-table th {
            background-color: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        
        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .status-pending {
            background-color: #fff3cd;
            color: #856404;
        }
        
        .status-confirmed {
            background-color: #d4edda;
            color: #155724;
        }
        
        .status-cancelled {
            background-color: #f8d7da;
            color: #721c24;
        }
        
        .status-unread {
            background-color: #e2e3e5;
            color: #383d41;
        }
        
        .status-read {
            background-color: #d1ecf1;
            color: #0c5460;
        }
        
        .action-btn {
            background: none;
            border: 1px solid #8B4513;
            color: #8B4513;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            margin: 0 0.25rem;
            transition: all 0.3s ease;
        }
        
        .action-btn:hover {
            background: #8B4513;
            color: white;
        }
        
        .login-form {
            max-width: 400px;
            margin: 2rem auto;
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .form-group {
            margin-bottom: 1rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #333;
        }
        
        .form-group input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #8B4513;
            box-shadow: 0 0 0 2px rgba(139, 69, 19, 0.2);
        }
        
        .btn {
            background: #8B4513;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
            width: 100%;
        }
        
        .btn:hover {
            background: #654321;
            transform: translateY(-2px);
        }
        
        .logout-btn {
            background: #dc3545;
            margin-left: 1rem;
            width: auto;
        }
        
        .logout-btn:hover {
            background: #c82333;
        }
        
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border: 1px solid #f5c6cb;
        }
        
        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            border: 1px solid #c3e6cb;
        }
    </style>
</head>
<body>
    <div class="admin-container">
        <?php if ($isAuthenticated): ?>
            <!-- Panel de Administración -->
            <div class="admin-header">
                <h1><i class="fas fa-coffee"></i> Panel de Administración - Café Aroma</h1>
                <p>Bienvenido, <?= htmlspecialchars($currentUser['username']) ?></p>
                <button class="btn logout-btn" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                </button>
            </div>
            
            <nav class="admin-nav">
                <button class="admin-nav-btn active" onclick="showSection('dashboard')">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </button>
                <button class="admin-nav-btn" onclick="showSection('reservations')">
                    <i class="fas fa-calendar-alt"></i> Reservas
                </button>
                <button class="admin-nav-btn" onclick="showSection('contacts')">
                    <i class="fas fa-envelope"></i> Mensajes
                </button>
                <button class="admin-nav-btn" onclick="showSection('menu')">
                    <i class="fas fa-utensils"></i> Menú
                </button>
            </nav>
            
            <!-- Dashboard Section -->
            <section id="dashboard" class="admin-section active">
                <h2><i class="fas fa-chart-bar"></i> Resumen General</h2>
                <div class="stats-grid" id="dashboardStats">
                    <!-- Las estadísticas se cargarán dinámicamente -->
                </div>
                
                <h3>Actividad Reciente</h3>
                <div id="recentActivity">
                    <!-- La actividad reciente se cargará dinámicamente -->
                </div>
            </section>
            
            <!-- Reservations Section -->
            <section id="reservations" class="admin-section">
                <h2><i class="fas fa-calendar-alt"></i> Gestión de Reservas</h2>
                
                <div class="section-controls">
                    <button class="admin-nav-btn" onclick="loadReservations('all')">Todas</button>
                    <button class="admin-nav-btn" onclick="loadReservations('pending')">Pendientes</button>
                    <button class="admin-nav-btn" onclick="loadReservations('confirmed')">Confirmadas</button>
                    <button class="admin-nav-btn" onclick="loadReservations('cancelled')">Canceladas</button>
                </div>
                
                <div id="reservationsTable">
                    <!-- La tabla de reservas se cargará dinámicamente -->
                </div>
            </section>
            
            <!-- Contacts Section -->
            <section id="contacts" class="admin-section">
                <h2><i class="fas fa-envelope"></i> Mensajes de Contacto</h2>
                
                <div class="section-controls">
                    <button class="admin-nav-btn" onclick="loadContacts('all')">Todos</button>
                    <button class="admin-nav-btn" onclick="loadContacts('unread')">No leídos</button>
                    <button class="admin-nav-btn" onclick="loadContacts('read')">Leídos</button>
                    <button class="admin-nav-btn" onclick="loadContacts('replied')">Respondidos</button>
                </div>
                
                <div id="contactsTable">
                    <!-- La tabla de contactos se cargará dinámicamente -->
                </div>
            </section>
            
            <!-- Menu Section -->
            <section id="menu" class="admin-section">
                <h2><i class="fas fa-utensils"></i> Gestión del Menú</h2>
                
                <div class="section-controls">
                    <button class="btn" onclick="showAddMenuItem()">
                        <i class="fas fa-plus"></i> Agregar Elemento
                    </button>
                </div>
                
                <div id="menuTable">
                    <!-- La tabla del menú se cargará dinámicamente -->
                </div>
                
                <!-- Modal para agregar/editar elemento del menú -->
                <div id="menuItemModal" style="display: none;">
                    <div class="modal-content">
                        <h3 id="menuItemModalTitle">Agregar Elemento del Menú</h3>
                        <form id="menuItemForm">
                            <div class="form-group">
                                <label for="itemName">Nombre</label>
                                <input type="text" id="itemName" name="name" required>
                            </div>
                            <div class="form-group">
                                <label for="itemDescription">Descripción</label>
                                <textarea id="itemDescription" name="description" required></textarea>
                            </div>
                            <div class="form-group">
                                <label for="itemPrice">Precio</label>
                                <input type="number" id="itemPrice" name="price" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label for="itemCategory">Categoría</label>
                                <select id="itemCategory" name="category" required>
                                    <option value="Café Caliente">Café Caliente</option>
                                    <option value="Café Frío">Café Frío</option>
                                    <option value="Postres">Postres</option>
                                    <option value="Desayunos">Desayunos</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="itemImage">URL de Imagen</label>
                                <input type="url" id="itemImage" name="image">
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="itemAvailable" name="available" checked>
                                    Disponible
                                </label>
                            </div>
                            <button type="submit" class="btn">Guardar</button>
                            <button type="button" class="btn" onclick="hideMenuItemModal()">Cancelar</button>
                        </form>
                    </div>
                </div>
            </section>
            
        <?php else: ?>
            <!-- Formulario de Login -->
            <div class="admin-header">
                <h1><i class="fas fa-coffee"></i> Café Aroma</h1>
                <p>Panel de Administración</p>
            </div>
            
            <form class="login-form" id="loginForm">
                <h2>Iniciar Sesión</h2>
                <div id="loginMessage"></div>
                
                <div class="form-group">
                    <label for="username">Usuario o Email</label>
                    <input type="text" id="username" name="username" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="btn">
                    <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                </button>
                
                <div style="margin-top: 1rem; text-align: center; font-size: 0.9rem; color: #666;">
                    <p>Credenciales por defecto:</p>
                    <p><strong>Usuario:</strong> admin</p>
                    <p><strong>Contraseña:</strong> admin123</p>
                </div>
            </form>
        <?php endif; ?>
    </div>

    <script>
        // Configuración de la API para PHP
        const API_BASE_URL = '/api';
        
        // Variable global para indicar que estamos usando PHP
        window.USE_PHP_API = true;
        
        // Estado de autenticación
        const isAuthenticated = <?= json_encode($isAuthenticated) ?>;
        
        <?php if ($isAuthenticated): ?>
        // Código JavaScript para el panel de administración
        document.addEventListener('DOMContentLoaded', function() {
            loadDashboard();
        });
        
        function showSection(sectionId) {
            // Ocultar todas las secciones
            document.querySelectorAll('.admin-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Desactivar todos los botones de navegación
            document.querySelectorAll('.admin-nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Mostrar la sección seleccionada
            document.getElementById(sectionId).classList.add('active');
            
            // Activar el botón correspondiente
            event.target.classList.add('active');
            
            // Cargar datos específicos de la sección
            switch(sectionId) {
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
        
        async function loadDashboard() {
            try {
                // Cargar estadísticas de reservas
                const reservationsResponse = await fetch('/api/reservations?stats=true');
                const reservationsStats = await reservationsResponse.json();
                
                // Cargar estadísticas de contactos
                const contactsResponse = await fetch('/api/contact?stats=true');
                const contactsStats = await contactsResponse.json();
                
                // Cargar estadísticas del menú
                const menuResponse = await fetch('/api/menu?stats=true');
                const menuStats = await menuResponse.json();
                
                // Mostrar estadísticas
                const statsHtml = `
                    <div class="stat-card">
                        <span class="stat-number">${reservationsStats.data?.total || 0}</span>
                        <span class="stat-label">Total Reservas</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${reservationsStats.data?.today || 0}</span>
                        <span class="stat-label">Reservas Hoy</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${contactsStats.data?.unread || 0}</span>
                        <span class="stat-label">Mensajes Pendientes</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${menuStats.data?.available || 0}</span>
                        <span class="stat-label">Elementos Disponibles</span>
                    </div>
                `;
                
                document.getElementById('dashboardStats').innerHTML = statsHtml;
                
            } catch (error) {
                console.error('Error cargando dashboard:', error);
                showMessage('Error cargando estadísticas', 'error');
            }
        }
        
        async function loadReservations(status = 'all') {
            try {
                const response = await fetch(`/api/reservations?status=${status}&limit=50`);
                const data = await response.json();
                
                if (data.success) {
                    const reservations = data.data.reservations;
                    let tableHtml = `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Comensales</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    reservations.forEach(reservation => {
                        tableHtml += `
                            <tr>
                                <td>${reservation.id}</td>
                                <td>${reservation.name}</td>
                                <td>${reservation.email}</td>
                                <td>${reservation.date}</td>
                                <td>${reservation.time}</td>
                                <td>${reservation.guests}</td>
                                <td><span class="status-badge status-${reservation.status}">${reservation.status}</span></td>
                                <td>
                                    <button class="action-btn" onclick="updateReservationStatus(${reservation.id}, 'confirmed')">Confirmar</button>
                                    <button class="action-btn" onclick="updateReservationStatus(${reservation.id}, 'cancelled')">Cancelar</button>
                                </td>
                            </tr>
                        `;
                    });
                    
                    tableHtml += '</tbody></table>';
                    document.getElementById('reservationsTable').innerHTML = tableHtml;
                } else {
                    showMessage(data.message, 'error');
                }
            } catch (error) {
                console.error('Error cargando reservas:', error);
                showMessage('Error cargando reservas', 'error');
            }
        }
        
        async function loadContacts(status = 'all') {
            try {
                const response = await fetch(`/api/contact?status=${status}&limit=50`);
                const data = await response.json();
                
                if (data.success) {
                    const contacts = data.data.contacts;
                    let tableHtml = `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Asunto</th>
                                    <th>Fecha</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    contacts.forEach(contact => {
                        tableHtml += `
                            <tr>
                                <td>${contact.id}</td>
                                <td>${contact.name}</td>
                                <td>${contact.email}</td>
                                <td>${contact.subject}</td>
                                <td>${new Date(contact.created_at).toLocaleDateString()}</td>
                                <td><span class="status-badge status-${contact.status}">${contact.status}</span></td>
                                <td>
                                    <button class="action-btn" onclick="updateContactStatus(${contact.id}, 'read')">Marcar Leído</button>
                                    <button class="action-btn" onclick="updateContactStatus(${contact.id}, 'replied')">Respondido</button>
                                </td>
                            </tr>
                        `;
                    });
                    
                    tableHtml += '</tbody></table>';
                    document.getElementById('contactsTable').innerHTML = tableHtml;
                } else {
                    showMessage(data.message, 'error');
                }
            } catch (error) {
                console.error('Error cargando contactos:', error);
                showMessage('Error cargando contactos', 'error');
            }
        }
        
        async function loadMenu() {
            try {
                const response = await fetch('/api/menu?admin=true');
                const data = await response.json();
                
                if (data.success) {
                    const menuItems = data.data.items;
                    let tableHtml = `
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Categoría</th>
                                    <th>Precio</th>
                                    <th>Disponible</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;
                    
                    menuItems.forEach(item => {
                        tableHtml += `
                            <tr>
                                <td>${item.id}</td>
                                <td>${item.name}</td>
                                <td>${item.category}</td>
                                <td>$${item.price}</td>
                                <td><span class="status-badge ${item.available ? 'status-confirmed' : 'status-cancelled'}">${item.available ? 'Sí' : 'No'}</span></td>
                                <td>
                                    <button class="action-btn" onclick="editMenuItem(${item.id})">Editar</button>
                                    <button class="action-btn" onclick="toggleMenuItemAvailability(${item.id}, ${!item.available})">${item.available ? 'Desactivar' : 'Activar'}</button>
                                </td>
                            </tr>
                        `;
                    });
                    
                    tableHtml += '</tbody></table>';
                    document.getElementById('menuTable').innerHTML = tableHtml;
                } else {
                    showMessage(data.message, 'error');
                }
            } catch (error) {
                console.error('Error cargando menú:', error);
                showMessage('Error cargando menú', 'error');
            }
        }
        
        async function updateReservationStatus(id, status) {
            try {
                const response = await fetch(`/api/reservations/${id}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage('Estado actualizado correctamente', 'success');
                    loadReservations();
                } else {
                    showMessage(data.message, 'error');
                }
            } catch (error) {
                console.error('Error actualizando estado:', error);
                showMessage('Error actualizando estado', 'error');
            }
        }
        
        async function updateContactStatus(id, status) {
            try {
                const response = await fetch(`/api/contact/${id}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage('Estado actualizado correctamente', 'success');
                    loadContacts();
                } else {
                    showMessage(data.message, 'error');
                }
            } catch (error) {
                console.error('Error actualizando estado:', error);
                showMessage('Error actualizando estado', 'error');
            }
        }
        
        async function toggleMenuItemAvailability(id, available) {
            try {
                const response = await fetch(`/api/menu/${id}/availability`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ available })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showMessage('Disponibilidad actualizada correctamente', 'success');
                    loadMenu();
                } else {
                    showMessage(data.message, 'error');
                }
            } catch (error) {
                console.error('Error actualizando disponibilidad:', error);
                showMessage('Error actualizando disponibilidad', 'error');
            }
        }
        
        async function logout() {
            try {
                const response = await fetch('/api/auth', {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.location.reload();
                } else {
                    showMessage('Error cerrando sesión', 'error');
                }
            } catch (error) {
                console.error('Error en logout:', error);
                showMessage('Error cerrando sesión', 'error');
            }
        }
        
        function showMessage(message, type) {
            // Implementar sistema de mensajes
            console.log(`${type}: ${message}`);
        }
        
        <?php else: ?>
        // Código JavaScript para el formulario de login
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const loginData = {
                username: formData.get('username'),
                password: formData.get('password')
            };
            
            try {
                const response = await fetch('/api/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    window.location.reload();
                } else {
                    document.getElementById('loginMessage').innerHTML = 
                        `<div class="error-message">${data.message}</div>`;
                }
            } catch (error) {
                console.error('Error en login:', error);
                document.getElementById('loginMessage').innerHTML = 
                    '<div class="error-message">Error de conexión. Intenta nuevamente.</div>';
            }
        });
        <?php endif; ?>
    </script>
</body>
</html>