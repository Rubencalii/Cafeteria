// Configuración de Seguridad Avanzada
// backend/config/security.js

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting personalizado por endpoint
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: message || 'Demasiadas solicitudes, intente más tarde'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
    });
};

// Rate limits específicos
const rateLimits = {
    // General API
    general: createRateLimit(
        15 * 60 * 1000, // 15 minutos
        100, // 100 requests por IP
        'Límite de solicitudes excedido'
    ),
    
    // Autenticación (más estricto)
    auth: createRateLimit(
        15 * 60 * 1000, // 15 minutos  
        5, // Solo 5 intentos de login por IP
        'Demasiados intentos de login. Intente en 15 minutos'
    ),
    
    // Reservas (moderado)
    reservations: createRateLimit(
        60 * 60 * 1000, // 1 hora
        10, // 10 reservas por hora por IP
        'Límite de reservas por hora excedido'
    ),
    
    // Contacto (moderado)
    contact: createRateLimit(
        60 * 60 * 1000, // 1 hora
        5, // 5 mensajes por hora por IP
        'Límite de mensajes de contacto excedido'
    ),
    
    // Email (muy estricto)
    email: createRateLimit(
        60 * 60 * 1000, // 1 hora
        3, // Solo 3 emails por hora por IP
        'Límite de envío de emails excedido'
    )
};

// Configuración de Helmet (seguridad headers)
const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", // Necesario para estilos inline
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'", // Solo para desarrollo, remover en producción
                "https://cdnjs.cloudflare.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https:"
            ],
            connectSrc: [
                "'self'",
                "ws://localhost:3000", // WebSocket local
                "wss://tu-dominio.com" // WebSocket producción
            ],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
        }
    },
    crossOriginEmbedderPolicy: false, // Evita problemas con algunos navegadores
    hsts: {
        maxAge: 31536000, // 1 año
        includeSubDomains: true,
        preload: true
    }
};

// CORS configurado por ambiente
const corsConfig = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env.NODE_ENV === 'production' 
            ? [process.env.CORS_ORIGIN] 
            : [
                'http://localhost:3000',
                'http://localhost:8000',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:8000'
            ];
        
        // Permitir requests sin origin (Postman, apps móviles, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por política CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Middleware de validación de tokens
const validateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de autorización requerido',
            code: 'NO_TOKEN'
        });
    }
    
    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Token inválido o expirado',
            code: 'INVALID_TOKEN'
        });
    }
};

// Middleware de sanitización de entrada
const sanitizeInput = (req, res, next) => {
    // Función recursiva para limpiar objetos
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            return obj
                .trim()
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remover scripts
                .replace(/javascript:/gi, '') // Remover javascript: URIs
                .replace(/on\w+\s*=/gi, ''); // Remover event handlers
        }
        
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }
        
        if (obj && typeof obj === 'object') {
            const cleaned = {};
            for (const [key, value] of Object.entries(obj)) {
                cleaned[key] = sanitize(value);
            }
            return cleaned;
        }
        
        return obj;
    };
    
    if (req.body) {
        req.body = sanitize(req.body);
    }
    
    if (req.query) {
        req.query = sanitize(req.query);
    }
    
    next();
};

// Middleware de logging de seguridad
const securityLogger = (req, res, next) => {
    const suspicious = [
        /(<script|javascript:|on\w+\s*=)/i,
        /(union\s+select|drop\s+table|insert\s+into)/i,
        /(\.\.\/|\.\.\\)/,
        /(\|\||&&|\$\(|\`)/
    ];
    
    const checkSuspicious = (str) => {
        return suspicious.some(pattern => pattern.test(str));
    };
    
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    let suspiciousActivity = false;
    
    // Verificar URL
    if (checkSuspicious(fullUrl)) {
        suspiciousActivity = true;
    }
    
    // Verificar headers
    Object.values(req.headers).forEach(header => {
        if (typeof header === 'string' && checkSuspicious(header)) {
            suspiciousActivity = true;
        }
    });
    
    // Verificar body
    if (req.body && typeof req.body === 'object') {
        JSON.stringify(req.body).split('').forEach(char => {
            if (checkSuspicious(char)) {
                suspiciousActivity = true;
            }
        });
    }
    
    if (suspiciousActivity) {
        const logger = require('../utils/logger');
        logger.warn('Actividad sospechosa detectada', {
            ip: req.ip,
            url: fullUrl,
            userAgent: req.get('User-Agent'),
            headers: req.headers,
            body: req.body
        });
    }
    
    next();
};

module.exports = {
    rateLimits,
    helmetConfig,
    corsConfig,
    validateToken,
    sanitizeInput,
    securityLogger
};