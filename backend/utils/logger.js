// Sistema de Logging Profesional
// backend/utils/logger.js

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logsDir = path.join(__dirname, '../../logs');
        this.ensureLogsDirectory();
        
        this.levels = {
            ERROR: 0,
            WARN: 1, 
            INFO: 2,
            DEBUG: 3
        };
        
        this.currentLevel = process.env.LOG_LEVEL 
            ? this.levels[process.env.LOG_LEVEL.toUpperCase()] || this.levels.INFO
            : (process.env.NODE_ENV === 'production' ? this.levels.INFO : this.levels.DEBUG);
    }
    
    ensureLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }
    
    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            pid: process.pid,
            ...meta
        };
        
        return JSON.stringify(logEntry);
    }
    
    writeToFile(filename, message) {
        if (process.env.NODE_ENV === 'production') {
            const filePath = path.join(this.logsDir, filename);
            fs.appendFileSync(filePath, message + '\n');
        }
    }
    
    log(level, message, meta = {}) {
        if (this.levels[level] > this.currentLevel) return;
        
        const formattedMessage = this.formatMessage(level, message, meta);
        const date = new Date().toISOString().split('T')[0];
        
        // Console output con colores
        if (process.env.NODE_ENV !== 'production') {
            const colors = {
                ERROR: '\x1b[31m', // Rojo
                WARN: '\x1b[33m',  // Amarillo
                INFO: '\x1b[36m',  // Cian
                DEBUG: '\x1b[37m'  // Blanco
            };
            
            const reset = '\x1b[0m';
            const timestamp = new Date().toLocaleTimeString();
            console.log(`${colors[level]}[${timestamp}] ${level}:${reset} ${message}`);
            
            if (Object.keys(meta).length > 0) {
                console.log('  Meta:', meta);
            }
        }
        
        // Archivo de log
        this.writeToFile(`app-${date}.log`, formattedMessage);
        
        // Archivo específico para errores
        if (level === 'ERROR') {
            this.writeToFile(`errors-${date}.log`, formattedMessage);
        }
    }
    
    error(message, meta = {}) {
        this.log('ERROR', message, meta);
    }
    
    warn(message, meta = {}) {
        this.log('WARN', message, meta);
    }
    
    info(message, meta = {}) {
        this.log('INFO', message, meta);
    }
    
    debug(message, meta = {}) {
        this.log('DEBUG', message, meta);
    }
    
    // Logging de requests HTTP
    requestLogger() {
        return (req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                const logData = {
                    method: req.method,
                    url: req.originalUrl,
                    status: res.statusCode,
                    duration: `${duration}ms`,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                };
                
                if (res.statusCode >= 400) {
                    this.warn(`HTTP ${res.statusCode}`, logData);
                } else {
                    this.info(`HTTP ${res.statusCode}`, logData);
                }
            });
            
            next();
        };
    }
    
    // Logging de errores no capturados
    setupGlobalErrorHandling() {
        process.on('uncaughtException', (error) => {
            this.error('Uncaught Exception', { 
                error: error.message, 
                stack: error.stack 
            });
            process.exit(1);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            this.error('Unhandled Rejection', { 
                reason: reason.toString(),
                promise: promise.toString()
            });
        });
    }
    
    // Limpiar logs antiguos
    cleanOldLogs(daysToKeep = 30) {
        if (process.env.NODE_ENV !== 'production') return;
        
        const files = fs.readdirSync(this.logsDir);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        files.forEach(file => {
            const filePath = path.join(this.logsDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime < cutoffDate) {
                fs.unlinkSync(filePath);
                this.info(`Log file deleted: ${file}`);
            }
        });
    }
}

// Instancia singleton
const logger = new Logger();

// Configurar manejo global de errores
logger.setupGlobalErrorHandling();

// Limpiar logs antiguos al iniciar
logger.cleanOldLogs();

module.exports = logger;