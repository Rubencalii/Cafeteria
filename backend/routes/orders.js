const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Crear nuevo pedido
router.post('/', authenticateToken, [
    body('table_number').isInt({ min: 1, max: 50 }).withMessage('Número de mesa debe estar entre 1 y 50'),
    body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un item'),
    body('items.*.menu_item_id').isInt().withMessage('ID del item del menú es requerido'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0')
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

        const { table_number, customer_name, items, notes } = req.body;
        const employeeId = req.user.id;
        const db = getDB();

        // Generar número de pedido único
        const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 100)}`;

        // Calcular total del pedido
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
            // Obtener precio del item del menú
            const menuItem = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM menu_items WHERE id = ? AND available = 1', 
                    [item.menu_item_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!menuItem) {
                return res.status(400).json({
                    success: false,
                    message: `Item con ID ${item.menu_item_id} no encontrado o no disponible`
                });
            }

            const itemTotal = menuItem.price * item.quantity;
            totalAmount += itemTotal;

            orderItemsData.push({
                menu_item_id: item.menu_item_id,
                quantity: item.quantity,
                unit_price: menuItem.price,
                total_price: itemTotal,
                notes: item.notes || '',
                menu_item: menuItem
            });
        }

        // Crear el pedido
        const orderId = await new Promise((resolve, reject) => {
            db.run(`INSERT INTO orders 
                   (order_number, employee_id, table_number, customer_name, total_amount, notes) 
                   VALUES (?, ?, ?, ?, ?, ?)`,
                [orderNumber, employeeId, table_number, customer_name || '', totalAmount, notes || ''],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Insertar items del pedido
        for (const itemData of orderItemsData) {
            await new Promise((resolve, reject) => {
                db.run(`INSERT INTO order_items 
                       (order_id, menu_item_id, quantity, unit_price, total_price, notes) 
                       VALUES (?, ?, ?, ?, ?, ?)`,
                    [orderId, itemData.menu_item_id, itemData.quantity, 
                     itemData.unit_price, itemData.total_price, itemData.notes],
                    function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });
        }

        res.status(201).json({
            success: true,
            message: 'Pedido creado exitosamente',
            data: {
                id: orderId,
                order_number: orderNumber,
                table_number,
                customer_name,
                total_amount: totalAmount,
                items: orderItemsData.length,
                status: 'pending',
                employee: {
                    name: req.user.name,
                    role: req.user.role
                }
            }
        });

    } catch (error) {
        console.error('Error creando pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener todos los pedidos (para pantalla de cocina/bar)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const db = getDB();
        const status = req.query.status || 'all';
        const limit = parseInt(req.query.limit) || 50;

        let whereClause = '';
        const params = [];

        if (status !== 'all') {
            whereClause = 'WHERE o.status = ?';
            params.push(status);
        }

        const orders = await new Promise((resolve, reject) => {
            db.all(`SELECT o.*, e.name as employee_name, e.role as employee_role
                   FROM orders o
                   JOIN employees e ON o.employee_id = e.id
                   ${whereClause}
                   ORDER BY o.created_at DESC
                   LIMIT ?`, 
                [...params, limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // Obtener items para cada pedido
        for (let order of orders) {
            const items = await new Promise((resolve, reject) => {
                db.all(`SELECT oi.*, mi.name as item_name, mi.category
                       FROM order_items oi
                       JOIN menu_items mi ON oi.menu_item_id = mi.id
                       WHERE oi.order_id = ?`, 
                    [order.id], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            order.items = items;
        }

        res.json({
            success: true,
            data: orders,
            count: orders.length
        });

    } catch (error) {
        console.error('Error obteniendo pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener pedido específico
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const db = getDB();
        const orderId = req.params.id;

        const order = await new Promise((resolve, reject) => {
            db.get(`SELECT o.*, e.name as employee_name, e.role as employee_role
                   FROM orders o
                   JOIN employees e ON o.employee_id = e.id
                   WHERE o.id = ?`, 
                [orderId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Obtener items del pedido
        const items = await new Promise((resolve, reject) => {
            db.all(`SELECT oi.*, mi.name as item_name, mi.category, mi.description
                   FROM order_items oi
                   JOIN menu_items mi ON oi.menu_item_id = mi.id
                   WHERE oi.order_id = ?`, 
                [orderId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        order.items = items;

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Error obteniendo pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Actualizar estado del pedido
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;
        const db = getDB();

        const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado inválido'
            });
        }

        const result = await new Promise((resolve, reject) => {
            db.run('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, orderId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });

        if (result === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Estado del pedido actualizado',
            data: {
                orderId,
                newStatus: status,
                updatedBy: req.user.name
            }
        });

    } catch (error) {
        console.error('Error actualizando estado del pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Obtener estadísticas de pedidos por empleado
router.get('/employee/stats', authenticateToken, async (req, res) => {
    try {
        const db = getDB();
        const employeeId = req.user.id;
        const today = new Date().toISOString().split('T')[0];

        const stats = await new Promise((resolve, reject) => {
            db.get(`SELECT 
                        COUNT(*) as total_orders,
                        SUM(CASE WHEN status = 'served' THEN total_amount ELSE 0 END) as total_sales,
                        SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as today_orders
                   FROM orders 
                   WHERE employee_id = ?`, 
                [today, employeeId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        res.json({
            success: true,
            data: {
                ...stats,
                employee: {
                    name: req.user.name,
                    role: req.user.role
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas del empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;