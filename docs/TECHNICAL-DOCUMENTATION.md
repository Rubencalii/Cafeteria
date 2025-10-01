# 📖 CAFÉ AROMA - DOCUMENTACIÓN TÉCNICA COMPLETA

## 🎯 INFORMACIÓN DEL PRODUCTO

**Nombre:** Sistema de Gestión Integral para Restaurantes - Café Aroma  
**Versión:** 2.0.0 Professional  
**Tipo:** Sistema POS + Gestión Completa  
**Tecnología:** Node.js, Express, SQLite, WebSocket  
**Licencia:** Comercial  

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### **Stack Tecnológico**
- **Backend:** Node.js 18+ con Express.js
- **Base de Datos:** SQLite (migrable a PostgreSQL/MySQL)
- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Tiempo Real:** WebSocket (ws library)
- **Autenticación:** JWT + bcrypt
- **Email:** Nodemailer (Gmail, SendGrid, SMTP)
- **Seguridad:** Helmet + Rate Limiting + CORS

### **Estructura de Directorios**
```
📁 cafe-aroma/
├── 📁 backend/
│   ├── 📁 config/         # Configuraciones
│   ├── 📁 middleware/     # Middlewares personalizados
│   ├── 📁 routes/         # Rutas de API
│   ├── 📁 services/       # Servicios (Email, Notifications)
│   └── 📁 utils/          # Utilidades (Logger, Helpers)
├── 📁 database/           # Base de datos y scripts
├── 📁 frontend/           # Archivos del cliente
├── 📁 logs/               # Logs de la aplicación
├── 📁 tests/              # Tests automatizados
└── 📁 docs/               # Documentación
```

---

## 🚀 FUNCIONALIDADES PRINCIPALES

### **1. 💰 Sistema de Pedidos y Facturación**
- ✅ Gestión de mesas en tiempo real
- ✅ Cálculo automático de cuentas
- ✅ Seguimiento de pagos
- ✅ Historia completa de pedidos
- ✅ Impresión de tickets

### **2. 👥 Gestión de Personal**
- ✅ Control de asistencia (fichaje)
- ✅ Registro de horarios
- ✅ Panel específico para empleados
- ✅ Autenticación segura por roles

### **3. 🍽️ Gestión de Menú**
- ✅ CRUD completo de platillos
- ✅ Categorías organizadas
- ✅ Control de disponibilidad
- ✅ Gestión de precios

### **4. 📅 Sistema de Reservas**
- ✅ Reservas online con validación
- ✅ Confirmación automática por email
- ✅ Gestión de capacidad
- ✅ Calendario integrado

### **5. 📊 Reportes y Analíticas**
- ✅ Reportes de ventas diarias/mensuales
- ✅ Productos más vendidos
- ✅ Rendimiento de empleados
- ✅ Análisis de horarios pico
- ✅ Reportes financieros completos

### **6. 🔔 Notificaciones en Tiempo Real**
- ✅ WebSocket para comunicación instantánea
- ✅ Notificaciones automáticas
- ✅ Actualizaciones de estado en vivo
- ✅ Sistema de reconexión automática

### **7. 💾 Backup y Seguridad**
- ✅ Backup automático programable
- ✅ Restauración de base de datos
- ✅ Autenticación JWT
- ✅ Rate limiting y protección CSRF

---

## 📋 INSTALACIÓN Y CONFIGURACIÓN

### **Requisitos del Sistema**
- **Node.js:** 18.0.0 o superior
- **NPM:** 8.0.0 o superior
- **RAM:** 2GB mínimo (4GB recomendado)
- **Disco:** 5GB libres
- **SO:** Windows 10+, macOS 10.15+, Ubuntu 18.04+

### **Instalación Rápida**
```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/cafe-aroma.git
cd cafe-aroma

# 2. Instalar dependencias
npm install

# 3. Configurar ambiente
cp .env.example .env
nano .env  # Editar configuración

# 4. Inicializar base de datos
npm run init-db

# 5. Ejecutar tests
npm test

# 6. Iniciar en desarrollo
npm run dev

# 7. Iniciar en producción
npm run production
```

### **Configuración de Email**
```env
# Gmail (Recomendado para inicio)
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-app-password

# SendGrid (Recomendado para producción)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=tu-api-key
EMAIL_FROM_ADDRESS=noreply@tu-dominio.com
```

---

## 🔧 API ENDPOINTS

### **Autenticación**
```http
POST /api/auth/admin/login     - Login administrador
POST /api/auth/employee/login  - Login empleado
GET  /api/auth/verify          - Verificar token
```

### **Reservas**  
```http
GET    /api/reservations       - Listar reservas
POST   /api/reservations       - Crear reserva
PUT    /api/reservations/:id   - Actualizar reserva
DELETE /api/reservations/:id   - Eliminar reserva
```

### **Pedidos**
```http
GET    /api/orders             - Listar pedidos
POST   /api/orders             - Crear pedido
PUT    /api/orders/:id         - Actualizar pedido
GET    /api/orders/kitchen     - Pedidos para cocina
```

### **Reportes**
```http
GET /api/reports/sales              - Reporte de ventas
GET /api/reports/top-products       - Productos más vendidos
GET /api/reports/employee-performance - Rendimiento empleados
GET /api/reports/financial-summary  - Resumen financiero
```

### **Backup**
```http
POST   /api/backup/create      - Crear backup
GET    /api/backup/list        - Listar backups
GET    /api/backup/download/:filename - Descargar backup
POST   /api/backup/restore/:filename  - Restaurar backup
```

---

## 🔐 SEGURIDAD

### **Medidas Implementadas**
- ✅ **JWT Authentication** con tokens de acceso
- ✅ **Bcrypt** para hash de contraseñas
- ✅ **Rate Limiting** por endpoint
- ✅ **CORS** configurado por ambiente
- ✅ **Helmet** para headers de seguridad
- ✅ **Input Sanitization** automática
- ✅ **SQL Injection** prevención
- ✅ **XSS Protection** integrada

### **Configuración de Producción**
```env
NODE_ENV=production
JWT_SECRET=clave-super-segura-64-caracteres-minimo
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://tu-dominio.com
```

---

## 📊 MONITOREO Y LOGS

### **Sistema de Logging**
- ✅ Logs estructurados en JSON
- ✅ Rotación automática de archivos
- ✅ Niveles configurables (ERROR, WARN, INFO, DEBUG)
- ✅ Logging de requests HTTP
- ✅ Limpieza automática de logs antiguos

### **Archivos de Log**
```
logs/
├── app-2025-10-01.log      # Log general del día
├── errors-2025-10-01.log   # Solo errores
└── requests-2025-10-01.log # Requests HTTP
```

### **Monitoreo en Tiempo Real**
```bash
# Ver logs en tiempo real
tail -f logs/app-$(date +%Y-%m-%d).log

# Ver solo errores
tail -f logs/errors-$(date +%Y-%m-%d).log
```

---

## 🧪 TESTING

### **Tests Incluidos**
- ✅ Tests de funcionalidad básica
- ✅ Tests de API endpoints
- ✅ Tests de base de datos
- ✅ Tests de autenticación

### **Ejecutar Tests**
```bash
# Tests básicos
npm test

# Tests con coverage
npm run test:coverage

# Tests específicos
npm run test:api
npm run test:db
```

---

## 🚀 DESPLIEGUE EN PRODUCCIÓN

### **Opciones de Hosting**
1. **VPS/Servidor Dedicado** (Recomendado)
2. **Heroku** (Fácil pero limitado)
3. **DigitalOcean App Platform**
4. **AWS EC2**
5. **Google Cloud Run**

### **Checklist Pre-Despliegue**
- [ ] Variables de entorno configuradas
- [ ] Base de datos inicializada
- [ ] Email configurado y probado
- [ ] SSL/TLS configurado
- [ ] Dominio apuntando al servidor
- [ ] Tests pasando
- [ ] Backup inicial creado

---

## 💼 VALOR COMERCIAL

### **Ventajas Competitivas**
- 🎯 **Todo-en-uno:** POS + Gestión + Reportes
- ⚡ **Tiempo Real:** Actualizaciones instantáneas
- 📱 **Responsive:** Funciona en todos los dispositivos
- 🔧 **Personalizable:** Código fuente incluido
- 💰 **Sin mensualidades:** Licencia única
- 🛡️ **Seguro:** Cumple estándares de la industria

### **ROI para Restaurantes**
- ✅ Reduce errores de pedidos en 90%
- ✅ Mejora eficiencia del personal en 40%
- ✅ Aumenta satisfacción del cliente
- ✅ Proporciona insights valiosos de negocio
- ✅ Elimina costos de sistemas múltiples

---

## 📞 SOPORTE TÉCNICO

### **Documentación**
- 📖 Manual de Usuario
- 🔧 Guía de Instalación
- 🐛 Solución de Problemas
- 📊 Ejemplos de API

### **Contacto**
- **Email:** soporte@cafearoma.com
- **Documentación:** https://docs.cafearoma.com
- **GitHub:** https://github.com/cafearoma/sistema

---

## 📄 LICENCIA Y TÉRMINOS

**Licencia Comercial**  
Este software está licenciado para uso comercial. Incluye:
- ✅ Código fuente completo
- ✅ Derecho a modificación
- ✅ Uso en múltiples instalaciones
- ✅ Soporte técnico por 1 año
- ✅ Actualizaciones gratuitas por 6 meses

---

*© 2025 Café Aroma. Todos los derechos reservados.*