// WebSocket Server para Notificaciones en Tiempo Real
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class NotificationServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ 
            server,
            path: '/ws'
        });
        
        this.clients = new Map(); // Map de userId -> WebSocket connection
        this.setupServer();
        
        console.log('🔌 Servidor WebSocket iniciado en /ws');
    }
    
    setupServer() {
        this.wss.on('connection', (ws, req) => {
            console.log('Nueva conexión WebSocket');
            
            ws.isAlive = true;
            ws.userId = null;
            
            ws.on('pong', () => {
                ws.isAlive = true;
            });
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    await this.handleMessage(ws, data);
                } catch (error) {
                    console.error('Error procesando mensaje WebSocket:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Error procesando mensaje'
                    }));
                }
            });
            
            ws.on('close', () => {
                if (ws.userId) {
                    this.clients.delete(ws.userId);
                    console.log(`Cliente ${ws.userId} desconectado`);
                }
            });
            
            ws.on('error', (error) => {
                console.error('Error en WebSocket:', error);
            });
        });
        
        // Heartbeat para mantener conexiones vivas
        this.heartbeat = setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (!ws.isAlive) {
                    return ws.terminate();
                }
                
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);
    }
    
    async handleMessage(ws, message) {
        const { type, data } = message;
        
        switch (type) {
            case 'authenticate':
                await this.authenticateClient(ws, data.token);
                break;
                
            default:
                console.log('Mensaje no manejado:', type);
        }
    }
    
    async authenticateClient(ws, token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            ws.userId = decoded.userId;
            ws.userRole = decoded.role;
            
            this.clients.set(decoded.userId, ws);
            
            ws.send(JSON.stringify({
                type: 'authenticated',
                userId: decoded.userId,
                role: decoded.role
            }));
            
            console.log(`Cliente autenticado: ${decoded.userId} (${decoded.role})`);
            
        } catch (error) {
            console.error('Error autenticando WebSocket:', error);
            ws.send(JSON.stringify({
                type: 'auth_error',
                message: 'Token inválido'
            }));
            ws.close();
        }
    }
    
    // Métodos para enviar notificaciones específicas
    notifyOrderCreated(order) {
        this.broadcast('order_created', order, ['admin', 'employee']);
    }
    
    notifyOrderUpdated(order) {
        this.broadcast('order_updated', order, ['admin', 'employee']);
    }
    
    notifyReservationCreated(reservation) {
        this.broadcast('reservation_created', reservation, ['admin']);
    }
    
    notifyEmployeeClock(clockData) {
        this.broadcast('employee_clock', clockData, ['admin']);
    }
    
    notifyTableReady(tableData) {
        this.broadcast('table_ready', tableData, ['admin', 'employee']);
    }
    
    // Broadcast a usuarios específicos por rol
    broadcast(type, data, allowedRoles = ['admin', 'employee']) {
        this.clients.forEach((ws, userId) => {
            if (ws.readyState === WebSocket.OPEN && 
                allowedRoles.includes(ws.userRole)) {
                
                ws.send(JSON.stringify({
                    type,
                    data,
                    timestamp: new Date().toISOString()
                }));
            }
        });
    }
    
    // Enviar notificación a usuario específico
    notifyUser(userId, type, data) {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type,
                data,
                timestamp: new Date().toISOString()
            }));
        }
    }
    
    // Cerrar servidor
    close() {
        if (this.heartbeat) {
            clearInterval(this.heartbeat);
        }
        this.wss.close();
    }
}

module.exports = NotificationServer;