# ☕ Café Aroma - Sistema de Reservas con Emails Reales

Un sistema completo de reservas para cafeterías con **emails reales automáticos** para confirmación y cancelación de reservas.

## 🌟 Características Principales

### ✅ **Sistema de Emails Reales**
- **Confirmación automática** de reservas por email
- **Cancelación automática** con notificación por email
- **Plantillas HTML profesionales** con diseño responsive
- **Soporte múltiples proveedores**: Gmail, SendGrid, Outlook
- **Logs de emails** con historial completo

### 🎯 **Funcionalidades del Sistema**
- **Reservas online** con validación completa
- **Panel de administración** avanzado
- **Base de datos real** SQLite con persistencia
- **Autenticación JWT** segura
- **API REST completa** para todas las operaciones
- **Responsive design** para móviles y desktop

### 📧 **Gestión de Emails**
- **Envío automático** al confirmar/rechazar reservas
- **Plantillas personalizables** con información del restaurante
- **Registro de actividad** administrativa
- **Pruebas de conexión** de email integradas

## 🚀 Instalación Rápida

### Opción A: Script Automático (Recomendado)
```bash
./setup.sh
```

### Opción B: Manual
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar email (IMPORTANTE)
cp .env.example .env
nano .env  # Configura tu email aquí

# 3. Inicializar base de datos
npm run init-db

# 4. Ejecutar servidor
npm run dev
```

## 📧 Configuración de Email (CRÍTICO)

### Gmail (Más Fácil)
1. **Activar verificación en 2 pasos** en tu cuenta Gmail
2. **Generar contraseña de aplicación**:
   - Google → Mi Cuenta → Seguridad → Contraseñas de aplicaciones
3. **Configurar en `.env`**:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicación
EMAIL_FROM_NAME=Café Aroma
EMAIL_FROM_ADDRESS=tu-email@gmail.com
```

### SendGrid (Profesional)
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=tu-api-key-de-sendgrid
EMAIL_FROM_NAME=Café Aroma
EMAIL_FROM_ADDRESS=noreply@tu-dominio.com
```

## 🌐 Acceso al Sistema

Una vez configurado:

- **🌐 Sitio Web**: http://localhost:3000
- **👨‍💼 Panel Admin**: http://localhost:3000/admin
- **🔐 Login Admin**: admin@cafearoma.com / admin123
- **⚡ API Health**: http://localhost:3000/api/health

## 📋 Flujo de Trabajo

### Para Clientes:
1. **Hacer reserva** en el sitio web
2. **Recibir confirmación** de que la reserva fue enviada
3. **Esperar email** del restaurante con confirmación/cancelación

### Para Administradores:
1. **Login** en el panel de administración
2. **Ver reservas** pendientes en tiempo real
3. **Confirmar ✅ o rechazar ❌** cada reserva
4. **Email automático** se envía al cliente instantáneamente
5. **Ver historial** de acciones y emails enviados

## 🎯 Ejemplo de Emails Enviados

### Email de Confirmación ✅
```
Asunto: ✅ Reserva Confirmada - Café Aroma #123
Contenido: 
- Saludo personalizado
- Detalles de la reserva
- Información importante del restaurante
- Instrucciones de llegada
- Datos de contacto
```

### Email de Cancelación ❌
```
Asunto: ❌ Reserva Cancelada - Café Aroma #123
Contenido:
- Disculpa profesional
- Motivo de cancelación
- Invitación a reservar otra fecha
- Enlaces para nueva reserva
```

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev              # Servidor con auto-reload
npm run start           # Servidor normal
npm run init-db         # Inicializar/resetear base de datos

# Producción
npm run production      # Servidor optimizado para producción
./setup.sh             # Instalación automática completa

# Mantenimiento
npm run test-email     # Probar configuración de email
```

## 📊 Estructura del Proyecto

```
Cafeteria/
├── 📄 Frontend
│   ├── index.html              # Sitio principal
│   ├── admin.html              # Panel de administración
│   ├── styles.css              # Estilos del sitio
│   ├── admin-styles.css        # Estilos del admin
│   ├── script.js               # JavaScript del sitio
│   └── admin.js                # JavaScript del admin
├── 🔧 Backend
│   ├── server-production.js    # Servidor optimizado
│   ├── backend/
│   │   ├── routes/             # APIs REST
│   │   │   ├── reservations.js # Gestión de reservas
│   │   │   ├── email.js        # Servicio de emails
│   │   │   ├── contact.js      # Mensajes de contacto
│   │   │   └── auth.js         # Autenticación
│   │   └── services/
│   │       └── emailService.js # Servicio de emails real
│   └── database/
│       ├── db.js               # Configuración SQLite
│       ├── init.js             # Inicialización de datos
│       └── cafe_aroma.db       # Base de datos
├── 📋 Configuración
│   ├── .env                    # Variables de entorno
│   ├── .env.example            # Plantilla de configuración
│   ├── package.json            # Dependencias del proyecto
│   └── setup.sh                # Script de instalación automática
└── 📖 Documentación
    ├── README.md               # Este archivo
    └── DEPLOYMENT.md           # Guía de despliegue completa
```

## 🔒 Seguridad Implementada

- **🔐 JWT Authentication** para panel de administración
- **🛡️ Helmet.js** para headers de seguridad
- **⚡ Rate Limiting** para prevenir spam
- **🌐 CORS configurado** correctamente
- **🔒 Validación de datos** en todas las APIs
- **📝 Logs de acciones** administrativas

## 📈 Características Avanzadas

### 🎨 Interfaz Moderna
- **Diseño responsive** para todos los dispositivos
- **Animaciones CSS** fluidas y profesionales
- **Notificaciones en tiempo real** con toasts
- **Modal de preview** de emails enviados
- **Dashboard administrativo** con estadísticas

### 📊 Sistema de Gestión
- **Estadísticas en tiempo real** de reservas
- **Filtros avanzados** por fecha y estado
- **Historial de acciones** administrativas
- **Logs de emails** con estado de entrega
- **Exportación de datos** (próximamente)

## 🚀 Despliegue en Producción

### Opciones Soportadas:
- **🌊 DigitalOcean** App Platform ($5/mes)
- **🟣 Heroku** (Gratuito con limitaciones)
- **⚡ Vercel** (Gratuito para proyectos personales)
- **🐧 VPS/Servidor** propio con PM2

Ver **DEPLOYMENT.md** para guías detalladas de cada plataforma.

## 🛠️ Requisitos del Sistema

### Mínimos
- **Node.js**: 14.0.0+
- **NPM**: 6.0.0+
- **RAM**: 512MB
- **Disco**: 500MB

### Recomendados
- **Node.js**: 18.0.0 LTS
- **RAM**: 2GB
- **Disco SSD**: 5GB
- **Conexión email**: Gmail/SendGrid configurado

## 🔧 APIs Disponibles

```bash
# Reservas
GET    /api/reservations        # Listar reservas
POST   /api/reservations        # Crear reserva
PATCH  /api/reservations/:id/status  # Cambiar estado (envía email automático)

# Emails
POST   /api/email/send-reservation    # Enviar email de reserva
GET    /api/email/test-connection     # Probar conexión
GET    /api/email/history            # Historial de emails

# Sistema
GET    /api/health               # Estado del servidor
```

## 🐛 Solución de Problemas

### ❌ "Cannot send email"
1. Verificar configuración en `.env`
2. Para Gmail: usar contraseña de aplicación (no la normal)
3. Probar conexión: `curl http://localhost:3000/api/email/test-connection`

### ❌ "Address already in use"
```bash
# Cambiar puerto en .env
PORT=3001
```

### ❌ "Database error"
```bash
# Reinicializar base de datos
npm run init-db
```

## 📞 Soporte

- **📖 Documentación completa**: DEPLOYMENT.md
- **🔍 Estado del sistema**: http://localhost:3000/api/health
- **📧 Probar email**: http://localhost:3000/api/email/test-connection
- **📝 Logs**: Revisar consola del navegador y terminal

## 📄 Licencia

MIT - Puedes usar este proyecto para tu restaurante/cafetería.

---

## ✅ Lista de Verificación Pre-Producción

- [ ] **Email configurado** y probado
- [ ] **Variables de entorno** configuradas
- [ ] **Base de datos** inicializada
- [ ] **Reserva de prueba** realizada y confirmada
- [ ] **Email de confirmación** recibido
- [ ] **Panel de administración** accesible
- [ ] **Dominio y SSL** configurados (producción)

**¡Tu Café Aroma está listo para recibir reservas con emails reales!** ☕🎉