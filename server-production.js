require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==========================================
// MIDDLEWARE DE SEGURIDAD
// ==========================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configurado
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ==========================================
// MIDDLEWARE DE PARSING
// ==========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// SERVIR ARCHIVOS ESTÁTICOS
// ==========================================
app.use(express.static(path.join(__dirname), {
    maxAge: NODE_ENV === 'production' ? '1y' : '0',
    etag: true,
    lastModified: true
}));

// ==========================================
// IMPORTAR RUTAS
// ==========================================
const reservationsRouter = require('./backend/routes/reservations');
const contactRouter = require('./backend/routes/contact');
const authRouter = require('./backend/routes/auth');
const menuRouter = require('./backend/routes/menu');
const emailRouter = require('./backend/routes/email'); // Nueva ruta para emails

// ==========================================
// CONFIGURAR RUTAS API
// ==========================================
app.use('/api/reservations', reservationsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/email', emailRouter);

// ==========================================
// RUTA DE SALUD DEL SERVIDOR
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: require('./package.json').version
    });
});

// ==========================================
// RUTA PRINCIPAL (SPA)
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para el admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ==========================================
// MANEJO DE ERRORES 404
// ==========================================
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            message: 'Endpoint no encontrado',
            path: req.originalUrl
        });
    } else {
        // Para rutas frontend, redirigir a index.html (SPA)
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// ==========================================
// MANEJO GLOBAL DE ERRORES
// ==========================================
app.use((error, req, res, next) => {
    console.error('Error del servidor:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: NODE_ENV === 'production' 
            ? 'Error interno del servidor' 
            : error.message,
        ...(NODE_ENV === 'development' && { stack: error.stack })
    });
});

// ==========================================
// INICIALIZAR SERVIDOR
// ==========================================
const server = app.listen(PORT, HOST, () => {
    console.log(`
🚀 ===================================
   CAFÉ AROMA - SERVIDOR INICIADO
   ===================================
   🌐 URL: http://${HOST}:${PORT}
   🔧 Entorno: ${NODE_ENV}
   📧 Email: ${process.env.EMAIL_SERVICE || 'No configurado'}
   📅 Fecha: ${new Date().toLocaleString('es-ES')}
   ===================================
    `);
    
    if (NODE_ENV === 'development') {
        console.log(`
📝 URLs de desarrollo:
   • Principal: http://${HOST}:${PORT}
   • Admin: http://${HOST}:${PORT}/admin
   • API Health: http://${HOST}:${PORT}/api/health
        `);
    }
});

// ==========================================
// MANEJO GRACEFUL DE CIERRE
// ==========================================
process.on('SIGTERM', () => {
    console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Recibida señal SIGINT, cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

module.exports = app;