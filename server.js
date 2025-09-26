const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (frontend)
app.use(express.static(path.join(__dirname)));

// Routes
const reservationsRouter = require('./backend/routes/reservations');
const contactRouter = require('./backend/routes/contact');
const authRouter = require('./backend/routes/auth');
const menuRouter = require('./backend/routes/menu');

app.use('/api/reservations', reservationsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);

// Ruta principal para servir la página web
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor' 
    });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Ruta no encontrada' 
    });
});

app.listen(PORT, () => {
    console.log(`🍃 Servidor Café Aroma ejecutándose en http://localhost:${PORT}`);
    console.log(`📊 Panel admin disponible en http://localhost:${PORT}/admin`);
});

module.exports = app;