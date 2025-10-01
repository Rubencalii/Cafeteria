// Sistema de Backup y Restauración Automatizado
// routes/backup.js

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const BACKUP_DIR = path.join(__dirname, '../../backups');
const DB_PATH = path.join(__dirname, '../../database/cafe_aroma.db');

// Asegurar que el directorio de backups existe
async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
}

// Crear backup completo
router.post('/create', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await ensureBackupDir();
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup_${timestamp}.db`;
        const backupPath = path.join(BACKUP_DIR, backupName);
        
        // Copiar base de datos
        await fs.copyFile(DB_PATH, backupPath);
        
        // Crear metadata del backup
        const metadata = {
            filename: backupName,
            created_at: new Date().toISOString(),
            size: (await fs.stat(backupPath)).size,
            type: 'manual',
            created_by: req.user.userId
        };
        
        const metadataPath = path.join(BACKUP_DIR, `${backupName}.json`);
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
        
        res.json({
            success: true,
            message: 'Backup creado exitosamente',
            backup: metadata
        });
        
    } catch (error) {
        console.error('Error creando backup:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando backup: ' + error.message
        });
    }
});

// Listar backups disponibles
router.get('/list', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await ensureBackupDir();
        
        const files = await fs.readdir(BACKUP_DIR);
        const backups = [];
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const metadataPath = path.join(BACKUP_DIR, file);
                    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
                    
                    // Verificar que el archivo de backup existe
                    const backupPath = path.join(BACKUP_DIR, metadata.filename);
                    await fs.access(backupPath);
                    
                    backups.push(metadata);
                } catch (error) {
                    console.warn(`Metadata corrupta o backup faltante: ${file}`);
                }
            }
        }
        
        // Ordenar por fecha de creación (más reciente primero)
        backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        res.json({
            success: true,
            backups
        });
        
    } catch (error) {
        console.error('Error listando backups:', error);
        res.status(500).json({
            success: false,
            error: 'Error listando backups: ' + error.message
        });
    }
});

// Descargar backup
router.get('/download/:filename', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Validar nombre de archivo
        if (!filename.match(/^backup_[\d-T]+\.db$/)) {
            return res.status(400).json({
                success: false,
                error: 'Nombre de archivo inválido'
            });
        }
        
        const backupPath = path.join(BACKUP_DIR, filename);
        
        // Verificar que el archivo existe
        await fs.access(backupPath);
        
        res.download(backupPath, filename, (error) => {
            if (error) {
                console.error('Error descargando backup:', error);
                res.status(500).json({
                    success: false,
                    error: 'Error descargando backup'
                });
            }
        });
        
    } catch (error) {
        console.error('Error accediendo al backup:', error);
        res.status(404).json({
            success: false,
            error: 'Backup no encontrado'
        });
    }
});

// Restaurar backup
router.post('/restore/:filename', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Validar nombre de archivo
        if (!filename.match(/^backup_[\d-T]+\.db$/)) {
            return res.status(400).json({
                success: false,
                error: 'Nombre de archivo inválido'
            });
        }
        
        const backupPath = path.join(BACKUP_DIR, filename);
        
        // Verificar que el backup existe
        await fs.access(backupPath);
        
        // Crear backup de la base de datos actual antes de restaurar
        const currentBackupName = `pre_restore_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
        const currentBackupPath = path.join(BACKUP_DIR, currentBackupName);
        await fs.copyFile(DB_PATH, currentBackupPath);
        
        // Restaurar el backup
        await fs.copyFile(backupPath, DB_PATH);
        
        res.json({
            success: true,
            message: 'Base de datos restaurada exitosamente',
            restored_from: filename,
            current_backup: currentBackupName
        });
        
    } catch (error) {
        console.error('Error restaurando backup:', error);
        res.status(500).json({
            success: false,
            error: 'Error restaurando backup: ' + error.message
        });
    }
});

// Eliminar backup
router.delete('/delete/:filename', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { filename } = req.params;
        
        // Validar nombre de archivo
        if (!filename.match(/^backup_[\d-T]+\.db$/)) {
            return res.status(400).json({
                success: false,
                error: 'Nombre de archivo inválido'
            });
        }
        
        const backupPath = path.join(BACKUP_DIR, filename);
        const metadataPath = path.join(BACKUP_DIR, `${filename}.json`);
        
        // Eliminar archivo de backup y metadata
        await fs.unlink(backupPath);
        
        try {
            await fs.unlink(metadataPath);
        } catch (error) {
            console.warn('No se pudo eliminar metadata:', error.message);
        }
        
        res.json({
            success: true,
            message: 'Backup eliminado exitosamente'
        });
        
    } catch (error) {
        console.error('Error eliminando backup:', error);
        res.status(500).json({
            success: false,
            error: 'Error eliminando backup: ' + error.message
        });
    }
});

// Configurar backup automático
router.post('/schedule', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { frequency = 'daily', time = '02:00', max_backups = 7 } = req.body;
        
        // Guardar configuración en archivo
        const config = {
            frequency,
            time,
            max_backups,
            enabled: true,
            last_backup: null,
            updated_at: new Date().toISOString(),
            updated_by: req.user.userId
        };
        
        const configPath = path.join(BACKUP_DIR, 'schedule.json');
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        
        res.json({
            success: true,
            message: 'Programación de backup configurada',
            config
        });
        
    } catch (error) {
        console.error('Error configurando backup automático:', error);
        res.status(500).json({
            success: false,
            error: 'Error configurando backup automático: ' + error.message
        });
    }
});

// Obtener configuración de backup automático
router.get('/schedule', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const configPath = path.join(BACKUP_DIR, 'schedule.json');
        
        try {
            const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
            res.json({
                success: true,
                config
            });
        } catch (error) {
            // Si no existe configuración, devolver defaults
            res.json({
                success: true,
                config: {
                    frequency: 'daily',
                    time: '02:00',
                    max_backups: 7,
                    enabled: false,
                    last_backup: null
                }
            });
        }
        
    } catch (error) {
        console.error('Error obteniendo configuración de backup:', error);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo configuración de backup: ' + error.message
        });
    }
});

module.exports = router;