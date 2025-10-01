const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Crear nueva reserva
router.post('/', [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('phone').notEmpty().withMessage('El teléfono es requerido'),
    body('date').isISO8601().withMessage('Fecha inválida'),
    body('time').notEmpty().withMessage('La hora es requerida'),
    body('guests').isInt({ min: 1, max: 12 }).withMessage('Número de comensales debe ser entre 1 y 12')
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

    const { name, email, phone, date, time, guests, message } = req.body;
    const db = getDB();

    // Verificar disponibilidad (simplificado - en producción sería más complejo)
    const reservationDateTime = new Date(`${date} ${time}`);
    const now = new Date();
    
    if (reservationDateTime <= now) {
        return res.status(400).json({
            success: false,
            message: 'No se pueden hacer reservas para fechas pasadas'
        });
    }

    // Insertar reserva
    const sql = `INSERT INTO reservations (name, email, phone, date, time, guests, message, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`;
    
    db.run(sql, [name, email, phone, date, time, guests, message || ''], function(err) {
        if (err) {
            console.error('Error creando reserva:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al crear la reserva'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Reserva creada exitosamente. Te contactaremos pronto para confirmar.',
            data: {
                id: this.lastID,
                name,
                email,
                phone,
                date,
                time,
                guests,
                status: 'pending'
            }
        });

        db.close();
    });
});

// Obtener todas las reservas (solo admin)
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

    // Contar total de reservas
    const countSql = `SELECT COUNT(*) as total FROM reservations ${whereClause}`;
    
    db.get(countSql, params, (err, countResult) => {
        if (err) {
            console.error('Error contando reservas:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener reservas'
            });
        }

        // Obtener reservas con paginación
        const sql = `SELECT * FROM reservations ${whereClause} 
                     ORDER BY created_at DESC 
                     LIMIT ? OFFSET ?`;
        
        db.all(sql, [...params, limit, offset], (err, reservations) => {
            if (err) {
                console.error('Error obteniendo reservas:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error al obtener reservas'
                });
            }

            res.json({
                success: true,
                data: {
                    reservations,
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

// Actualizar estado de reserva (solo admin)
router.patch('/:id/status', authenticateToken, requireAdmin, [
    body('status').isIn(['pending', 'confirmed', 'cancelled']).withMessage('Estado inválido')
], async (req, res) => {
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

    try {
        // Primero obtener los datos de la reserva
        const getReservationSql = 'SELECT * FROM reservations WHERE id = ?';
        const reservation = await new Promise((resolve, reject) => {
            db.get(getReservationSql, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        // Actualizar el estado
        const updateSql = 'UPDATE reservations SET status = ? WHERE id = ?';
        await new Promise((resolve, reject) => {
            db.run(updateSql, [status, id], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });

        // Enviar email automáticamente si el estado es confirmed o cancelled
        let emailSent = false;
        let emailError = null;

        if (status === 'confirmed' || status === 'cancelled') {
            try {
                const emailResult = await emailService.sendReservationEmail(reservation, status);
                emailSent = true;

                // Guardar log del email
                const logSql = `INSERT INTO email_logs (reservation_id, email_to, subject, status, sent_at, message_id)
                               VALUES (?, ?, ?, ?, datetime('now'), ?)`;
                
                db.run(logSql, [
                    id,
                    reservation.email,
                    emailResult.subject,
                    'sent',
                    emailResult.messageId
                ]);

                console.log(`✅ Email de ${status} enviado a ${reservation.email}`);

            } catch (error) {
                console.error(`❌ Error enviando email de ${status}:`, error);
                emailError = error.message;

                // Guardar log del error
                const errorLogSql = `INSERT INTO email_logs (reservation_id, email_to, subject, status, sent_at, error_message)
                                    VALUES (?, ?, ?, ?, datetime('now'), ?)`;
                
                db.run(errorLogSql, [
                    id,
                    reservation.email,
                    `Error: Email de ${status}`,
                    'failed',
                    error.message
                ]);
            }
        }

        // Registrar acción administrativa
        const actionSql = `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description, ip_address)
                          VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(actionSql, [
            req.user?.id || 1, // ID del admin desde el token JWT
            'update_status',
            'reservation',
            id,
            `Reserva ${status} - ${emailSent ? 'Email enviado' : 'Email no enviado'}`,
            req.ip
        ]);

        res.json({
            success: true,
            message: `Reserva ${status === 'confirmed' ? 'confirmada' : status === 'cancelled' ? 'cancelada' : 'actualizada'} exitosamente`,
            data: {
                reservationId: id,
                newStatus: status,
                emailSent: emailSent,
                emailError: emailError
            }
        });

    } catch (error) {
        console.error('Error actualizando reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar reserva',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        db.close();
    }
});

// Obtener estadísticas de reservas (solo admin)
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
    const db = getDB();

    const queries = {
        total: 'SELECT COUNT(*) as count FROM reservations',
        pending: 'SELECT COUNT(*) as count FROM reservations WHERE status = "pending"',
        confirmed: 'SELECT COUNT(*) as count FROM reservations WHERE status = "confirmed"',
        cancelled: 'SELECT COUNT(*) as count FROM reservations WHERE status = "cancelled"',
        today: `SELECT COUNT(*) as count FROM reservations 
                WHERE date = date('now', 'localtime')`,
        thisWeek: `SELECT COUNT(*) as count FROM reservations 
                   WHERE date >= date('now', 'weekday 0', '-6 days') 
                   AND date <= date('now', 'localtime')`
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