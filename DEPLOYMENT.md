# 🚀 CAFÉ AROMA - GUÍA DE INSTALACIÓN Y DESPLIEGUE

## 📋 Tabla de Contenidos
- [Requisitos del Sistema](#requisitos-del-sistema)
- [Instalación Local](#instalación-local)
- [Configuración de Email](#configuración-de-email)
- [Despliegue en Producción](#despliegue-en-producción)
- [Variables de Entorno](#variables-de-entorno)
- [Comandos Útiles](#comandos-útiles)
- [Solución de Problemas](#solución-de-problemas)

## 📋 Requisitos del Sistema

### Mínimos
- **Node.js**: 14.0.0 o superior
- **NPM**: 6.0.0 o superior
- **Sistema Operativo**: Linux, macOS, Windows
- **RAM**: 512MB mínimo
- **Disco**: 500MB libres

### Recomendados para Producción
- **Node.js**: 18.0.0 LTS o superior
- **RAM**: 2GB o superior
- **Disco SSD**: 5GB libres
- **SSL/TLS**: Certificado válido
- **Dominio**: Propio configurado

## 🔧 Instalación Local

### 1. Clonar o Descargar el Proyecto
```bash
# Si tienes Git
git clone <tu-repositorio>
cd Cafeteria

# O descomprime el archivo ZIP descargado
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar configuración
nano .env
```

### 4. Configurar Email (IMPORTANTE)
Edita el archivo `.env` con tu configuración de email:

#### Opción A: Gmail (Más Fácil)
```env
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicación
EMAIL_FROM_NAME=Café Aroma
EMAIL_FROM_ADDRESS=tu-email@gmail.com
```

**⚠️ IMPORTANTE**: Para Gmail, necesitas generar una "Contraseña de Aplicación":
1. Ve a tu cuenta de Google
2. Seguridad → Verificación en 2 pasos (debe estar activada)
3. Contraseñas de aplicaciones → Generar nueva
4. Usa esa contraseña en `EMAIL_PASSWORD`

#### Opción B: SendGrid (Profesional)
```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=tu-api-key-de-sendgrid
EMAIL_FROM_NAME=Café Aroma
EMAIL_FROM_ADDRESS=noreply@tu-dominio.com
```

### 5. Inicializar Base de Datos
```bash
npm run init-db
```

### 6. Ejecutar en Desarrollo
```bash
npm run dev
```

### 7. Abrir en el Navegador
- **Sitio Web**: http://localhost:3000
- **Panel Admin**: http://localhost:3000/admin
- **Login Admin**: admin@cafearoma.com / admin123

## 📧 Configuración de Email

### Gmail - Paso a Paso

1. **Activar 2FA** en tu cuenta de Google
2. **Ir a Contraseñas de Aplicación**:
   - Google → Mi Cuenta → Seguridad
   - Verificación en dos pasos → Contraseñas de aplicaciones
3. **Generar contraseña** para "Correo"
4. **Usar esa contraseña** en el archivo `.env`

### SendGrid - Paso a Paso

1. **Crear cuenta** en [SendGrid](https://sendgrid.com)
2. **Verificar dominio** (recomendado)
3. **Generar API Key**:
   - Settings → API Keys → Create API Key
   - Full Access o Mail Send (mínimo)
4. **Configurar en `.env`**

### Outlook/Hotmail

```env
EMAIL_SERVICE=outlook
EMAIL_USER=tu-email@hotmail.com
EMAIL_PASSWORD=tu-contraseña
EMAIL_FROM_NAME=Café Aroma
EMAIL_FROM_ADDRESS=tu-email@hotmail.com
```

## 🌐 Despliegue en Producción

### 1. Preparar Archivos de Producción

```bash
# Actualizar dependencias
npm install --production

# Crear archivo .env de producción
cp .env.example .env.production
```

### 2. Configurar Variables de Producción

Edita `.env.production`:
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Tu dominio real
CORS_ORIGIN=https://tu-dominio.com
RESTAURANT_WEBSITE=https://tu-dominio.com

# Email real configurado
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=tu-api-key-real
EMAIL_FROM_ADDRESS=noreply@tu-dominio.com

# Seguridad
JWT_SECRET=clave-super-segura-de-64-caracteres-minimo-para-produccion
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Opciones de Despliegue

#### Opción A: VPS/Servidor Dedicado

```bash
# Instalar PM2 para gestión de procesos
npm install -g pm2

# Inicializar base de datos
NODE_ENV=production npm run init-db

# Ejecutar con PM2
pm2 start server-production.js --name "cafe-aroma"
pm2 startup
pm2 save
```

#### Opción B: Heroku

```bash
# Instalar Heroku CLI y login
heroku create tu-cafe-aroma

# Configurar variables de entorno
heroku config:set NODE_ENV=production
heroku config:set EMAIL_SERVICE=sendgrid
heroku config:set SENDGRID_API_KEY=tu-api-key
# ... más variables

# Deploy
git push heroku main
```

#### Opción C: Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en el panel de Vercel
```

#### Opción D: DigitalOcean App Platform

1. Conectar repositorio de GitHub
2. Configurar variables de entorno en el panel
3. Seleccionar plan (básico $5/mes suficiente)
4. Deploy automático

### 4. Configurar Dominio y SSL

#### Con Nginx (Recomendado)
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Con Cloudflare (Fácil)
1. Agregar dominio a Cloudflare
2. Configurar DNS apuntando a tu servidor
3. SSL automático habilitado

## 🔧 Variables de Entorno Importantes

### Servidor
```env
NODE_ENV=production          # Entorno (development/production)
PORT=3000                   # Puerto del servidor
HOST=0.0.0.0               # Host (0.0.0.0 para producción)
```

### Base de Datos
```env
DB_PATH=./database/cafe_aroma.db    # Ruta de la base de datos
```

### Autenticación
```env
JWT_SECRET=clave-super-segura       # Clave JWT (mínimo 64 caracteres)
JWT_EXPIRES_IN=7d                   # Expiración del token
```

### Email
```env
EMAIL_SERVICE=sendgrid              # Servicio (gmail/sendgrid/outlook)
EMAIL_USER=email@dominio.com        # Usuario (para Gmail/Outlook)
EMAIL_PASSWORD=contraseña           # Contraseña/API Key
EMAIL_FROM_NAME=Café Aroma          # Nombre del remitente
EMAIL_FROM_ADDRESS=noreply@dominio.com # Email del remitente
```

### Restaurante
```env
RESTAURANT_NAME=Café Aroma
RESTAURANT_ADDRESS=Tu dirección completa
RESTAURANT_PHONE=+34 900 123 456
RESTAURANT_EMAIL=info@tu-dominio.com
RESTAURANT_WEBSITE=https://tu-dominio.com
```

### Seguridad
```env
RATE_LIMIT_WINDOW_MS=900000         # Ventana de límite (15 min)
RATE_LIMIT_MAX_REQUESTS=100         # Máximo requests por ventana
CORS_ORIGIN=https://tu-dominio.com  # Origen permitido para CORS
```

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run dev                 # Servidor con auto-reload
npm run start              # Servidor normal
npm run init-db            # Inicializar base de datos

# Producción
npm run production         # Servidor optimizado para producción
npm run setup             # Instalar deps e inicializar DB

# Mantenimiento
pm2 restart cafe-aroma     # Reiniciar aplicación
pm2 logs cafe-aroma        # Ver logs
pm2 status                 # Estado de procesos
```

## 🐛 Solución de Problemas

### Error: "Address already in use"
```bash
# Encontrar proceso usando el puerto
lsof -i :3000

# Matar proceso
kill -9 <PID>

# O cambiar puerto en .env
PORT=3001
```

### Error: "Cannot send email"
1. **Verificar configuración** de email en `.env`
2. **Gmail**: Asegurar contraseña de aplicación (no la normal)
3. **SendGrid**: Verificar API key y dominio
4. **Probar conexión**:
```bash
curl http://localhost:3000/api/email/test-connection
```

### Error: "Database not found"
```bash
# Reinicializar base de datos
npm run init-db

# Verificar permisos de escritura
chmod 755 database/
chmod 644 database/cafe_aroma.db
```

### Error: "CORS policy"
- Verificar `CORS_ORIGIN` en `.env`
- Para desarrollo local: `CORS_ORIGIN=http://localhost:3000`
- Para producción: `CORS_ORIGIN=https://tu-dominio.com`

### Error: "JWT token invalid"
- Verificar `JWT_SECRET` en `.env`
- Asegurar que tiene al menos 32 caracteres
- Reiniciar servidor después de cambios

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real
```bash
# Con PM2
pm2 logs cafe-aroma --lines 100

# Con Node directo
tail -f logs/app.log
```

### Monitoreo de Rendimiento
```bash
# Con PM2
pm2 monit

# Estadísticas del sistema
pm2 status
```

## 🔄 Actualizaciones

### Actualizar la Aplicación
```bash
# Hacer backup de la base de datos
cp database/cafe_aroma.db database/backup-$(date +%Y%m%d).db

# Actualizar código
git pull origin main

# Instalar nuevas dependencias
npm install

# Reiniciar aplicación
pm2 restart cafe-aroma
```

## 🆘 Soporte

### Información del Sistema
```bash
# Obtener información de diagnóstico
curl http://localhost:3000/api/health

# Verificar configuración de email
curl http://localhost:3000/api/email/test-connection
```

### Contacto
- **Documentación**: README.md
- **Logs de errores**: Revisar consola del navegador y logs del servidor
- **Base de datos**: SQLite en `database/cafe_aroma.db`

---

## ✅ Lista de Verificación Pre-Despliegue

- [ ] Variables de entorno configuradas
- [ ] Email funcional (probado con test)
- [ ] Base de datos inicializada
- [ ] Dominio y DNS configurados
- [ ] SSL/HTTPS habilitado
- [ ] Backup de datos configurado
- [ ] Monitoreo activo (PM2/logs)
- [ ] Contraseña de admin cambiada
- [ ] Límites de rate limiting configurados
- [ ] CORS origin configurado correctamente

¡Tu Café Aroma está listo para recibir clientes! ☕🎉