const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../../database/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los elementos del menú (público)
router.get('/', (req, res) => {
    const db = getDB();
    const category = req.query.category || 'all';

    let whereClause = 'WHERE available = true';
    let params = [];

    if (category !== 'all') {
        whereClause += ' AND category = ?';
        params.push(category);
    }

    const sql = `SELECT id, name, description, price, category, image 
                 FROM menu_items ${whereClause} 
                 ORDER BY category, name`;
    
    db.all(sql, params, (err, items) => {
        if (err) {
            console.error('Error obteniendo menú:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener el menú'
            });
        }

        // Agrupar por categorías
        const menuByCategory = items.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                items,
                categories: menuByCategory
            }
        });

        db.close();
    });
});

// Obtener todas las categorías disponibles (público)
router.get('/categories', (req, res) => {
    const db = getDB();

    const sql = `SELECT DISTINCT category 
                 FROM menu_items 
                 WHERE available = true 
                 ORDER BY category`;
    
    db.all(sql, (err, categories) => {
        if (err) {
            console.error('Error obteniendo categorías:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener categorías'
            });
        }

        res.json({
            success: true,
            data: categories.map(cat => cat.category)
        });

        db.close();
    });
});

// Crear nuevo elemento del menú (solo admin)
router.post('/', authenticateToken, requireAdmin, [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('description').notEmpty().withMessage('La descripción es requerida'),
    body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número válido'),
    body('category').notEmpty().withMessage('La categoría es requerida')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos inválidos',
            errors: errors.array()
        });
    }

    const { name, description, price, category, image, available = true } = req.body;
    const db = getDB();

    const sql = `INSERT INTO menu_items (name, description, price, category, image, available) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [name, description, price, category, image || null, available], function(err) {
        if (err) {
            console.error('Error creando elemento del menú:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al crear elemento del menú'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Elemento del menú creado exitosamente',
            data: {
                id: this.lastID,
                name,
                description,
                price,
                category,
                image,
                available
            }
        });

        db.close();
    });
});

// Actualizar elemento del menú (solo admin)
router.put('/:id', authenticateToken, requireAdmin, [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('description').notEmpty().withMessage('La descripción es requerida'),
    body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número válido'),
    body('category').notEmpty().withMessage('La categoría es requerida')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos inválidos',
            errors: errors.array()
        });
    }

    const { id } = req.params;
    const { name, description, price, category, image, available } = req.body;
    const db = getDB();

    const sql = `UPDATE menu_items 
                 SET name = ?, description = ?, price = ?, category = ?, image = ?, available = ? 
                 WHERE id = ?`;
    
    db.run(sql, [name, description, price, category, image || null, available, id], function(err) {
        if (err) {
            console.error('Error actualizando elemento del menú:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al actualizar elemento del menú'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Elemento del menú no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Elemento del menú actualizado exitosamente'
        });

        db.close();
    });
});

// Eliminar elemento del menú (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDB();

    const sql = 'DELETE FROM menu_items WHERE id = ?';
    
    db.run(sql, [id], function(err) {
        if (err) {
            console.error('Error eliminando elemento del menú:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al eliminar elemento del menú'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Elemento del menú no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Elemento del menú eliminado exitosamente'
        });

        db.close();
    });
});

// Obtener todos los elementos del menú para admin (incluye no disponibles)
router.get('/admin', authenticateToken, requireAdmin, (req, res) => {
    const db = getDB();

    const sql = `SELECT * FROM menu_items ORDER BY category, name`;
    
    db.all(sql, (err, items) => {
        if (err) {
            console.error('Error obteniendo menú completo:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener el menú'
            });
        }

        res.json({
            success: true,
            data: items
        });

        db.close();
    });
});

// Alternar disponibilidad de elemento (solo admin)
router.patch('/:id/availability', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const db = getDB();

    // Primero obtener el estado actual
    db.get('SELECT available FROM menu_items WHERE id = ?', [id], (err, item) => {
        if (err) {
            console.error('Error obteniendo elemento:', err);
            return res.status(500).json({
                success: false,
                message: 'Error al obtener elemento del menú'
            });
        }

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Elemento del menú no encontrado'
            });
        }

        // Alternar disponibilidad
        const newAvailability = !item.available;
        
        db.run('UPDATE menu_items SET available = ? WHERE id = ?', 
               [newAvailability, id], 
               function(updateErr) {
            if (updateErr) {
                console.error('Error actualizando disponibilidad:', updateErr);
                return res.status(500).json({
                    success: false,
                    message: 'Error al actualizar disponibilidad'
                });
            }

            res.json({
                success: true,
                message: `Elemento ${newAvailability ? 'habilitado' : 'deshabilitado'} exitosamente`,
                data: { available: newAvailability }
            });

            db.close();
        });
    });
});

module.exports = router;