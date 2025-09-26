const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../../database/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Login de administrador
router.post('/login', [
    body('username').notEmpty().withMessage('El usuario es requerido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    try {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;
        const db = getDB();

        // Buscar usuario
        db.get('SELECT * FROM users WHERE username = ? OR email = ?', 
               [username, username], 
               async (err, user) => {
            if (err) {
                console.error('Error en login:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno del servidor'
                });
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }

            // Crear token JWT
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username,
                    email: user.email,
                    role: user.role 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    }
                }
            });

            db.close();
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Verificar token
router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No hay token proporcionado'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido'
            });
        }

        res.json({
            success: true,
            message: 'Token válido',
            data: {
                user: decoded
            }
        });
    });
});

module.exports = router;