# 🍃 Café Aroma - Página Web Completa

Una página web moderna y funcional para restaurante/cafetería con backend completo.

## ✨ Características Principales

### Frontend
- ✅ Diseño responsivo optimizado para móviles
- ✅ Efectos visuales avanzados (partículas, glassmorphism, animaciones)
- ✅ Tema oscuro/claro
- ✅ Galería interactiva con lightbox
- ✅ Sistema de reservas funcional
- ✅ Formulario de contacto funcional
- ✅ Menú dinámico cargado desde base de datos
- ✅ Preloader animado con elementos de café
- ✅ Cursor personalizado
- ✅ Efectos de scroll y paralaje

### Backend
- ✅ API REST con Node.js y Express
- ✅ Base de datos SQLite
- ✅ Autenticación JWT para administradores
- ✅ Sistema de reservas con estados
- ✅ Sistema de mensajes de contacto
- ✅ CRUD completo para el menú
- ✅ Panel de administración web
- ✅ Validación de datos
- ✅ Manejo de errores

## 🚀 Cómo Usar

### 1. Instalación
```bash
cd "Nueva Pagina"
npm install
```

### 2. Inicializar Base de Datos
```bash
npm run init-db
```

### 3. Ejecutar Servidor
```bash
npm start
```

### 4. Acceder a la Aplicación
- **Página Principal**: http://localhost:3000
- **Panel Administración**: http://localhost:3000/admin

## 🔐 Credenciales de Administrador

- **Usuario**: admin
- **Contraseña**: admin123

## 📊 Panel de Administración

El panel incluye:

### Dashboard
- Estadísticas de reservas y mensajes
- Métricas en tiempo real
- Resumen de actividad

### Gestión de Reservas
- Ver todas las reservas
- Confirmar/cancelar reservas
- Filtrar por estado
- Paginación

### Mensajes de Contacto
- Ver todos los mensajes
- Marcar como leído/respondido
- Organización por fecha

### Gestión del Menú
- Agregar/editar/eliminar elementos
- Activar/desactivar disponibilidad
- Categorización automática
- Gestión de precios

## 🛠 Estructura del Proyecto

```
Nueva Pagina/
├── index.html              # Página principal
├── admin.html             # Panel de administración
├── styles.css             # Estilos del frontend
├── script.js              # JavaScript del frontend
├── admin.js               # JavaScript del admin
├── server.js              # Servidor Express principal
├── package.json           # Configuración de Node.js
├── database/
│   ├── db.js              # Configuración de SQLite
│   ├── init.js            # Inicialización de datos
│   └── cafe_aroma.db      # Base de datos (generada)
└── backend/
    ├── routes/            # Rutas de la API
    │   ├── auth.js        # Autenticación
    │   ├── reservations.js # Reservas
    │   ├── contact.js     # Contacto
    └── middleware/        # Middleware personalizado
        └── auth.js        # Validación JWT
```

## 📱 APIs Disponibles

### Públicas
- `GET /api/menu` - Obtener menú
- `POST /api/reservations` - Crear reserva
- `POST /api/contact` - Enviar mensaje

### Administrador (requieren autenticación)
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token
- `GET /api/reservations` - Listar reservas
- `PATCH /api/reservations/:id/status` - Actualizar reserva
- `GET /api/contact` - Listar mensajes
- `PATCH /api/contact/:id/status` - Actualizar mensaje
- `GET /api/menu/admin` - Menú completo para admin
- `POST /api/menu` - Crear elemento menú
- `PUT /api/menu/:id` - Actualizar elemento
- `DELETE /api/menu/:id` - Eliminar elemento

## 🎨 Funcionalidades Destacadas

### Sistema de Reservas
- Validación de fechas
- Estados: pendiente, confirmada, cancelada
- Integración frontend-backend completa
- Notificaciones de confirmación

### Menú Dinámico
- Carga desde base de datos
- Categorización automática
- Imágenes por defecto
- Actualización en tiempo real desde admin

### Panel de Administración
- Dashboard con métricas
- Gestión completa de datos
- Interfaz intuitiva
- Autenticación segura

### Efectos Visuales
- Partículas de café animadas
- Ondas SVG con movimiento
- Glassmorphism en tarjetas
- Micro-interacciones
- Cursor personalizado

## 🔧 Desarrollo

### Modo Desarrollo
```bash
npm run dev  # Con nodemon para recarga automática
```

### Scripts Disponibles
- `npm start` - Servidor de producción
- `npm run dev` - Servidor con recarga automática
- `npm run init-db` - Inicializar base de datos

## 🌟 Próximas Mejoras

- [ ] Notificaciones por email
- [ ] Sistema de pedidos online
- [ ] Integración con pasarelas de pago
- [ ] App móvil con React Native
- [ ] Analytics y métricas avanzadas
- [ ] Sistema de fidelización de clientes

---

## 📧 Contacto

¿Preguntas? ¡Contáctanos a través del formulario en la página web!

**¡Disfruta tu experiencia en Café Aroma! ☕**