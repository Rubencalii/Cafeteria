const jwt = require('jsonwebtoken');
const { getDB } = require('../../database/db');

// Clave secreta JWT (en producción debe estar en variables de entorno)
const JWT_SECRET = process.env.JWT_SECRET || 'cafe_aroma_secret_key_2025';

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
        
        req.user = user;
        next();
    });
};

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado: Se requieren permisos de administrador'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    JWT_SECRET
};