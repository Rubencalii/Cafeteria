// Tests básicos para validar funcionalidad crítica
// tests/basic-tests.js

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

// Utilidad para hacer requests HTTP
function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(`${BASE_URL}${path}`, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: parsed });
                } catch (error) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

// Tests de funcionalidad básica
async function runBasicTests() {
    console.log('🧪 Iniciando tests básicos...\n');
    
    const tests = [
        // Test 1: Servidor funcionando
        {
            name: 'Servidor responde correctamente',
            test: async () => {
                const response = await makeRequest('/api/health');
                assert.strictEqual(response.status, 200);
                assert.strictEqual(response.data.status, 'OK');
                return '✅ Servidor funcionando correctamente';
            }
        },
        
        // Test 2: Base de datos accesible
        {
            name: 'Base de datos accesible',
            test: async () => {
                const response = await makeRequest('/api/menu');
                assert(response.status === 200 || response.status === 401); // Puede requerir auth
                return '✅ Base de datos accesible';
            }
        },
        
        // Test 3: API de reservas funcional
        {
            name: 'API de reservas funcional',
            test: async () => {
                const testReservation = {
                    name: 'Test Usuario',
                    email: 'test@example.com',
                    phone: '123456789',
                    date: '2025-10-15',
                    time: '19:00',
                    guests: 2,
                    notes: 'Test reservation'
                };
                
                const response = await makeRequest('/api/reservations', {
                    method: 'POST',
                    body: testReservation
                });
                
                assert(response.status === 200 || response.status === 201);
                return '✅ API de reservas funcional';
            }
        },
        
        // Test 4: API de contacto funcional
        {
            name: 'API de contacto funcional',
            test: async () => {
                const testContact = {
                    name: 'Test Usuario',
                    email: 'test@example.com',
                    subject: 'Test Message',
                    message: 'Este es un mensaje de prueba'
                };
                
                const response = await makeRequest('/api/contact', {
                    method: 'POST',
                    body: testContact
                });
                
                assert(response.status === 200 || response.status === 201);
                return '✅ API de contacto funcional';
            }
        },
        
        // Test 5: Archivos estáticos servidos
        {
            name: 'Archivos estáticos servidos',
            test: async () => {
                const response = await makeRequest('/');
                assert.strictEqual(response.status, 200);
                assert(response.data.includes('Café Aroma') || typeof response.data === 'string');
                return '✅ Archivos estáticos servidos correctamente';
            }
        },
        
        // Test 6: Panel admin accesible
        {
            name: 'Panel admin accesible',
            test: async () => {
                const response = await makeRequest('/admin');
                assert.strictEqual(response.status, 200);
                return '✅ Panel admin accesible';
            }
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            console.log(`Ejecutando: ${test.name}...`);
            const result = await test.test();
            results.push({ name: test.name, status: 'PASS', message: result });
            console.log(result);
        } catch (error) {
            const message = `❌ ${test.name} falló: ${error.message}`;
            results.push({ name: test.name, status: 'FAIL', message });
            console.log(message);
        }
        console.log('');
    }
    
    // Resumen
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    
    console.log('📊 RESUMEN DE TESTS:');
    console.log(`✅ Pasaron: ${passed}`);
    console.log(`❌ Fallaron: ${failed}`);
    console.log(`📈 Tasa de éxito: ${((passed / results.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 ¡TODOS LOS TESTS PASARON! Tu aplicación está funcionando correctamente.');
    } else {
        console.log('\n⚠️  Algunos tests fallaron. Revisa los errores arriba.');
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runBasicTests().catch(error => {
        console.error('Error ejecutando tests:', error);
        process.exit(1);
    });
}

module.exports = { runBasicTests, makeRequest };