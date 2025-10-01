const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Login de empleado
router.post('/login', [
    body('employee_code').notEmpty().withMessage('El código de empleado es requerido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { employee_code, password } = req.body;
        const db = getDB();

        const employee = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM employees WHERE employee_code = ? AND status = "active"', 
                [employee_code], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!employee) {
            return res.status(401).json({
                success: false,
                message: 'Código de empleado inválido'
            });
        }

        const validPassword = await bcrypt.compare(password, employee.password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        const token = jwt.sign(
            { 
                id: employee.id, 
                employee_code: employee.employee_code,
                role: employee.role,
                name: employee.name,
                type: 'employee'
            },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                token,
                employee: {
                    id: employee.id,
                    employee_code: employee.employee_code,
                    name: employee.name,
                    role: employee.role,
                    shift_start: employee.shift_start,
                    shift_end: employee.shift_end
                }
            }
        });

    } catch (error) {
        console.error('Error en login de empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Fichar entrada/salida
router.post('/clock', authenticateToken, async (req, res) => {
    try {
        const { entry_type, notes } = req.body; // clock_in, clock_out, break_start, break_end
        
        if (!['clock_in', 'clock_out', 'break_start', 'break_end'].includes(entry_type)) {
            return res.status(400).json({
                success: false,
                message: 'Tipo de fichaje inválido'
            });
        }

        const db = getDB();
        const employeeId = req.user.id;
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Verificar último fichaje para evitar duplicados
        const lastEntry = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM time_entries 
                   WHERE employee_id = ? 
                   ORDER BY timestamp DESC LIMIT 1`, 
                [employeeId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Validaciones básicas
        if (entry_type === 'clock_in' && lastEntry && lastEntry.entry_type === 'clock_in') {
            return res.status(400).json({
                success: false,
                message: 'Ya has fichado entrada. Debes fichar salida primero.'
            });
        }

        if (entry_type === 'clock_out' && (!lastEntry || lastEntry.entry_type === 'clock_out')) {
            return res.status(400).json({
                success: false,
                message: 'No has fichado entrada. Debes fichar entrada primero.'
            });
        }

        // Insertar fichaje
        const result = await new Promise((resolve, reject) => {
            db.run(`INSERT INTO time_entries 
                   (employee_id, entry_type, notes, ip_address) 
                   VALUES (?, ?, ?, ?)`,
                [employeeId, entry_type, notes || '', ipAddress],
                function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });

        // Obtener datos del empleado para el mensaje
        const employee = await new Promise((resolve, reject) => {
            db.get('SELECT name, role FROM employees WHERE id = ?', 
                [employeeId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        const messages = {
            clock_in: '👋 Entrada registrada',
            clock_out: '👋 Salida registrada', 
            break_start: '☕ Descanso iniciado',
            break_end: '💼 Fin del descanso'
        };

        res.json({
            success: true,
            message: messages[entry_type],
            data: {
                id: result.id,
                entry_type,
                timestamp: new Date().toISOString(),
                employee: {
                    name: employee.name,
                    role: employee.role
                }
            }
        });

    } catch (error) {
        console.error('Error en fichaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener estado actual del empleado (último fichaje)
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const db = getDB();
        const employeeId = req.user.id;

        const lastEntry = await new Promise((resolve, reject) => {
            db.get(`SELECT te.*, e.name, e.role 
                   FROM time_entries te
                   JOIN employees e ON te.employee_id = e.id
                   WHERE te.employee_id = ? 
                   ORDER BY te.timestamp DESC LIMIT 1`, 
                [employeeId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        const isWorking = lastEntry && 
            (lastEntry.entry_type === 'clock_in' || lastEntry.entry_type === 'break_end');
        
        const onBreak = lastEntry && lastEntry.entry_type === 'break_start';

        res.json({
            success: true,
            data: {
                isWorking,
                onBreak,
                lastEntry: lastEntry ? {
                    entry_type: lastEntry.entry_type,
                    timestamp: lastEntry.timestamp,
                    notes: lastEntry.notes
                } : null,
                employee: {
                    name: req.user.name,
                    role: req.user.role,
                    employee_code: req.user.employee_code
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo estado del empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener historial de fichajes del empleado
router.get('/time-entries', authenticateToken, async (req, res) => {
    try {
        const db = getDB();
        const employeeId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const entries = await new Promise((resolve, reject) => {
            db.all(`SELECT * FROM time_entries 
                   WHERE employee_id = ? 
                   ORDER BY timestamp DESC 
                   LIMIT ? OFFSET ?`, 
                [employeeId, limit, offset], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json({
            success: true,
            data: entries,
            pagination: {
                page,
                limit,
                total: entries.length
            }
        });

    } catch (error) {
        console.error('Error obteniendo historial de fichajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener lista de todos los empleados (para admin)
router.get('/list', async (req, res) => {
    try {
        const db = getDB();
        
        const employees = await new Promise((resolve, reject) => {
            db.all(`SELECT 
                        e.id, 
                        e.employee_code, 
                        e.name, 
                        e.role, 
                        e.status,
                        e.hire_date,
                        (SELECT COUNT(*) FROM time_entries WHERE employee_id = e.id AND DATE(clock_in) = DATE('now')) as today_entries,
                        (SELECT clock_in FROM time_entries WHERE employee_id = e.id AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1) as current_session
                    FROM employees e 
                    ORDER BY e.name`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json({
            success: true,
            data: employees
        });
    } catch (error) {
        console.error('Error obteniendo lista de empleados:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener fichajes de empleados (para admin)
router.get('/time-entries', async (req, res) => {
    try {
        const { date, employee_id } = req.query;
        const db = getDB();
        
        let query = `SELECT 
                        te.id,
                        te.employee_id,
                        te.clock_in,
                        te.clock_out,
                        te.break_time,
                        te.total_hours,
                        e.name as employee_name,
                        e.employee_code,
                        e.role
                    FROM time_entries te
                    JOIN employees e ON te.employee_id = e.id`;
        
        const params = [];
        const conditions = [];
        
        if (date) {
            conditions.push('DATE(te.clock_in) = ?');
            params.push(date);
        }
        
        if (employee_id) {
            conditions.push('te.employee_id = ?');
            params.push(employee_id);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY te.clock_in DESC';
        
        const timeEntries = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json({
            success: true,
            data: timeEntries
        });
    } catch (error) {
        console.error('Error obteniendo fichajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas de empleados (para admin)
router.get('/stats', async (req, res) => {
    try {
        const db = getDB();
        
        // Empleados actualmente trabajando
        const currentlyWorking = await new Promise((resolve, reject) => {
            db.all(`SELECT 
                        e.name, 
                        e.employee_code, 
                        e.role,
                        te.clock_in
                    FROM employees e
                    JOIN time_entries te ON e.id = te.employee_id
                    WHERE te.clock_out IS NULL
                    ORDER BY te.clock_in`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Estadísticas del día
        const todayStats = await new Promise((resolve, reject) => {
            db.get(`SELECT 
                        COUNT(DISTINCT employee_id) as employees_worked_today,
                        COUNT(*) as total_entries_today,
                        AVG(total_hours) as avg_hours_today
                    FROM time_entries 
                    WHERE DATE(clock_in) = DATE('now')`, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        res.json({
            success: true,
            data: {
                currently_working: currentlyWorking,
                today_stats: todayStats
            }
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;