<?php
// Inicializar sesión
session_start();

// Incluir configuración
require_once 'php/config/config.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Café Aroma - Tu rincón de sabor</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <!-- Efectos de Partículas -->
    <canvas id="particleCanvas"></canvas>
    
    <!-- SVG Ondas Animadas -->
    <div class="svg-waves">
        <svg class="wave-top" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" class="shape-fill-1"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" class="shape-fill-2"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" class="shape-fill-3"></path>
        </svg>
        
        <svg class="wave-bottom" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" class="shape-fill-4"></path>
        </svg>
    </div>
    
    <!-- Cursor Personalizado -->
    <div class="custom-cursor">
        <div class="cursor-dot"></div>
        <div class="cursor-outline"></div>
    </div>
    
    <!-- Preloader -->
    <div id="preloader" class="preloader">
        <div class="preloader-content">
            <div class="coffee-cup">
                <div class="cup">
                    <div class="coffee-liquid"></div>
                    <div class="coffee-foam"></div>
                    <div class="cup-handle"></div>
                </div>
                <div class="steam">
                    <div class="steam-line steam-1"></div>
                    <div class="steam-line steam-2"></div>
                    <div class="steam-line steam-3"></div>
                </div>
            </div>
            <h2>Café Aroma</h2>
            <p>Preparando tu experiencia...</p>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
        </div>
    </div>
    
    <!-- Header -->
    <header class="header">
        <nav class="nav">
            <div class="nav-container">
                <div class="logo">
                    <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop&crop=center" alt="Café Aroma Logo">
                    <span>Café Aroma</span>
                </div>
                <ul class="nav-menu">
                    <li><a href="#home">Inicio</a></li>
                    <li><a href="#about">Nosotros</a></li>
                    <li><a href="#menu">Menú</a></li>
                    <li><a href="#awards">Premios</a></li>
                    <li><a href="#services">Servicios</a></li>
                    <li><a href="#gallery">Galería</a></li>
                    <li><a href="#testimonials">Testimonios</a></li>
                    <li><a href="#reservations">Reservas</a></li>
                    <li><a href="#contact">Contacto</a></li>
                    <li>
                        <div class="theme-switch-wrapper">
                            <label class="theme-switch" for="checkbox">
                                <input type="checkbox" id="checkbox" />
                                <div class="slider round">
                                    <i class="fas fa-sun sun-icon"></i>
                                    <i class="fas fa-moon moon-icon"></i>
                                </div>
                            </label>
                        </div>
                    </li>
                </ul>
                <div class="hamburger">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </nav>
        
        <section id="home" class="hero">
            <div class="hero-content">
                <h1 class="glow-text">Café Aroma</h1>
                <p class="tagline">Donde cada taza cuenta una historia</p>
                <p class="hero-description">Bienvenido a nuestro acogedor espacio donde el aroma del café recién tostado se mezcla con momentos únicos</p>
                <div class="hero-buttons">
                    <a href="#menu" class="btn btn-primary glow-btn">
                        <i class="fas fa-coffee"></i>
                        Explorar Menú
                    </a>
                    <a href="#reservations" class="btn btn-secondary glow-btn">
                        <i class="fas fa-calendar-alt"></i>
                        Hacer Reserva
                    </a>
                </div>
            </div>
        </section>
    </header>

    <!-- About Section -->
    <section id="about" class="about">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Nuestra Historia</h2>
                <p class="section-subtitle">Descubre la pasión detrás de cada taza</p>
            </div>
            
            <div class="about-content">
                <div class="about-text">
                    <div class="about-item">
                        <div class="about-icon">
                            <i class="fas fa-heart"></i>
                        </div>
                        <div class="about-info">
                            <h3>Pasión por el Café</h3>
                            <p>Desde 2010, hemos dedicado nuestras vidas a perfeccionar el arte del café. Cada grano es seleccionado cuidadosamente para ofrecerte la mejor experiencia.</p>
                        </div>
                    </div>
                    
                    <div class="about-item">
                        <div class="about-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="about-info">
                            <h3>Comunidad</h3>
                            <p>Más que una cafetería, somos un lugar de encuentro donde se crean memorias, se forjan amistades y se celebra la vida.</p>
                        </div>
                    </div>
                    
                    <div class="about-item">
                        <div class="about-icon">
                            <i class="fas fa-leaf"></i>
                        </div>
                        <div class="about-info">
                            <h3>Sostenibilidad</h3>
                            <p>Comprometidos con el medio ambiente, trabajamos con productores locales y utilizamos métodos sostenibles en todo nuestro proceso.</p>
                        </div>
                    </div>
                </div>
                
                <div class="about-image">
                    <img src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&h=400&fit=crop&crop=center" alt="Interior del café">
                    <div class="about-stats">
                        <div class="stat">
                            <span class="stat-number">15+</span>
                            <span class="stat-label">Años de experiencia</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">10K+</span>
                            <span class="stat-label">Clientes felices</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">50+</span>
                            <span class="stat-label">Recetas únicas</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Menu Section -->
    <section id="menu" class="menu">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Nuestro Menú</h2>
                <p class="section-subtitle">Descubre nuestras deliciosas creaciones</p>
            </div>
            
            <div class="menu-filters">
                <button class="filter-btn active" data-filter="all">Todo</button>
                <button class="filter-btn" data-filter="Café Caliente">Café Caliente</button>
                <button class="filter-btn" data-filter="Café Frío">Café Frío</button>
                <button class="filter-btn" data-filter="Postres">Postres</button>
                <button class="filter-btn" data-filter="Desayunos">Desayunos</button>
            </div>
            
            <div class="menu-grid" id="menuItems">
                <!-- Los elementos del menú se cargarán dinámicamente con JavaScript -->
            </div>
        </div>
    </section>

    <!-- Awards Section -->
    <section id="awards" class="awards">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Reconocimientos</h2>
                <p class="section-subtitle">La calidad que nos distingue</p>
            </div>
            
            <div class="awards-grid">
                <div class="award-card">
                    <div class="award-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <h3>Mejor Café 2023</h3>
                    <p>Premio a la excelencia en calidad y servicio</p>
                </div>
                
                <div class="award-card">
                    <div class="award-icon">
                        <i class="fas fa-medal"></i>
                    </div>
                    <h3>Certificación Orgánica</h3>
                    <p>100% café orgánico certificado</p>
                </div>
                
                <div class="award-card">
                    <div class="award-icon">
                        <i class="fas fa-star"></i>
                    </div>
                    <h3>5 Estrellas TripAdvisor</h3>
                    <p>Calificación perfecta de nuestros clientes</p>
                </div>
                
                <div class="award-card">
                    <div class="award-icon">
                        <i class="fas fa-handshake"></i>
                    </div>
                    <h3>Comercio Justo</h3>
                    <p>Apoyo directo a productores locales</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="services">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Nuestros Servicios</h2>
                <p class="section-subtitle">Todo lo que necesitas para una experiencia perfecta</p>
            </div>
            
            <div class="services-grid">
                <div class="service-card">
                    <div class="service-icon">
                        <i class="fas fa-wifi"></i>
                    </div>
                    <h3>WiFi Gratuito</h3>
                    <p>Internet de alta velocidad para trabajar o estudiar</p>
                </div>
                
                <div class="service-card">
                    <div class="service-icon">
                        <i class="fas fa-birthday-cake"></i>
                    </div>
                    <h3>Eventos Privados</h3>
                    <p>Celebra tus momentos especiales con nosotros</p>
                </div>
                
                <div class="service-card">
                    <div class="service-icon">
                        <i class="fas fa-utensils"></i>
                    </div>
                    <h3>Catering</h3>
                    <p>Llevamos nuestro café y delicias a tu evento</p>
                </div>
                
                <div class="service-card">
                    <div class="service-icon">
                        <i class="fas fa-car"></i>
                    </div>
                    <h3>Delivery</h3>
                    <p>Tu café favorito directo a tu puerta</p>
                </div>
                
                <div class="service-card">
                    <div class="service-icon">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <h3>Cursos de Barismo</h3>
                    <p>Aprende el arte de preparar el café perfecto</p>
                </div>
                
                <div class="service-card">
                    <div class="service-icon">
                        <i class="fas fa-gift"></i>
                    </div>
                    <h3>Tarjetas Regalo</h3>
                    <p>El regalo perfecto para los amantes del café</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Gallery Section -->
    <section id="gallery" class="gallery">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Galería</h2>
                <p class="section-subtitle">Un vistazo a nuestro mundo del café</p>
            </div>
            
            <div class="gallery-grid">
                <div class="gallery-item">
                    <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop&crop=center" alt="Interior acogedor">
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
                
                <div class="gallery-item">
                    <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center" alt="Café artesanal">
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
                
                <div class="gallery-item">
                    <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&crop=center" alt="Granos de café">
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
                
                <div class="gallery-item">
                    <img src="https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop&crop=center" alt="Postres deliciosos">
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
                
                <div class="gallery-item">
                    <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop&crop=center" alt="Ambiente relajado">
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
                
                <div class="gallery-item">
                    <img src="https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=300&fit=crop&crop=center" alt="Arte latte">
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials Section -->
    <section id="testimonials" class="testimonials">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Lo que dicen nuestros clientes</h2>
                <p class="section-subtitle">Experiencias que nos motivan a seguir mejorando</p>
            </div>
            
            <div class="testimonials-slider">
                <div class="testimonial-card active">
                    <div class="testimonial-content">
                        <div class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </div>
                        <p>"El mejor café de la ciudad. El ambiente es perfecto para trabajar y relajarse. ¡Altamente recomendado!"</p>
                        <div class="testimonial-author">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" alt="María García">
                            <div class="author-info">
                                <h4>María García</h4>
                                <span>Cliente regular</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <div class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </div>
                        <p>"Los postres son increíbles y el servicio excepcional. Este lugar se ha convertido en mi segunda casa."</p>
                        <div class="testimonial-author">
                            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face" alt="Carlos Mendoza">
                            <div class="author-info">
                                <h4>Carlos Mendoza</h4>
                                <span>Escritor</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="testimonial-card">
                    <div class="testimonial-content">
                        <div class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                        </div>
                        <p>"Perfecto para reuniones de trabajo. El café es de excelente calidad y el WiFi funciona perfectamente."</p>
                        <div class="testimonial-author">
                            <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face" alt="Ana Rodríguez">
                            <div class="author-info">
                                <h4>Ana Rodríguez</h4>
                                <span>Diseñadora</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="testimonial-controls">
                <button class="testimonial-btn prev-btn">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="testimonial-btn next-btn">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>
    </section>

    <!-- Reservations Section -->
    <section id="reservations" class="reservations">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Hacer una Reserva</h2>
                <p class="section-subtitle">Asegura tu mesa para una experiencia única</p>
            </div>
            
            <div class="reservation-content">
                <div class="reservation-info">
                    <h3>¿Por qué reservar?</h3>
                    <ul class="reservation-benefits">
                        <li><i class="fas fa-check"></i> Mesa garantizada</li>
                        <li><i class="fas fa-check"></i> Servicio prioritario</li>
                        <li><i class="fas fa-check"></i> Menú personalizado</li>
                        <li><i class="fas fa-check"></i> Ambiente exclusivo</li>
                    </ul>
                    
                    <div class="contact-info">
                        <div class="contact-item">
                            <i class="fas fa-phone"></i>
                            <span>+52 555 123 4567</span>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-envelope"></i>
                            <span>reservas@cafearoma.com</span>
                        </div>
                        <div class="contact-item">
                            <i class="fas fa-clock"></i>
                            <span>Lun - Dom: 7:00 AM - 10:00 PM</span>
                        </div>
                    </div>
                </div>
                
                <form class="reservation-form" id="reservationForm">
                    <div class="form-group">
                        <label for="name">Nombre completo</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="phone">Teléfono</label>
                        <input type="tel" id="phone" name="phone" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="date">Fecha</label>
                            <input type="date" id="date" name="date" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="time">Hora</label>
                            <select id="time" name="time" required>
                                <option value="">Seleccionar hora</option>
                                <option value="07:00">7:00 AM</option>
                                <option value="08:00">8:00 AM</option>
                                <option value="09:00">9:00 AM</option>
                                <option value="10:00">10:00 AM</option>
                                <option value="11:00">11:00 AM</option>
                                <option value="12:00">12:00 PM</option>
                                <option value="13:00">1:00 PM</option>
                                <option value="14:00">2:00 PM</option>
                                <option value="15:00">3:00 PM</option>
                                <option value="16:00">4:00 PM</option>
                                <option value="17:00">5:00 PM</option>
                                <option value="18:00">6:00 PM</option>
                                <option value="19:00">7:00 PM</option>
                                <option value="20:00">8:00 PM</option>
                                <option value="21:00">9:00 PM</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="guests">Número de comensales</label>
                        <select id="guests" name="guests" required>
                            <option value="">Seleccionar</option>
                            <option value="1">1 persona</option>
                            <option value="2">2 personas</option>
                            <option value="3">3 personas</option>
                            <option value="4">4 personas</option>
                            <option value="5">5 personas</option>
                            <option value="6">6 personas</option>
                            <option value="7">7 personas</option>
                            <option value="8">8 personas</option>
                            <option value="9">9 personas</option>
                            <option value="10">10 personas</option>
                            <option value="11">11 personas</option>
                            <option value="12">12 personas</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="message">Mensaje especial (opcional)</label>
                        <textarea id="message" name="message" rows="4" placeholder="Alguna solicitud especial, celebración, etc."></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-calendar-check"></i>
                        Confirmar Reserva
                    </button>
                </form>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="contact">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Contáctanos</h2>
                <p class="section-subtitle">Estamos aquí para ayudarte</p>
            </div>
            
            <div class="contact-content">
                <div class="contact-info">
                    <div class="contact-card">
                        <div class="contact-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <h3>Ubicación</h3>
                        <p>Av. Reforma 123<br>Col. Centro<br>Ciudad de México, CDMX</p>
                    </div>
                    
                    <div class="contact-card">
                        <div class="contact-icon">
                            <i class="fas fa-phone"></i>
                        </div>
                        <h3>Teléfono</h3>
                        <p>+52 555 123 4567<br>+52 555 765 4321</p>
                    </div>
                    
                    <div class="contact-card">
                        <div class="contact-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <h3>Email</h3>
                        <p>info@cafearoma.com<br>reservas@cafearoma.com</p>
                    </div>
                    
                    <div class="contact-card">
                        <div class="contact-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <h3>Horarios</h3>
                        <p>Lunes - Viernes: 7:00 AM - 10:00 PM<br>Sábados - Domingos: 8:00 AM - 11:00 PM</p>
                    </div>
                </div>
                
                <form class="contact-form" id="contactForm">
                    <div class="form-group">
                        <label for="contactName">Nombre</label>
                        <input type="text" id="contactName" name="name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="contactEmail">Email</label>
                        <input type="email" id="contactEmail" name="email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="subject">Asunto</label>
                        <input type="text" id="subject" name="subject" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="contactMessage">Mensaje</label>
                        <textarea id="contactMessage" name="message" rows="5" required></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i>
                        Enviar Mensaje
                    </button>
                </form>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <div class="footer-logo">
                        <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop&crop=center" alt="Café Aroma Logo">
                        <span>Café Aroma</span>
                    </div>
                    <p>Tu rincón de sabor donde cada taza cuenta una historia. Ven y disfruta de la mejor experiencia cafetera.</p>
                    <div class="social-links">
                        <a href="#" class="social-link"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-instagram"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
                        <a href="#" class="social-link"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                
                <div class="footer-section">
                    <h3>Enlaces Rápidos</h3>
                    <ul class="footer-links">
                        <li><a href="#home">Inicio</a></li>
                        <li><a href="#about">Nosotros</a></li>
                        <li><a href="#menu">Menú</a></li>
                        <li><a href="#services">Servicios</a></li>
                        <li><a href="#contact">Contacto</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h3>Servicios</h3>
                    <ul class="footer-links">
                        <li><a href="#">WiFi Gratuito</a></li>
                        <li><a href="#">Eventos Privados</a></li>
                        <li><a href="#">Catering</a></li>
                        <li><a href="#">Delivery</a></li>
                        <li><a href="#">Cursos de Barismo</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h3>Contacto</h3>
                    <div class="footer-contact">
                        <p><i class="fas fa-map-marker-alt"></i> Av. Reforma 123, CDMX</p>
                        <p><i class="fas fa-phone"></i> +52 555 123 4567</p>
                        <p><i class="fas fa-envelope"></i> info@cafearoma.com</p>
                        <p><i class="fas fa-clock"></i> Lun-Dom: 7:00 AM - 10:00 PM</p>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2025 Café Aroma. Todos los derechos reservados.</p>
                <div class="footer-bottom-links">
                    <a href="#">Política de Privacidad</a>
                    <a href="#">Términos de Servicio</a>
                    <a href="admin.php">Admin</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Scripts -->
    <script>
        // Configuración de la API para PHP
        const API_BASE_URL = '/api';
        
        // Variable global para indicar que estamos usando PHP
        window.USE_PHP_API = true;
    </script>
    <script src="script.js"></script>
</body>
</html>