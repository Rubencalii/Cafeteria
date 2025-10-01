<?php
class Auth {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    public function login($username, $password) {
        try {
            // Buscar usuario por username o email
            $sql = "SELECT * FROM users WHERE username = ? OR email = ?";
            $user = $this->db->fetchOne($sql, [$username, $username]);
            
            if (!$user) {
                return [
                    'success' => false,
                    'message' => 'Credenciales inválidas'
                ];
            }
            
            // Verificar contraseña
            if (!password_verify($password, $user['password'])) {
                return [
                    'success' => false,
                    'message' => 'Credenciales inválidas'
                ];
            }
            
            // Generar token JWT
            $token = $this->generateJWTToken($user);
            
            // Iniciar sesión PHP
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['logged_in'] = true;
            
            return [
                'success' => true,
                'message' => 'Login exitoso',
                'data' => [
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'email' => $user['email'],
                        'role' => $user['role']
                    ],
                    'token' => $token
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error interno del servidor'
            ];
        }
    }
    
    public function logout() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        session_unset();
        session_destroy();
        
        return [
            'success' => true,
            'message' => 'Logout exitoso'
        ];
    }
    
    public function isAuthenticated() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
    }
    
    public function requireAuth() {
        if (!$this->isAuthenticated()) {
            sendJsonError('Token no válido o expirado', 401);
        }
    }
    
    public function requireAdmin() {
        $this->requireAuth();
        
        if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
            sendJsonError('Acceso denegado. Se requieren permisos de administrador', 403);
        }
    }
    
    public function getCurrentUser() {
        if (!$this->isAuthenticated()) {
            return null;
        }
        
        return [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'role' => $_SESSION['role']
        ];
    }
    
    public function verifyJWTToken($token) {
        try {
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                return false;
            }
            
            $header = json_decode(base64_decode($parts[0]), true);
            $payload = json_decode(base64_decode($parts[1]), true);
            $signature = $parts[2];
            
            // Verificar expiración
            if (time() > $payload['exp']) {
                return false;
            }
            
            // Verificar firma
            $expectedSignature = base64_encode(hash_hmac('sha256', $parts[0] . '.' . $parts[1], JWT_SECRET, true));
            
            if (!hash_equals($expectedSignature, $signature)) {
                return false;
            }
            
            return $payload;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private function generateJWTToken($user) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + JWT_EXPIRATION
        ]);
        
        $headerEncoded = base64_encode($header);
        $payloadEncoded = base64_encode($payload);
        
        $signature = base64_encode(hash_hmac('sha256', $headerEncoded . '.' . $payloadEncoded, JWT_SECRET, true));
        
        return $headerEncoded . '.' . $payloadEncoded . '.' . $signature;
    }
    
    public function hashPassword($password) {
        return password_hash($password, PASSWORD_DEFAULT);
    }
    
    public function createUser($username, $email, $password, $role = 'admin') {
        try {
            $hashedPassword = $this->hashPassword($password);
            
            $sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
            $userId = $this->db->insert($sql, [$username, $email, $hashedPassword, $role]);
            
            return [
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'data' => ['user_id' => $userId]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Error al crear usuario: ' . $e->getMessage()
            ];
        }
    }
}
?>