const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta de la base de datos
const dbPath = path.join(__dirname, 'cafe_aroma.db');

// Función para crear la conexión a la base de datos
const getDB = () => {
    return new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error conectando a SQLite:', err.message);
        }
    });
};

// Función para inicializar la base de datos
const initializeDB = () => {
    const db = getDB();
    
    // Tabla de usuarios (admin)
    db.serialize(() => {
        // Tabla de usuarios
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla de reservas
        db.run(`CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            guests INTEGER NOT NULL,
            message TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla de contactos
        db.run(`CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'unread',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla del menú
        db.run(`CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            category TEXT NOT NULL,
            image TEXT,
            available BOOLEAN DEFAULT true,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla de configuración del restaurante
        db.run(`CREATE TABLE IF NOT EXISTS restaurant_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla de logs de emails
        db.run(`CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reservation_id INTEGER,
            contact_id INTEGER,
            email_to TEXT NOT NULL,
            subject TEXT NOT NULL,
            status TEXT DEFAULT 'sent',
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            message_id TEXT,
            error_message TEXT,
            FOREIGN KEY (reservation_id) REFERENCES reservations (id),
            FOREIGN KEY (contact_id) REFERENCES contacts (id)
        )`);

        // Tabla de acciones administrativas
        db.run(`CREATE TABLE IF NOT EXISTS admin_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_id INTEGER,
            action_type TEXT NOT NULL,
            target_type TEXT NOT NULL,
            target_id INTEGER NOT NULL,
            description TEXT,
            ip_address TEXT,
            user_agent TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (admin_id) REFERENCES users (id)
        )`);

        console.log('✅ Tablas de la base de datos creadas exitosamente');
    });

    db.close((err) => {
        if (err) {
            console.error('Error cerrando la base de datos:', err.message);
        } else {
            console.log('🔒 Conexión a la base de datos cerrada');
        }
    });
};

module.exports = { getDB, initializeDB };