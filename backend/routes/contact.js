const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Enviar mensaje de contacto
router.post('/', [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('subject').notEmpty().withMessage('El asunto es requerido'),
    body('message').isLength({ min: 10 }).withMessage('El mensaje debe tener al menos 10 caracteres')
], (req, res) => {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos inválidos',
            errors: errors.array()
        });
    }

    const { name, email, subject, message } = req.body;
    const db = getDB();

    const sql = `INSERT INTO contacts (name, email, subject, message, status) 
                 VALUES (?, ?, ?, ?, 'unread')`;
    
    db.run(sql, [name, email, subject, message], function(err) {
        if (err) {
            console.error('Error guardando mensaje de contacto:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al enviar el mensaje'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Mensaje enviado exitosamente. Te responderemos pronto.',
            data: {
                id: this.lastID,
                name,
                email,
                subject,
                status: 'unread'
            }
        });

        db.close();
    });
});

// Obtener todos los mensajes de contacto (solo admin)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
    const db = getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';

    let whereClause = '';
    let params = [];

    if (status !== 'all') {
        whereClause = 'WHERE status = ?';
        params.push(status);
    }

    // Contar total de mensajes
    const countSql = `SELECT COUNT(*) as total FROM contacts ${whereClause}`;
    
    db.get(countSql, params, (err, countResult) => {
        if (err) {
            console.error('Error contando mensajes:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener mensajes'
            });
        }

        // Obtener mensajes con paginación
        const sql = `SELECT * FROM contacts ${whereClause} 
                     ORDER BY created_at DESC 
                     LIMIT ? OFFSET ?`;
        
        db.all(sql, [...params, limit, offset], (err, contacts) => {
            if (err) {
                console.error('Error obteniendo mensajes:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al obtener mensajes'
                });
            }

            res.json({
                success: true,
                data: {
                    contacts,
                    pagination: {
                        page,
                        limit,
                        total: countResult.total,
                        pages: Math.ceil(countResult.total / limit)
                    }
                }
            });

            db.close();
        });
    });
});

// Marcar mensaje como leído (solo admin)
router.patch('/:id/status', authenticateToken, requireAdmin, [
    body('status').isIn(['unread', 'read', 'replied']).withMessage('Estado inválido')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Estado inválido',
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const { status } = req.body;
    const db = getDB();

    const sql = 'UPDATE contacts SET status = ? WHERE id = ?';
    
    db.run(sql, [status, id], function(err) {
        if (err) {
            console.error('Error actualizando mensaje:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar mensaje'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mensaje no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Estado del mensaje actualizado exitosamente'
        });

        db.close();
    });
});

// Obtener estadísticas de mensajes (solo admin)
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
    const db = getDB();

    const queries = {
        total: 'SELECT COUNT(*) as count FROM contacts',
        unread: 'SELECT COUNT(*) as count FROM contacts WHERE status = "unread"',
        read: 'SELECT COUNT(*) as count FROM contacts WHERE status = "read"',
        replied: 'SELECT COUNT(*) as count FROM contacts WHERE status = "replied"',
        today: `SELECT COUNT(*) as count FROM contacts 
                WHERE date(created_at) = date('now', 'localtime')`,
        thisWeek: `SELECT COUNT(*) as count FROM contacts 
                   WHERE created_at >= datetime('now', '-7 days')`
    };

    const stats = {};
    let completed = 0;
    const total = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
        db.get(query, (err, result) => {
            if (err) {
                console.error(`Error en consulta ${key}:`, err);
                stats[key] = 0;
            } else {
                stats[key] = result.count;
            }

            completed++;
            if (completed === total) {
                res.json({
                    success: true,
                    data: stats
                });
                db.close();
            }
        });
    });
});

module.exports = router;