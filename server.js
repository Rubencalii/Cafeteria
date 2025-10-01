require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname)));

// Inicializar sistema de notificaciones
const NotificationServer = require('./backend/services/notificationService');
const notificationServer = new NotificationServer(server);

// Routes
const reservationsRouter = require('./backend/routes/reservations');
const contactRouter = require('./backend/routes/contact');
const authRouter = require('./backend/routes/auth');
const menuRouter = require('./backend/routes/menu');
const emailRouter = require('./backend/routes/email');
const employeesRouter = require('./backend/routes/employees');
const ordersRouter = require('./backend/routes/orders');
const reportsRouter = require('./backend/routes/reports');
const backupRouter = require('./backend/routes/backup');

app.use('/api/reservations', reservationsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/email', emailRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/backup', backupRouter);

// Hacer el servidor de notificaciones disponible globalmente
app.set('notificationServer', notificationServer);

// Ruta principal para servir la página web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Ruta no encontrada' 
    });
});

server.listen(PORT, () => {
    console.log(`🍃 Servidor Café Aroma ejecutándose en http://localhost:${PORT}`);
    console.log(`📊 Panel admin disponible en http://localhost:${PORT}/admin`);
    console.log(`🔌 WebSocket servidor iniciado en ws://localhost:${PORT}/ws`);
});

module.exports = app;