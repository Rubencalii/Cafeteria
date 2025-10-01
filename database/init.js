const bcrypt = require('bcryptjs');
const { getDB } = require('./db');

// Script de inicialización de la base de datos
const initializeData = async () => {
    const db = getDB();
    
    try {
        // Hash de la contraseña por defecto
        const defaultPassword = await bcrypt.hash('admin123', 10);
        
        db.serialize(() => {
            // Insertar usuario administrador por defecto
            db.run(`INSERT OR IGNORE INTO users (username, email, password, role) 
                   VALUES (?, ?, ?, ?)`, 
                   ['admin', 'admin@cafearoma.com', defaultPassword, 'admin']);

            // Insertar elementos del menú de ejemplo
            const menuItems = [
                // Café Caliente
                ['Espresso', 'Café espresso tradicional italiano', 2.50, 'Café Caliente', 'espresso.jpg'],
                ['Cappuccino', 'Espresso con leche vaporizada y espuma cremosa', 3.75, 'Café Caliente', 'cappuccino.jpg'],
                ['Latte', 'Espresso suave con leche vaporizada', 4.25, 'Café Caliente', 'latte.jpg'],
                ['Americano', 'Espresso diluido con agua caliente', 3.00, 'Café Caliente', 'americano.jpg'],
                ['Mocha', 'Espresso con chocolate y leche vaporizada', 4.50, 'Café Caliente', 'mocha.jpg'],
                
                // Café Frío
                ['Frappé Vainilla', 'Café frío batido con helado de vainilla', 5.25, 'Café Frío', 'frappe.jpg'],
                ['Cold Brew', 'Café de extracción en frío, suave y refrescante', 4.00, 'Café Frío', 'coldbrew.jpg'],
                ['Iced Latte', 'Latte servido con hielo y leche fría', 4.75, 'Café Frío', 'icedlatte.jpg'],
                
                // Postres
                ['Tiramisú', 'Postre italiano con café, mascarpone y cacao', 6.50, 'Postres', 'tiramisu.jpg'],
                ['Cheesecake de Frutos Rojos', 'Tarta de queso cremosa con salsa de frutos rojos', 5.75, 'Postres', 'cheesecake.jpg'],
                ['Brownie con Helado', 'Brownie tibio de chocolate con helado de vainilla', 6.25, 'Postres', 'brownie.jpg'],
                ['Croissant de Almendras', 'Croissant relleno de crema de almendras', 4.50, 'Postres', 'croissant.jpg'],
                
                // Desayunos
                ['Tostadas Francesas', 'Pan brioche con canela, miel y frutos rojos', 7.50, 'Desayunos', 'tostadas.jpg'],
                ['Bowl de Açaí', 'Açaí con granola, frutas frescas y miel', 8.25, 'Desayunos', 'acai.jpg'],
                ['Sandwich de Pollo', 'Pan ciabatta con pollo, aguacate y vegetales', 9.50, 'Desayunos', 'sandwich.jpg'],
                ['Pancakes de Arándanos', 'Pancakes esponjosos con arándanos frescos', 8.75, 'Desayunos', 'pancakes.jpg']
            ];

            const insertMenu = db.prepare(`INSERT OR IGNORE INTO menu_items 
                                          (name, description, price, category, image) 
                                          VALUES (?, ?, ?, ?, ?)`);
            
            menuItems.forEach(item => {
                insertMenu.run(item);
            });
            insertMenu.finalize();

            // Configuraciones del restaurante
            const settings = [
                ['restaurant_name', 'Café Aroma'],
                ['restaurant_phone', '+34 912 345 678'],
                ['restaurant_email', 'info@cafearoma.com'],
                ['restaurant_address', 'Calle Gran Vía 25, Madrid, España'],
                ['opening_hours', 'Lun-Dom: 7:00 - 22:00'],
                ['max_table_capacity', '8'],
                ['reservation_advance_days', '30']
            ];

            const insertSetting = db.prepare(`INSERT OR REPLACE INTO restaurant_settings 
                                             (key, value) VALUES (?, ?)`);
            
            settings.forEach(setting => {
                insertSetting.run(setting);
            });
            insertSetting.finalize();

            console.log('✅ Configuración del restaurante insertada');

            // Insertar empleados de ejemplo
            const bcrypt = require('bcrypt');
            const saltRounds = 10;
            
            const employees = [
                ['EMP001', 'María García', 'maria.garcia@cafearoma.com', bcrypt.hashSync('maria123', saltRounds), 'waiter', '+34 666 111 222', '08:00', '16:00'],
                ['EMP002', 'Carlos López', 'carlos.lopez@cafearoma.com', bcrypt.hashSync('carlos123', saltRounds), 'bartender', '+34 666 333 444', '14:00', '22:00'],
                ['EMP003', 'Ana Martínez', 'ana.martinez@cafearoma.com', bcrypt.hashSync('ana123', saltRounds), 'cook', '+34 666 555 666', '07:00', '15:00'],
                ['EMP004', 'David Ruiz', 'david.ruiz@cafearoma.com', bcrypt.hashSync('david123', saltRounds), 'cashier', '+34 666 777 888', '09:00', '17:00']
            ];

            const insertEmployee = db.prepare(`INSERT OR IGNORE INTO employees 
                (employee_code, name, email, password, role, phone, shift_start, shift_end) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            
            employees.forEach(employee => {
                insertEmployee.run(employee);
                console.log(`✅ Empleado ${employee[1]} (${employee[4]}) agregado`);
            });
            insertEmployee.finalize();

            console.log('✅ Datos iniciales insertados correctamente');
        });

    } catch (error) {
        console.error('❌ Error inicializando datos:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Error cerrando la base de datos:', err.message);
            } else {
                console.log('🔒 Inicialización completada, base de datos cerrada');
            }
        });
    }
};

// Ejecutar si se llama directamente
if (require.main === module) {
    const { initializeDB } = require('./db');
    console.log('🚀 Inicializando base de datos...');
    initializeDB();
    setTimeout(() => {
        initializeData();
    }, 1000);
}

module.exports = { initializeData };