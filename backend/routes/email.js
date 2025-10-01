const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const db = require('../../database/db');

// ==========================================
// ENVIAR EMAIL DE RESERVA
// ==========================================
router.post('/send-reservation', async (req, res) => {
    try {
        const { reservationId, status } = req.body;

        if (!reservationId || !status) {
            return res.status(400).json({
                success: false,
                message: 'ID de reserva y estado son requeridos'
            });
        }

        if (!['confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado debe ser "confirmed" o "cancelled"'
            });
        }

        // Obtener datos de la reserva
        const reservation = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM reservations WHERE id = ?',
                [reservationId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada'
            });
        }

        // Enviar email
        const emailResult = await emailService.sendReservationEmail(reservation, status);

        // Guardar log del email en la base de datos
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO email_logs (reservation_id, email_to, subject, status, sent_at, message_id)
                VALUES (?, ?, ?, ?, datetime('now'), ?)
            `, [
                reservationId,
                reservation.email,
                emailResult.subject,
                'sent',
                emailResult.messageId
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });

        res.json({
            success: true,
            message: `Email de ${status === 'confirmed' ? 'confirmación' : 'cancelación'} enviado exitosamente`,
            data: {
                to: reservation.email,
                messageId: emailResult.messageId,
                subject: emailResult.subject
            }
        });

    } catch (error) {
        console.error('Error enviando email de reserva:', error);
        res.status(500).json({
            success: false,
            message: 'Error enviando email',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==========================================
// ENVIAR RESPUESTA A CONTACTO
// ==========================================
router.post('/send-contact-reply', async (req, res) => {
    try {
        const { contactId, message } = req.body;

        if (!contactId || !message) {
            return res.status(400).json({
                success: false,
                message: 'ID de contacto y mensaje son requeridos'
            });
        }

        // Obtener datos del contacto
        const contact = await new Promise((resolve, reject) => {
            db.get(
                'SELECT * FROM contacts WHERE id = ?',
                [contactId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contacto no encontrado'
            });
        }

        // Enviar email de respuesta
        const emailResult = await emailService.sendContactReply(contact, message);

        // Actualizar estado del contacto a 'replied'
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE contacts SET status = ?, updated_at = datetime("now") WHERE id = ?',
                ['replied', contactId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });

        // Guardar log del email
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO email_logs (contact_id, email_to, subject, status, sent_at, message_id)
                VALUES (?, ?, ?, ?, datetime('now'), ?)
            `, [
                contactId,
                contact.email,
                `Re: Tu mensaje en ${process.env.RESTAURANT_NAME || 'Café Aroma'}`,
                'sent',
                emailResult.messageId
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });

        res.json({
            success: true,
            message: 'Respuesta enviada exitosamente',
            data: {
                to: contact.email,
                messageId: emailResult.messageId
            }
        });

    } catch (error) {
        console.error('Error enviando respuesta de contacto:', error);
        res.status(500).json({
            success: false,
            message: 'Error enviando respuesta',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==========================================
// OBTENER HISTORIAL DE EMAILS
// ==========================================
router.get('/history', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const emails = await new Promise((resolve, reject) => {
            db.all(`
                SELECT 
                    el.*,
                    r.name as reservation_name,
                    c.name as contact_name
                FROM email_logs el
                LEFT JOIN reservations r ON el.reservation_id = r.id
                LEFT JOIN contacts c ON el.contact_id = c.id
                ORDER BY el.sent_at DESC
                LIMIT ? OFFSET ?
            `, [limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const total = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM email_logs', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });

        res.json({
            success: true,
            data: {
                emails,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo historial de emails:', error);
        res.status(500).json({
            success: false,
            message: 'Error obteniendo historial',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==========================================
// PROBAR CONEXIÓN DE EMAIL
// ==========================================
router.get('/test-connection', async (req, res) => {
    try {
        const result = await emailService.testConnection();
        
        res.json({
            success: result.success,
            message: result.message,
            service: process.env.EMAIL_SERVICE,
            configured: !!process.env.EMAIL_USER
        });

    } catch (error) {
        console.error('Error probando conexión de email:', error);
        res.status(500).json({
            success: false,
            message: 'Error probando conexión',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==========================================
// ENVIAR EMAIL DE PRUEBA
// ==========================================
router.post('/test-send', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email de destino requerido'
            });
        }

        // Crear reserva de prueba
        const testReservation = {
            id: 'TEST-' + Date.now(),
            name: 'Usuario de Prueba',
            email: email,
            date: new Date().toISOString().split('T')[0],
            time: '19:00',
            guests: 2
        };

        const emailResult = await emailService.sendReservationEmail(testReservation, 'confirmed');

        res.json({
            success: true,
            message: 'Email de prueba enviado exitosamente',
            data: {
                to: email,
                messageId: emailResult.messageId,
                subject: emailResult.subject
            }
        });

    } catch (error) {
        console.error('Error enviando email de prueba:', error);
        res.status(500).json({
            success: false,
            message: 'Error enviando email de prueba',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;