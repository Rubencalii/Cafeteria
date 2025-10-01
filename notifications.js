// Sistema de Notificaciones en Tiempo Real
// Usando WebSockets para comunicación bidireccional

class NotificationSystem {
    constructor() {
        this.ws = null;
        this.reconnectInterval = 5000;
        this.maxReconnectAttempts = 5;
        this.reconnectAttempts = 0;
        this.eventHandlers = new Map();
        
        this.connect();
    }
    
    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('🔌 WebSocket conectado');
                this.reconnectAttempts = 0;
                
                // Autenticar la conexión
                if (authToken) {
                    this.send('authenticate', { token: authToken });
                }
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Error procesando mensaje WebSocket:', error);
                }
            };
            
            this.ws.onclose = () => {
                console.log('🔌 WebSocket desconectado');
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('Error en WebSocket:', error);
            };
            
        } catch (error) {
            console.error('Error conectando WebSocket:', error);
            this.attemptReconnect();
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reintentando conexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        }
    }
    
    send(type, data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, data }));
        }
    }
    
    handleMessage(message) {
        const { type, data } = message;
        
        switch (type) {
            case 'order_created':
                this.handleOrderCreated(data);
                break;
            case 'order_updated':
                this.handleOrderUpdated(data);
                break;
            case 'reservation_created':
                this.handleReservationCreated(data);
                break;
            case 'employee_clock':
                this.handleEmployeeClock(data);
                break;
            case 'table_ready':
                this.handleTableReady(data);
                break;
            default:
                console.log('Mensaje no manejado:', type, data);
        }
        
        // Ejecutar handlers personalizados
        if (this.eventHandlers.has(type)) {
            this.eventHandlers.get(type).forEach(handler => handler(data));
        }
    }
    
    // Handlers específicos
    handleOrderCreated(order) {
        showNotification(`🆕 Nuevo pedido #${order.id} - Mesa ${order.table_number}`, 'info');
        
        // Actualizar interfaces si están activas
        if (document.getElementById('ordersSection')?.classList.contains('active')) {
            loadOrdersSection();
        }
        if (document.getElementById('kitchenSection')?.classList.contains('active')) {
            loadKitchenOrders();
        }
    }
    
    handleOrderUpdated(order) {
        showNotification(`🔄 Pedido #${order.id} actualizado: ${getOrderStatusText(order.status)}`, 'info');
        
        // Actualizar interfaces
        if (document.getElementById('ordersSection')?.classList.contains('active')) {
            loadOrdersSection();
        }
        if (document.getElementById('kitchenSection')?.classList.contains('active')) {
            loadKitchenOrders();
        }
    }
    
    handleReservationCreated(reservation) {
        showNotification(`📅 Nueva reserva: ${reservation.name} - ${formatDate(reservation.date)}`, 'info');
        
        if (document.getElementById('reservationsSection')?.classList.contains('active')) {
            loadReservations();
        }
    }
    
    handleEmployeeClock(data) {
        const action = data.entry_type === 'clock_in' ? 'Fichó entrada' : 
                      data.entry_type === 'clock_out' ? 'Fichó salida' : 
                      data.entry_type === 'break_start' ? 'Inició descanso' : 'Terminó descanso';
        
        showNotification(`👤 ${data.employee_name}: ${action}`, 'info');
        
        if (document.getElementById('employeesSection')?.classList.contains('active')) {
            loadEmployeeTimeEntries();
        }
    }
    
    handleTableReady(data) {
        showNotification(`💰 Mesa ${data.tableNumber} lista para cobrar`, 'success');
        
        if (document.getElementById('ordersSection')?.classList.contains('active')) {
            loadActiveTablesOverview();
        }
    }
    
    // API pública
    on(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(handler);
    }
    
    off(eventType, handler) {
        if (this.eventHandlers.has(eventType)) {
            const handlers = this.eventHandlers.get(eventType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Instancia global del sistema de notificaciones
let notificationSystem = null;

// Inicializar cuando el usuario esté autenticado
function initializeNotifications() {
    if (currentUser && authToken && !notificationSystem) {
        notificationSystem = new NotificationSystem();
        console.log('🔔 Sistema de notificaciones iniciado');
    }
}

// Limpiar al cerrar sesión
function cleanupNotifications() {
    if (notificationSystem) {
        notificationSystem.disconnect();
        notificationSystem = null;
        console.log('🔔 Sistema de notificaciones desconectado');
    }
}