// Sistema de Reportes y Analíticas Avanzadas
// routes/reports.js

const express = require('express');
const router = express.Router();
const db = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Endpoint para reporte de ventas diarias/mensuales
router.get('/sales', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { period = 'daily', start_date, end_date } = req.query;
        
        let query;
        let params = [];
        
        const baseQuery = `
            SELECT 
                DATE(o.created_at) as date,
                COUNT(o.id) as total_orders,
                SUM(o.total_amount) as total_sales,
                AVG(o.total_amount) as average_order,
                COUNT(DISTINCT o.table_number) as unique_tables
            FROM orders o 
            WHERE o.status = 'paid'
        `;
        
        if (start_date && end_date) {
            query = baseQuery + ` AND DATE(o.created_at) BETWEEN ? AND ? 
                     GROUP BY DATE(o.created_at) 
                     ORDER BY date DESC`;
            params = [start_date, end_date];
        } else if (period === 'daily') {
            query = baseQuery + ` AND DATE(o.created_at) = DATE('now') 
                     GROUP BY DATE(o.created_at)`;
        } else if (period === 'weekly') {
            query = baseQuery + ` AND DATE(o.created_at) >= DATE('now', '-7 days') 
                     GROUP BY DATE(o.created_at) 
                     ORDER BY date DESC`;
        } else if (period === 'monthly') {
            query = baseQuery.replace('DATE(o.created_at)', 'strftime("%Y-%m", o.created_at)') + 
                   ` AND DATE(o.created_at) >= DATE('now', '-30 days') 
                     GROUP BY strftime("%Y-%m", o.created_at) 
                     ORDER BY date DESC`;
        }
        
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Error obteniendo reporte de ventas:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            
            // Calcular totales generales
            const totals = rows.reduce((acc, row) => ({
                total_orders: acc.total_orders + row.total_orders,
                total_sales: acc.total_sales + row.total_sales,
                unique_tables: Math.max(acc.unique_tables, row.unique_tables)
            }), { total_orders: 0, total_sales: 0, unique_tables: 0 });
            
            res.json({
                success: true,
                data: rows,
                totals,
                period,
                generated_at: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('Error en reporte de ventas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reporte de productos más vendidos
router.get('/top-products', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { period = 'monthly', limit = 10 } = req.query;
        
        let dateFilter = '';
        if (period === 'daily') {
            dateFilter = `AND DATE(o.created_at) = DATE('now')`;
        } else if (period === 'weekly') {
            dateFilter = `AND DATE(o.created_at) >= DATE('now', '-7 days')`;
        } else if (period === 'monthly') {
            dateFilter = `AND DATE(o.created_at) >= DATE('now', '-30 days')`;
        }
        
        const query = `
            SELECT 
                m.name,
                m.category,
                m.price,
                SUM(oi.quantity) as total_sold,
                SUM(oi.quantity * oi.price) as total_revenue,
                COUNT(DISTINCT o.id) as orders_count,
                AVG(oi.quantity) as avg_quantity_per_order
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE o.status = 'paid' ${dateFilter}
            GROUP BY m.id, m.name, m.category, m.price
            ORDER BY total_sold DESC
            LIMIT ?
        `;
        
        db.all(query, [parseInt(limit)], (err, rows) => {
            if (err) {
                console.error('Error obteniendo productos más vendidos:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            
            res.json({
                success: true,
                data: rows,
                period,
                limit,
                generated_at: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('Error en reporte de productos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reporte de rendimiento de empleados
router.get('/employee-performance', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { period = 'monthly' } = req.query;
        
        let dateFilter = '';
        if (period === 'daily') {
            dateFilter = `AND DATE(te.entry_time) = DATE('now')`;
        } else if (period === 'weekly') {
            dateFilter = `AND DATE(te.entry_time) >= DATE('now', '-7 days')`;
        } else if (period === 'monthly') {
            dateFilter = `AND DATE(te.entry_time) >= DATE('now', '-30 days')`;
        }
        
        const query = `
            SELECT 
                e.name,
                e.position,
                COUNT(DISTINCT DATE(te.entry_time)) as days_worked,
                COUNT(CASE WHEN te.entry_type = 'clock_in' THEN 1 END) as total_check_ins,
                AVG(
                    CASE WHEN te.entry_type = 'clock_out' 
                    THEN (julianday(te.entry_time) - julianday(
                        (SELECT entry_time FROM time_entries te2 
                         WHERE te2.employee_id = te.employee_id 
                         AND te2.entry_type = 'clock_in' 
                         AND DATE(te2.entry_time) = DATE(te.entry_time)
                         ORDER BY te2.entry_time DESC LIMIT 1)
                    )) * 24 END
                ) as avg_hours_per_day,
                COUNT(o.id) as orders_served,
                COALESCE(SUM(o.total_amount), 0) as total_sales_generated
            FROM employees e
            LEFT JOIN time_entries te ON e.id = te.employee_id ${dateFilter}
            LEFT JOIN orders o ON e.id = o.employee_id AND DATE(o.created_at) >= DATE('now', '-30 days')
            GROUP BY e.id, e.name, e.position
            HAVING days_worked > 0
            ORDER BY total_sales_generated DESC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error obteniendo rendimiento de empleados:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            
            res.json({
                success: true,
                data: rows,
                period,
                generated_at: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('Error en reporte de empleados:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reporte de ocupación de mesas
router.get('/table-occupancy', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { date = new Date().toISOString().split('T')[0] } = req.query;
        
        const query = `
            SELECT 
                table_number,
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as average_order,
                MIN(created_at) as first_order,
                MAX(created_at) as last_order,
                COUNT(DISTINCT strftime('%H', created_at)) as active_hours
            FROM orders 
            WHERE DATE(created_at) = ? 
            AND status = 'paid'
            GROUP BY table_number
            ORDER BY total_revenue DESC
        `;
        
        db.all(query, [date], (err, rows) => {
            if (err) {
                console.error('Error obteniendo ocupación de mesas:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            
            // Calcular estadísticas adicionales
            const stats = {
                total_tables_used: rows.length,
                total_revenue: rows.reduce((sum, row) => sum + row.total_revenue, 0),
                busiest_table: rows[0]?.table_number || null,
                average_revenue_per_table: rows.length > 0 ? 
                    rows.reduce((sum, row) => sum + row.total_revenue, 0) / rows.length : 0
            };
            
            res.json({
                success: true,
                data: rows,
                stats,
                date,
                generated_at: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('Error en reporte de ocupación:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reporte de horarios pico
router.get('/peak-hours', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { period = 'weekly' } = req.query;
        
        let dateFilter = '';
        if (period === 'daily') {
            dateFilter = `WHERE DATE(created_at) = DATE('now')`;
        } else if (period === 'weekly') {
            dateFilter = `WHERE DATE(created_at) >= DATE('now', '-7 days')`;
        } else if (period === 'monthly') {
            dateFilter = `WHERE DATE(created_at) >= DATE('now', '-30 days')`;
        }
        
        const query = `
            SELECT 
                strftime('%H', created_at) as hour,
                COUNT(*) as order_count,
                SUM(total_amount) as total_sales,
                AVG(total_amount) as average_order,
                COUNT(DISTINCT table_number) as active_tables
            FROM orders 
            ${dateFilter}
            AND status = 'paid'
            GROUP BY strftime('%H', created_at)
            ORDER BY order_count DESC
        `;
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Error obteniendo horarios pico:', err);
                return res.status(500).json({ success: false, error: err.message });
            }
            
            // Formatear horas para mejor legibilidad
            const formattedData = rows.map(row => ({
                ...row,
                hour_formatted: `${String(row.hour).padStart(2, '0')}:00 - ${String(parseInt(row.hour) + 1).padStart(2, '0')}:00`,
                hour_12: parseInt(row.hour) === 0 ? '12 AM' :
                        parseInt(row.hour) < 12 ? `${row.hour} AM` :
                        parseInt(row.hour) === 12 ? '12 PM' :
                        `${parseInt(row.hour) - 12} PM`
            }));
            
            res.json({
                success: true,
                data: formattedData,
                period,
                peak_hour: formattedData[0]?.hour_formatted || 'N/A',
                generated_at: new Date().toISOString()
            });
        });
    } catch (error) {
        console.error('Error en reporte de horarios pico:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reporte financiero completo
router.get('/financial-summary', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let dateFilter = '';
        let params = [];
        
        if (start_date && end_date) {
            dateFilter = 'AND DATE(created_at) BETWEEN ? AND ?';
            params = [start_date, end_date];
        } else {
            dateFilter = 'AND DATE(created_at) >= DATE("now", "-30 days")';
        }
        
        const queries = {
            totalSales: `
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(total_amount) as gross_sales,
                    AVG(total_amount) as average_order_value,
                    COUNT(DISTINCT table_number) as tables_served
                FROM orders 
                WHERE status = 'paid' ${dateFilter}
            `,
            
            dailyBreakdown: `
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as orders,
                    SUM(total_amount) as sales,
                    COUNT(DISTINCT table_number) as tables
                FROM orders 
                WHERE status = 'paid' ${dateFilter}
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 30
            `,
            
            categoryBreakdown: `
                SELECT 
                    m.category,
                    COUNT(oi.id) as items_sold,
                    SUM(oi.quantity * oi.price) as category_revenue,
                    AVG(oi.price) as avg_price
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                JOIN menu_items m ON oi.menu_item_id = m.id
                WHERE o.status = 'paid' ${dateFilter}
                GROUP BY m.category
                ORDER BY category_revenue DESC
            `
        };
        
        const results = {};
        
        // Ejecutar todas las consultas
        Promise.all([
            new Promise((resolve, reject) => {
                db.get(queries.totalSales, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(['totalSales', row]);
                });
            }),
            new Promise((resolve, reject) => {
                db.all(queries.dailyBreakdown, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(['dailyBreakdown', rows]);
                });
            }),
            new Promise((resolve, reject) => {
                db.all(queries.categoryBreakdown, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(['categoryBreakdown', rows]);
                });
            })
        ]).then(queryResults => {
            queryResults.forEach(([key, data]) => {
                results[key] = data;
            });
            
            res.json({
                success: true,
                data: results,
                period: { start_date, end_date },
                generated_at: new Date().toISOString()
            });
        }).catch(error => {
            console.error('Error en reporte financiero:', error);
            res.status(500).json({ success: false, error: error.message });
        });
        
    } catch (error) {
        console.error('Error en reporte financiero:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;