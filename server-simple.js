// Servidor simplificado para desarrollo y testing
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Inicializar sistema de notificaciones
try {
    const NotificationServer = require('./backend/services/notificationService');
    const notificationServer = new NotificationServer(server);
    app.set('notificationServer', notificationServer);
    console.log('🔌 Servidor WebSocket iniciado en /ws');
} catch (error) {
    console.warn('⚠️ WebSocket no disponible:', error.message);
}

// Routes básicas
const reservationsRouter = require('./backend/routes/reservations');
const contactRouter = require('./backend/routes/contact');
const authRouter = require('./backend/routes/auth');
const menuRouter = require('./backend/routes/menu');
const emailRouter = require('./backend/routes/email');
const employeesRouter = require('./backend/routes/employees');
const ordersRouter = require('./backend/routes/orders');
const reportsRouter = require('./backend/routes/reports');
const backupRouter = require('./backend/routes/backup');

// Rutas de API
app.use('/api/reservations', reservationsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/email', emailRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/backup', backupRouter);

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: require('./package.json').version
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Ruta empleados
app.get('/employee', (req, res) => {
    res.sendFile(path.join(__dirname, 'employee.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error del servidor:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
    });
});

// Ruta 404
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({ 
            success: false, 
            message: 'Endpoint no encontrado' 
        });
    } else {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

server.listen(PORT, () => {
    console.log(`🍃 Servidor Café Aroma ejecutándose en http://localhost:${PORT}`);
    console.log(`📊 Panel admin disponible en http://localhost:${PORT}/admin`);
    console.log(`👥 Panel empleados disponible en http://localhost:${PORT}/employee`);
});

module.exports = app;