// Efectos de Partículas de Café
class CoffeeParticles {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
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
        
        // Línea del centro del grano
        this.ctx.strokeStyle = '#5D4E37';
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -particle.size * 0.8);
        this.ctx.bezierCurveTo(
            -particle.size * 0.3, -particle.size * 0.2,
            particle.size * 0.3, particle.size * 0.2,
            0, particle.size * 0.8
        );
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawSteam(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.opacity;
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    updateParticle(particle) {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;
        
        // Resetear partícula si sale de la pantalla
        if (particle.y < -10) {
            particle.y = this.canvas.height + 10;
            particle.x = Math.random() * this.canvas.width;
        }
        
        if (particle.x < -10 || particle.x > this.canvas.width + 10) {
            particle.x = Math.random() * this.canvas.width;
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

// Inicializar partículas cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    new CoffeeParticles();
    
    // Cursor Personalizado
    const cursor = document.querySelector('.custom-cursor');
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    
    let mouseX = 0;
    let mouseY = 0;
    let outlineX = 0;
    let outlineY = 0;
    
    // Solo inicializar cursor en dispositivos no táctiles
    if (window.matchMedia('(hover: hover)').matches) {
        document.addEventListener('mousemove', function(e) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });
        
        // Animación suave para el outline
        function animateOutline() {
            outlineX += (mouseX - outlineX) * 0.1;
            outlineY += (mouseY - outlineY) * 0.1;
            
            cursorOutline.style.left = outlineX + 'px';
            cursorOutline.style.top = outlineY + 'px';
            
            requestAnimationFrame(animateOutline);
        }
        animateOutline();
        
        // Efectos hover
        const hoverElements = document.querySelectorAll('a, button, .btn, .menu-card, .service-card, .testimonial-card, .gallery-item, .nav-menu li, .theme-switch, .scroll-to-top');
        
        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                cursor.classList.add('cursor-hover');
            });
            
            element.addEventListener('mouseleave', function() {
                cursor.classList.remove('cursor-hover');
            });
            
            element.addEventListener('mousedown', function() {
                cursor.classList.add('cursor-click');
            });
            
            element.addEventListener('mouseup', function() {
                cursor.classList.remove('cursor-click');
            });
        });
        
        // Efecto click global
        document.addEventListener('mousedown', function() {
            cursor.classList.add('cursor-click');
        });
        
        document.addEventListener('mouseup', function() {
            cursor.classList.remove('cursor-click');
        });
    }
});

// Theme Toggle (Modo Oscuro/Claro)
const themeSwitch = document.querySelector('#checkbox');
const currentTheme = localStorage.getItem('theme');

// Aplicar tema guardado
if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    if (currentTheme === 'dark') {
        themeSwitch.checked = true;
    }
}

// Cambiar tema
function switchTheme(e) {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }    
}

themeSwitch.addEventListener('change', switchTheme, false);

// Scroll to Top Button
const scrollToTopBtn = document.getElementById('scrollToTop');

window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('show');
    } else {
        scrollToTopBtn.classList.remove('show');
    }
});

scrollToTopBtn.addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Preloader
window.addEventListener('load', function() {
    const preloader = document.getElementById('preloader');
    
    // Simular tiempo de carga
    setTimeout(() => {
        preloader.classList.add('fade-out');
        document.body.style.overflow = 'visible';
        
        // Remover el preloader del DOM después de la animación
        setTimeout(() => {
            preloader.remove();
        }, 500);
    }, 2500); // 2.5 segundos de preloader
});

// Sistema de Reservas
document.addEventListener('DOMContentLoaded', function() {
    const reservationForm = document.getElementById('reservationForm');
    const reservationDate = document.getElementById('reservation-date');
    
    // Establecer fecha mínima (hoy)
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 30); // Máximo 30 días adelante
    
    reservationDate.min = today.toISOString().split('T')[0];
    reservationDate.max = maxDate.toISOString().split('T')[0];
    
    // Manejar envío del formulario de reserva
    if (reservationForm) {
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
            
            // Estado de carga
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
                    
                    // Mostrar confirmación después de un momento
                    setTimeout(() => {
                        showReservationConfirmation(reservationData);
                    }, 1000);
                } else {
                    throw new Error(result.message || 'Error al procesar la reserva');
                }
                
            } catch (error) {
                console.error('Error enviando reserva:', error);
                
                submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
                submitBtn.style.background = '#dc3545';
                
                // Mostrar mensaje de error
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                    
                    alert('Error al procesar la reserva. Por favor, inténtalo de nuevo.');
                }, 2000);
            }
        });
    }
    
    function showReservationConfirmation(reservationData) {
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
        
        const formContainer = reservationForm.parentElement;
        formContainer.innerHTML = confirmationMessage;
                
                // Agregar estilos para el mensaje de confirmación
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
                
                // Agregar estilos si no existen
                if (!document.getElementById('reservation-confirmation-styles')) {
                    const styleSheet = document.createElement('style');
                    styleSheet.id = 'reservation-confirmation-styles';
                    styleSheet.textContent = confirmationStyles;
                    document.head.appendChild(styleSheet);
                }
            }
        });
    }
    
    // Función para mostrar confirmación de reserva
    function showReservationConfirmation(reservationData) {
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
        
        const formContainer = reservationForm.parentElement;
        formContainer.innerHTML = confirmationMessage;
        
        // Agregar estilos para el mensaje de confirmación si no existen
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
});

// Galería con Lightbox
document.addEventListener('DOMContentLoaded', function() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    let currentImageIndex = 0;
    let visibleImages = [...galleryItems];
    
    // Filtrado de galería
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Actualizar botón activo
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Filtrar imágenes
            visibleImages = [];
            galleryItems.forEach((item, index) => {
                const category = item.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    item.classList.remove('hidden');
                    item.style.animation = 'fadeInUp 0.6s ease-out';
                    visibleImages.push(item);
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
    
    // Abrir lightbox
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            currentImageIndex = visibleImages.indexOf(this);
            const img = this.querySelector('img');
            lightboxImg.src = img.src.replace('w=400&h=400', 'w=1200&h=800');
            lightboxImg.alt = img.alt;
            lightbox.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    });
    
    // Cerrar lightbox
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    function closeLightbox() {
        lightbox.classList.remove('show');
        document.body.style.overflow = 'visible';
    }
    
    // Navegación en lightbox
    prevBtn.addEventListener('click', function() {
        currentImageIndex = (currentImageIndex - 1 + visibleImages.length) % visibleImages.length;
        updateLightboxImage();
    });
    
    nextBtn.addEventListener('click', function() {
        currentImageIndex = (currentImageIndex + 1) % visibleImages.length;
        updateLightboxImage();
    });
    
    function updateLightboxImage() {
        const currentItem = visibleImages[currentImageIndex];
        const img = currentItem.querySelector('img');
        lightboxImg.src = img.src.replace('w=400&h=400', 'w=1200&h=800');
        lightboxImg.alt = img.alt;
    }
    
    // Navegación con teclado
    document.addEventListener('keydown', function(e) {
        if (lightbox.classList.contains('show')) {
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                prevBtn.click();
            } else if (e.key === 'ArrowRight') {
                nextBtn.click();
            }
        }
    });
});

// Funcionalidad del menú móvil
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Cerrar menú al hacer click en un enlace
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Cerrar menú al hacer scroll
    window.addEventListener('scroll', function() {
        if (navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
});

// Navegación suave
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Efecto parallax suave solo en el hero
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero-image img');
    if (parallax && scrolled < window.innerHeight) {
        const speed = scrolled * 0.3;
        parallax.style.transform = `translateY(${speed}px)`;
    }
});

// Animaciones al hacer scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// Observar elementos para animaciones
document.querySelectorAll('.menu-card, .service-card, .testimonial-card, .award-card, .about-text, .about-image').forEach(el => {
    observer.observe(el);
});

// Contador animado para estadísticas
function animateCounter(element, target, duration = 2000) {
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString() + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString() + '+';
        }
    }, 16);
}

// Activar contadores cuando la sección sea visible
const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const numbers = entry.target.querySelectorAll('.number');
            numbers.forEach((number, index) => {
                const targets = [50000, 5000, 8]; // Valores objetivo
                setTimeout(() => {
                    animateCounter(number, targets[index], 2000);
                }, index * 200);
            });
            statsObserver.unobserve(entry.target);
        }
    });
});

const statsSection = document.querySelector('.about-stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Efecto hover mejorado para las tarjetas
document.querySelectorAll('.menu-card, .service-card, .testimonial-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Loading suave para imágenes
document.querySelectorAll('img').forEach(img => {
    img.addEventListener('load', function() {
        this.style.opacity = '1';
        this.style.transition = 'opacity 0.5s ease';
    });
    
    // Si la imagen ya está cargada
    if (img.complete) {
        img.style.opacity = '1';
    } else {
        img.style.opacity = '0';
    }
});

// Manejar envío del formulario de contacto
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const contactData = {
                name: formData.get('name'),
                email: formData.get('email'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };
            
            // Estado de carga
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
                    
                    // Resetear formulario después de un momento
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
});

// Efecto de escritura para el eslogan
function typeWriter(element, text, speed = 100) {
    if (!element) return;
    
    element.textContent = '';
    let i = 0;
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Activar efecto de escritura cuando la página carga
window.addEventListener('load', function() {
    const tagline = document.querySelector('.tagline');
    if (tagline) {
        const originalText = tagline.textContent;
        setTimeout(() => {
            typeWriter(tagline, originalText, 80);
        }, 1000);
    }
});

// Mejorar la experiencia de navegación con indicadores activos
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionHeight = section.offsetHeight;
        
        if (sectionTop <= 100 && sectionTop + sectionHeight > 100) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Preloader simple
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

// Agregar estilos para el preloader y elementos activos
const additionalStyles = `
    body {
        opacity: 0;
        transition: opacity 0.5s ease;
    }
    
    body.loaded {
        opacity: 1;
    }
    
    .nav-menu a.active {
        color: var(--primary-color) !important;
    }
    
    .nav-menu a.active::after {
        width: 100% !important;
        left: 0 !important;
    }
    
    @media (max-width: 968px) {
        .nav-menu a.active {
            background: var(--warm-beige);
            padding: 0.5rem 1rem;
            border-radius: 8px;
        }
    }
`;

const additionalStyleSheet = document.createElement('style');
additionalStyleSheet.textContent = additionalStyles;
document.head.appendChild(additionalStyleSheet);

// Cargar menú dinámicamente desde la API
document.addEventListener('DOMContentLoaded', function() {
    loadDynamicMenu();
});

// Función para cargar el menú desde la API
async function loadDynamicMenu() {
    const menuGrid = document.getElementById('menu-grid');
    
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

// Renderizar elementos del menú
function renderMenuItems(items) {
    const menuGrid = document.getElementById('menu-grid');
    
    // Limpiar contenido actual
    menuGrid.innerHTML = '';
    
    // Agrupar items por categoría para mejor presentación
    const categories = {};
    items.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });
    
    // Mostrar elementos del menú
    items.forEach((item, index) => {
        const menuCard = document.createElement('div');
        menuCard.className = 'menu-card';
        menuCard.style.animationDelay = `${index * 0.1}s`;
        
        // Imagen por defecto basada en categoría
        const defaultImages = {
            'Café Caliente': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop&crop=center',
            'Café Frío': 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=200&fit=crop&crop=center',
            'Postres': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop&crop=center',
            'Desayunos': 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=300&h=200&fit=crop&crop=center'
        };
        
        const imageUrl = item.image || defaultImages[item.category] || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop&crop=center';
        
        menuCard.innerHTML = `
            <img src="${imageUrl}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=200&fit=crop&crop=center'">
            <div class="menu-card-content">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <span class="price">€${item.price.toFixed(2)}</span>
                <div class="category-badge">${item.category}</div>
            </div>
        `;
        
        menuGrid.appendChild(menuCard);
    });
    
    // Agregar estilos para las categorías si no existen
    if (!document.getElementById('menu-category-styles')) {
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
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'menu-category-styles';
        styleSheet.textContent = categoryStyles;
        document.head.appendChild(styleSheet);
    }
}

// Mostrar error al cargar menú
function showMenuError() {
    const menuGrid = document.getElementById('menu-grid');
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