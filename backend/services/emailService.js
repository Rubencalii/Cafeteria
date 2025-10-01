const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialize();
    }

    async initialize() {
        try {
            const emailService = process.env.EMAIL_SERVICE;
            
            if (emailService === 'gmail') {
                this.transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD // Contraseña de aplicación
                    }
                });
            } else if (emailService === 'sendgrid') {
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.sendgrid.net',
                    port: 587,
                    secure: false,
                    auth: {
                        user: 'apikey',
                        pass: process.env.SENDGRID_API_KEY
                    }
                });
            } else if (emailService === 'outlook') {
                this.transporter = nodemailer.createTransport({
                    service: 'hotmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD
                    }
                });
            } else if (emailService === 'test') {
                // Para desarrollo/testing - Usar transporter local sin autenticación
                this.transporter = nodemailer.createTransport({
                    host: 'localhost',
                    port: 1025,
                    secure: false,
                    ignoreTLS: true,
                    tls: {
                        rejectUnauthorized: false
                    }
                });
                console.log('📧 Usando servicio de email de prueba (localhost:1025)');
            } else if (emailService === 'ethereal') {
                // Crear cuenta Ethereal automáticamente
                const testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });
                console.log('📧 Cuenta Ethereal creada:', testAccount.user);
                console.log('📧 Para ver emails: https://ethereal.email/messages');
            } else {
                throw new Error(`Servicio de email no soportado: ${emailService}`);
            }

            // Verificar conexión (solo si no es modo test local)
            if (emailService !== 'test') {
                await this.transporter.verify();
                console.log('✅ Servicio de email inicializado correctamente');
            } else {
                console.log('✅ Servicio de email en modo prueba (sin verificación)');
            }
            
        } catch (error) {
            console.error('❌ Error inicializando servicio de email:', error.message);
            this.transporter = null;
        }
    }

    generateReservationEmailTemplate(reservation, status) {
        const isConfirmed = status === 'confirmed';
        const restaurantName = process.env.RESTAURANT_NAME || 'Café Aroma';
        const restaurantAddress = process.env.RESTAURANT_ADDRESS || 'Av. Principal 123';
        const restaurantPhone = process.env.RESTAURANT_PHONE || '+34 900 123 456';
        const restaurantEmail = process.env.RESTAURANT_EMAIL || 'info@cafearoma.com';
        
        const subject = isConfirmed 
            ? `✅ Reserva Confirmada - ${restaurantName} #${reservation.id}`
            : `❌ Reserva Cancelada - ${restaurantName} #${reservation.id}`;

        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f5f5f5;
                }
                .container { 
                    max-width: 600px; 
                    margin: 20px auto; 
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                }
                .header { 
                    background: ${isConfirmed ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'linear-gradient(135deg, #f44336, #d32f2f)'}; 
                    color: white; 
                    padding: 30px 20px; 
                    text-align: center; 
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 28px; 
                    font-weight: 700;
                }
                .header p { 
                    margin: 10px 0 0 0; 
                    font-size: 16px; 
                    opacity: 0.9;
                }
                .content { 
                    padding: 30px; 
                }
                .greeting { 
                    font-size: 18px; 
                    margin-bottom: 20px; 
                    color: #2c3e50;
                }
                .message { 
                    font-size: 16px; 
                    margin-bottom: 25px; 
                    line-height: 1.7;
                }
                .details { 
                    background: #f8f9fa; 
                    padding: 25px; 
                    border-radius: 8px; 
                    margin: 25px 0; 
                    border-left: 4px solid #6F4E37;
                }
                .details h3 { 
                    color: #6F4E37; 
                    margin-top: 0; 
                    font-size: 20px;
                }
                .detail-row { 
                    display: flex; 
                    justify-content: space-between; 
                    margin: 12px 0; 
                    padding: 8px 0;
                    border-bottom: 1px solid #e9ecef;
                }
                .detail-row:last-child { border-bottom: none; }
                .detail-label { 
                    font-weight: 600; 
                    color: #495057;
                }
                .detail-value { 
                    color: #212529; 
                    font-weight: 500;
                }
                .status-badge { 
                    display: inline-block;
                    padding: 8px 16px; 
                    border-radius: 20px; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    font-size: 14px;
                    background: ${isConfirmed ? '#4CAF50' : '#f44336'}; 
                    color: white;
                }
                .info-section { 
                    background: #e3f2fd; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 20px 0;
                }
                .info-section h4 { 
                    color: #0277bd; 
                    margin-top: 0;
                }
                .info-section ul { 
                    margin: 0; 
                    padding-left: 20px;
                }
                .info-section li { 
                    margin: 8px 0;
                }
                .button { 
                    display: inline-block; 
                    padding: 15px 30px; 
                    background: #6F4E37; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    margin: 20px 0; 
                    font-weight: 600;
                    text-align: center;
                }
                .footer { 
                    background: #2c3e50; 
                    color: #ecf0f1; 
                    padding: 25px; 
                    text-align: center;
                }
                .footer p { 
                    margin: 5px 0; 
                }
                .contact-info { 
                    margin: 15px 0;
                }
                .social-links { 
                    margin-top: 20px;
                }
                .social-links a { 
                    color: #3498db; 
                    text-decoration: none; 
                    margin: 0 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${isConfirmed ? '🎉 ¡Reserva Confirmada!' : '😔 Reserva Cancelada'}</h1>
                    <p>${restaurantName} - Tu lugar especial</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        Estimado/a <strong>${reservation.name}</strong>,
                    </div>
                    
                    <div class="message">
                        ${isConfirmed ? `
                        ¡Excelentes noticias! Tu reserva ha sido <strong>confirmada</strong> exitosamente.
                        Te esperamos con los brazos abiertos para brindarte una experiencia gastronómica inolvidable.
                        ` : `
                        Lamentamos informarte que tu reserva ha sido <strong>cancelada</strong>.
                        Esto puede deberse a disponibilidad limitada o circunstancias imprevistas.
                        Te invitamos a realizar una nueva reserva para otra fecha disponible.
                        `}
                    </div>
                    
                    <div class="details">
                        <h3>📋 Detalles de la Reserva</h3>
                        <div class="detail-row">
                            <span class="detail-label">Número de Reserva:</span>
                            <span class="detail-value">#${reservation.id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Fecha:</span>
                            <span class="detail-value">${this.formatDate(reservation.date)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Hora:</span>
                            <span class="detail-value">${reservation.time}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Número de Personas:</span>
                            <span class="detail-value">${reservation.guests}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Estado:</span>
                            <span class="detail-value">
                                <span class="status-badge">${isConfirmed ? 'CONFIRMADA' : 'CANCELADA'}</span>
                            </span>
                        </div>
                    </div>
                    
                    ${isConfirmed ? `
                    <div class="info-section">
                        <h4>📍 Información Importante</h4>
                        <ul>
                            <li>Por favor, llega 10 minutos antes de tu hora reservada</li>
                            <li>Si necesitas cancelar, contáctanos con al menos 2 horas de anticipación</li>
                            <li>Mantén este email como comprobante de tu reserva</li>
                            <li>Nuestra carta especial del día estará disponible</li>
                        </ul>
                    </div>
                    ` : `
                    <div class="info-section">
                        <h4>🌐 ¿Deseas hacer una nueva reserva?</h4>
                        <p>Puedes realizar una nueva reserva a través de nuestro sitio web o contactándonos directamente.</p>
                        <a href="${process.env.RESTAURANT_WEBSITE || 'http://localhost:3000'}" class="button">Nueva Reserva</a>
                    </div>
                    `}
                </div>
                
                <div class="footer">
                    <p><strong>${restaurantName}</strong></p>
                    <div class="contact-info">
                        <p>📍 ${restaurantAddress}</p>
                        <p>📞 ${restaurantPhone}</p>
                        <p>📧 ${restaurantEmail}</p>
                    </div>
                    <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
                        💌 Este email fue enviado automáticamente el ${new Date().toLocaleString('es-ES')}
                    </p>
                </div>
            </div>
        </body>
        </html>`;

        const text = `
${isConfirmed ? '¡Reserva Confirmada!' : 'Reserva Cancelada'} - ${restaurantName}

Estimado/a ${reservation.name},

${isConfirmed ? 
'¡Excelentes noticias! Tu reserva ha sido confirmada exitosamente.' : 
'Lamentamos informarte que tu reserva ha sido cancelada.'}

Detalles de la Reserva:
- Número: #${reservation.id}
- Fecha: ${this.formatDate(reservation.date)}
- Hora: ${reservation.time}
- Personas: ${reservation.guests}
- Estado: ${isConfirmed ? 'CONFIRMADA' : 'CANCELADA'}

${isConfirmed ? 
'Por favor, llega 10 minutos antes de tu hora reservada.' : 
'Puedes realizar una nueva reserva contactándonos.'}

Contacto:
${restaurantAddress}
${restaurantPhone}
${restaurantEmail}

Gracias por elegir ${restaurantName}
        `.trim();

        return { subject, html, text };
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }

    async sendReservationEmail(reservation, status) {
        // En modo test, simular envío exitoso
        if (process.env.EMAIL_SERVICE === 'test') {
            console.log('📧 EMAIL SIMULADO (modo test):', {
                to: reservation.email,
                subject: `${status === 'confirmed' ? '✅ Reserva Confirmada' : '❌ Reserva Cancelada'} - Café Aroma #${reservation.id}`,
                message: `Email enviado a ${reservation.name} (${reservation.email}) sobre reserva para ${reservation.date} a las ${reservation.time}`
            });
            
            return {
                success: true,
                messageId: 'test-' + Date.now(),
                to: reservation.email,
                subject: `${status === 'confirmed' ? '✅ Reserva Confirmada' : '❌ Reserva Cancelada'} - Café Aroma #${reservation.id}`,
                mode: 'test'
            };
        }

        if (!this.transporter) {
            throw new Error('Servicio de email no inicializado');
        }

        try {
            const emailTemplate = this.generateReservationEmailTemplate(reservation, status);
            
            const mailOptions = {
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'Café Aroma',
                    address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
                },
                to: reservation.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            console.log('✅ Email enviado exitosamente:', {
                messageId: result.messageId,
                to: reservation.email,
                subject: emailTemplate.subject
            });

            return {
                success: true,
                messageId: result.messageId,
                to: reservation.email,
                subject: emailTemplate.subject
            };

        } catch (error) {
            console.error('❌ Error enviando email:', error);
            throw error;
        }
    }

    async sendContactReply(contact, message) {
        // En modo test, simular envío exitoso
        if (process.env.EMAIL_SERVICE === 'test') {
            console.log('📧 RESPUESTA CONTACTO SIMULADA (modo test):', {
                to: contact.email,
                subject: `Re: Tu mensaje en Café Aroma`,
                from: contact.name,
                originalSubject: contact.subject,
                reply: message
            });
            
            return {
                success: true,
                messageId: 'test-reply-' + Date.now(),
                to: contact.email,
                mode: 'test'
            };
        }

        if (!this.transporter) {
            throw new Error('Servicio de email no inicializado');
        }

        try {
            const subject = `Re: Tu mensaje en ${process.env.RESTAURANT_NAME || 'Café Aroma'}`;
            
            const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #6F4E37; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .footer { background: #333; color: white; padding: 15px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${process.env.RESTAURANT_NAME || 'Café Aroma'}</h1>
                    </div>
                    <div class="content">
                        <h2>Hola ${contact.name},</h2>
                        <p>Gracias por contactarnos. Aquí tienes nuestra respuesta:</p>
                        <div style="background: white; padding: 15px; border-left: 4px solid #6F4E37;">
                            ${message}
                        </div>
                        <p>Si tienes más preguntas, no dudes en contactarnos.</p>
                    </div>
                    <div class="footer">
                        <p>${process.env.RESTAURANT_NAME || 'Café Aroma'} - ${process.env.RESTAURANT_PHONE || 'Tel: +34 900 123 456'}</p>
                    </div>
                </div>
            </body>
            </html>`;

            const mailOptions = {
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'Café Aroma',
                    address: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER
                },
                to: contact.email,
                subject: subject,
                html: html,
                text: `Hola ${contact.name},\n\nGracias por contactarnos. Aquí tienes nuestra respuesta:\n\n${message}\n\nSaludos,\n${process.env.RESTAURANT_NAME || 'Café Aroma'}`
            };

            const result = await this.transporter.sendMail(mailOptions);
            
            console.log('✅ Respuesta de contacto enviada:', {
                messageId: result.messageId,
                to: contact.email
            });

            return {
                success: true,
                messageId: result.messageId,
                to: contact.email
            };

        } catch (error) {
            console.error('❌ Error enviando respuesta de contacto:', error);
            throw error;
        }
    }

    async testConnection() {
        if (!this.transporter) {
            return { success: false, message: 'Transporter no inicializado' };
        }

        try {
            await this.transporter.verify();
            return { success: true, message: 'Conexión exitosa' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

module.exports = new EmailService();