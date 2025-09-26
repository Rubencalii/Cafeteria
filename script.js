// ==========================================
// ARCHIVO PRINCIPAL JAVASCRIPT CONSOLIDADO
// ==========================================

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todos los componentes
    initializeParticles();
    initializeCursor();
    initializeNavigation();
    initializeReservationSystem();
    initializeContactForm();
    initializeGallery();
    initializeThemeToggle();
    initializeScrollEffects();
    initializeMenuLoader();
    initializePreloader();
});

// ==========================================
// SISTEMA DE PARTÍCULAS
// ==========================================
function initializeParticles() {
    // Efectos de Partículas de Café
    class CoffeeParticles {
        constructor() {
            this.canvas = document.getElementById('particleCanvas');
            if (!this.canvas) return;
            
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.maxParticles = 50;
            
            this.resize();
            this.init();
            this.animate();
            
            window.addEventListener('resize', () => this.resize());
        }
        
        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
        
        init() {
            for (let i = 0; i < this.maxParticles; i++) {
                this.particles.push(this.createParticle());
            }
        }
        
        createParticle() {
            return {
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: Math.random() * -0.5 - 0.2,
                opacity: Math.random() * 0.5 + 0.3,
                type: Math.random() > 0.7 ? 'bean' : 'steam',
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 2
            };
        }
        
        drawBean(particle) {
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation * Math.PI / 180);
            this.ctx.globalAlpha = particle.opacity;
            
            // Dibujar grano de café
            this.ctx.fillStyle = '#8B4513';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, particle.size, particle.size * 1.2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Línea central del grano
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -particle.size);
            this.ctx.lineTo(0, particle.size);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
        
        drawSteam(particle) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = '#E6E6FA';
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        updateParticle(particle) {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.rotation += particle.rotationSpeed;
            
            // Resetear partículas que salen de pantalla
            if (particle.y < -10 || particle.x < -10 || particle.x > this.canvas.width + 10) {
                particle.x = Math.random() * this.canvas.width;
                particle.y = this.canvas.height + 10;
                particle.speedX = (Math.random() - 0.5) * 0.5;
                particle.speedY = Math.random() * -0.5 - 0.2;
            }
        }
        
        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.particles.forEach(particle => {
                this.updateParticle(particle);
                
                if (particle.type === 'bean') {
                    this.drawBean(particle);
                } else {
                    this.drawSteam(particle);
                }
            });
            
            requestAnimationFrame(() => this.animate());
        }
    }
    
    // Inicializar partículas
    new CoffeeParticles();
}

// ==========================================
// CURSOR PERSONALIZADO
// ==========================================
function initializeCursor() {
    const cursor = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    
    if (!cursor || !cursorOutline) return;
    
    let mouseX = 0, mouseY = 0;
    let outlineX = 0, outlineY = 0;
    
    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });
    
    // Animación suave del outline
    function animateOutline() {
        outlineX += (mouseX - outlineX) * 0.1;
        outlineY += (mouseY - outlineY) * 0.1;
        
        cursorOutline.style.left = outlineX + 'px';
        cursorOutline.style.top = outlineY + 'px';
        
        requestAnimationFrame(animateOutline);
    }
    animateOutline();
    
    // Efectos hover
    document.querySelectorAll('a, button, .menu-card, .service-card').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(2)';
            cursorOutline.style.transform = 'scale(2)';
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
            cursorOutline.style.transform = 'scale(1)';
        });
    });
}

// ==========================================
// NAVEGACIÓN
// ==========================================
function initializeNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
                // Cerrar menú móvil si está abierto
                if (navMenu) navMenu.classList.remove('active');
            }
        });
    });
    
    // Navegación sticky
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                navbar.classList.add('sticky');
            } else {
                navbar.classList.remove('sticky');
            }
        });
    }
}

// ==========================================
// SISTEMA DE RESERVAS
// ==========================================
function initializeReservationSystem() {
    const reservationForm = document.getElementById('reservationForm');
    const reservationDate = document.getElementById('reservation-date');
    
    if (!reservationForm) return;
    
    // Configurar fechas
    if (reservationDate) {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 30);
        
        reservationDate.min = today.toISOString().split('T')[0];
        reservationDate.max = maxDate.toISOString().split('T')[0];
    }
    
    // Manejar envío del formulario
    reservationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const reservationData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            guests: parseInt(formData.get('guests')),
            date: formData.get('date'),
            time: formData.get('time'),
            message: formData.get('notes') || ''
        };
        
        const submitBtn = this.querySelector('.reservation-btn');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reservationData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                submitBtn.innerHTML = '<i class="fas fa-check"></i> ¡Reserva Confirmada!';
                submitBtn.style.background = '#28a745';
                
                setTimeout(() => {
                    showReservationConfirmation(reservationData, reservationForm);
                }, 1000);
            } else {
                throw new Error(result.message || 'Error al procesar la reserva');
            }
            
        } catch (error) {
            console.error('Error enviando reserva:', error);
            
            submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
            submitBtn.style.background = '#dc3545';
            
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
                
                alert('Error al procesar la reserva. Por favor, inténtalo de nuevo.');
            }, 2000);
        }
    });
}

function showReservationConfirmation(reservationData, form) {
    const confirmationMessage = `
        <div class="reservation-confirmation">
            <h3>¡Reserva Confirmada!</h3>
            <p><strong>Nombre:</strong> ${reservationData.name}</p>
            <p><strong>Fecha:</strong> ${new Date(reservationData.date).toLocaleDateString('es-ES')}</p>
            <p><strong>Hora:</strong> ${reservationData.time}</p>
            <p><strong>Personas:</strong> ${reservationData.guests}</p>
            <p class="confirmation-note">Te enviaremos un email de confirmación a ${reservationData.email}</p>
        </div>
    `;
    
    const formContainer = form.parentElement;
    formContainer.innerHTML = confirmationMessage;
    
    // Agregar estilos si no existen
    if (!document.getElementById('reservation-confirmation-styles')) {
        const confirmationStyles = `
            .reservation-confirmation {
                text-align: center;
                padding: 3rem;
                background: var(--cream);
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
            }
            
            .reservation-confirmation h3 {
                color: #28a745;
                font-size: 2rem;
                margin-bottom: 2rem;
            }
            
            .reservation-confirmation p {
                margin-bottom: 1rem;
                font-size: 1.1rem;
                color: var(--text-color);
            }
            
            .confirmation-note {
                font-style: italic;
                color: var(--text-light);
                margin-top: 2rem;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'reservation-confirmation-styles';
        styleSheet.textContent = confirmationStyles;
        document.head.appendChild(styleSheet);
    }
}

// ==========================================
// FORMULARIO DE CONTACTO
// ==========================================
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                submitBtn.textContent = '¡Mensaje enviado!';
                submitBtn.style.background = '#28a745';
                
                setTimeout(() => {
                    this.reset();
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.background = '';
                }, 3000);
            } else {
                throw new Error(result.message || 'Error al enviar el mensaje');
            }
            
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            
            submitBtn.textContent = 'Error al enviar';
            submitBtn.style.background = '#dc3545';
            
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
                
                alert('Error al enviar el mensaje. Por favor, inténtalo de nuevo.');
            }, 2000);
        }
    });
}

// ==========================================
// GALERÍA CON LIGHTBOX
// ==========================================
function initializeGallery() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.close-lightbox');
    
    // Filtros
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            galleryItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                    setTimeout(() => item.style.opacity = '1', 10);
                } else {
                    item.style.opacity = '0';
                    setTimeout(() => item.style.display = 'none', 300);
                }
            });
        });
    });
    
    // Lightbox
    if (lightbox && lightboxImg) {
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                lightboxImg.src = img.src;
                lightbox.style.display = 'flex';
                setTimeout(() => lightbox.classList.add('active'), 10);
            });
        });
        
        if (closeBtn) {
            closeBtn.addEventListener('click', closeLightbox);
        }
        
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
        });
    }
    
    function closeLightbox() {
        if (lightbox) {
            lightbox.classList.remove('active');
            setTimeout(() => lightbox.style.display = 'none', 300);
        }
    }
}

// ==========================================
// TEMA OSCURO/CLARO
// ==========================================
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
}

// ==========================================
// EFECTOS DE SCROLL
// ==========================================
function initializeScrollEffects() {
    // Scroll to top button
    const scrollTopBtn = document.getElementById('scroll-to-top');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });
        
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Intersection Observer para animaciones
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.menu-card, .service-card, .testimonial-card').forEach(el => {
        observer.observe(el);
    });
}

// ==========================================
// CARGADOR DE MENÚ DINÁMICO
// ==========================================
function initializeMenuLoader() {
    loadDynamicMenu();
}

async function loadDynamicMenu() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;
    
    try {
        const response = await fetch('/api/menu');
        const result = await response.json();
        
        if (result.success) {
            const items = result.data.items;
            renderMenuItems(items);
        } else {
            throw new Error('Error cargando el menú');
        }
        
    } catch (error) {
        console.error('Error cargando menú:', error);
        showMenuError();
    }
}

function renderMenuItems(items) {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;
    
    menuGrid.innerHTML = '';
    
    items.forEach((item, index) => {
        const menuCard = document.createElement('div');
        menuCard.className = 'menu-card';
        menuCard.style.animationDelay = `${index * 0.1}s`;
        
        const defaultImages = {
            'Café Caliente': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop&crop=center',
            'Café Frío': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop&crop=center',
            'Postres': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop&crop=center',
            'Desayunos': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=300&h=200&fit=crop&crop=center'
        };
        
        const imageUrl = item.image || defaultImages[item.category] || defaultImages['Café Caliente'];
        
        menuCard.innerHTML = `
            <img src="${imageUrl}" alt="${item.name}" onerror="this.src='${defaultImages['Café Caliente']}'">
            <div class="menu-card-content">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <span class="price">€${item.price.toFixed(2)}</span>
                <div class="category-badge">${item.category}</div>
            </div>
        `;
        
        menuGrid.appendChild(menuCard);
    });
    
    // Agregar estilos para categorías
    addMenuStyles();
}

function showMenuError() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;
    
    menuGrid.innerHTML = `
        <div class="menu-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error cargando el menú</p>
            <p>Por favor, inténtalo de nuevo más tarde.</p>
            <button class="retry-btn" onclick="loadDynamicMenu()">
                <i class="fas fa-redo"></i> Reintentar
            </button>
        </div>
    `;
}

function addMenuStyles() {
    if (document.getElementById('menu-category-styles')) return;
    
    const categoryStyles = `
        .category-badge {
            display: inline-block;
            background: var(--primary-color);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            margin-top: 0.5rem;
            opacity: 0.8;
        }
        
        .menu-card {
            animation: fadeInUp 0.6s ease forwards;
            opacity: 0;
            transform: translateY(30px);
        }
        
        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .animate-in {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'menu-category-styles';
    styleSheet.textContent = categoryStyles;
    document.head.appendChild(styleSheet);
}

// ==========================================
// PRELOADER
// ==========================================
function initializePreloader() {
    window.addEventListener('load', function() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;
        
        setTimeout(() => {
            preloader.classList.add('fade-out');
            document.body.style.overflow = 'visible';
            
            setTimeout(() => {
                preloader.remove();
            }, 500);
        }, 2500);
    });
}