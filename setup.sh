#!/bin/bash

# 🚀 SCRIPT DE INSTALACIÓN AUTOMÁTICA - CAFÉ AROMA
# Este script configura automáticamente el sistema de reservas con emails reales

echo "
🚀 ===================================
   CAFÉ AROMA - INSTALACIÓN AUTOMÁTICA
   ===================================
"

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar si Node.js está instalado
check_node() {
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node -v)
        print_success "Node.js está instalado: $NODE_VERSION"
        
        # Verificar versión mínima
        REQUIRED_VERSION="14.0.0"
        if node -e "process.exit(process.version.slice(1).split('.').map(Number).some((v,i) => v < '$REQUIRED_VERSION'.split('.')[i]) ? 1 : 0)"; then
            print_error "Se requiere Node.js >= $REQUIRED_VERSION. Versión actual: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js no está instalado. Por favor instálalo desde https://nodejs.org/"
        exit 1
    fi
}

# Verificar si npm está instalado
check_npm() {
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm -v)
        print_success "NPM está instalado: $NPM_VERSION"
    else
        print_error "NPM no está instalado. Se instala automáticamente con Node.js"
        exit 1
    fi
}

# Instalar dependencias
install_dependencies() {
    print_info "Instalando dependencias de Node.js..."
    
    if npm install; then
        print_success "Dependencias instaladas correctamente"
    else
        print_error "Error instalando dependencias"
        exit 1
    fi
}

# Configurar archivo .env
configure_env() {
    print_info "Configurando variables de entorno..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Archivo .env creado desde plantilla"
    else
        print_warning "El archivo .env ya existe, no se sobrescribirá"
    fi
    
    echo ""
    print_warning "IMPORTANTE: Debes configurar tu email en el archivo .env"
    print_info "Edita el archivo .env y configura:"
    echo "  • EMAIL_SERVICE (gmail/sendgrid/outlook)"
    echo "  • EMAIL_USER (tu email)"
    echo "  • EMAIL_PASSWORD (contraseña de aplicación)"
    echo ""
}

# Inicializar base de datos
init_database() {
    print_info "Inicializando base de datos..."
    
    if npm run init-db; then
        print_success "Base de datos inicializada correctamente"
    else
        print_error "Error inicializando base de datos"
        exit 1
    fi
}

# Probar la aplicación
test_app() {
    print_info "Ejecutando pruebas básicas..."
    
    # Verificar que los archivos críticos existen
    critical_files=(
        "server-production.js"
        "package.json"
        "database/db.js"
        "backend/services/emailService.js"
        "index.html"
        "admin.html"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "Archivo $file encontrado"
        else
            print_error "Archivo crítico no encontrado: $file"
            exit 1
        fi
    done
}

# Función principal
main() {
    echo "Iniciando instalación automática..."
    echo ""
    
    # Verificaciones del sistema
    print_info "Verificando requisitos del sistema..."
    check_node
    check_npm
    echo ""
    
    # Instalación
    install_dependencies
    echo ""
    
    configure_env
    echo ""
    
    init_database
    echo ""
    
    test_app
    echo ""
    
    # Mensaje final
    echo "
🎉 ===================================
   ¡INSTALACIÓN COMPLETADA!
   ===================================
    
✅ Próximos pasos:

1. CONFIGURAR EMAIL:
   nano .env
   (Configura EMAIL_SERVICE, EMAIL_USER, EMAIL_PASSWORD)

2. EJECUTAR EN DESARROLLO:
   npm run dev

3. EJECUTAR EN PRODUCCIÓN:
   npm run production

4. ACCEDER A LA APLICACIÓN:
   • Sitio web: http://localhost:3000
   • Admin: http://localhost:3000/admin
   • Login: admin@cafearoma.com / admin123

5. PROBAR EMAIL:
   curl http://localhost:3000/api/email/test-connection

📖 Documentación completa: DEPLOYMENT.md

🆘 Si tienes problemas:
   • Revisa los logs en la consola
   • Verifica la configuración de email
   • Consulta DEPLOYMENT.md para más detalles

¡Tu Café Aroma está listo para recibir reservas con emails reales! ☕
"
}

# Ejecutar función principal
main "$@"