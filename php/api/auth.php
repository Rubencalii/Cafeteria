<?php
require_once '../config/config.php';

setCorsHeaders();

$auth = new Auth();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        handleLogin($auth);
        break;
    case 'DELETE':
        handleLogout($auth);
        break;
    case 'GET':
        handleVerifyToken($auth);
        break;
    default:
        sendJsonError('Método no permitido', 405);
}

function handleLogin($auth) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validar entrada
    if (!isset($input['username']) || !isset($input['password'])) {
        sendJsonError('Usuario y contraseña son requeridos');
    }
    
    $username = cleanInput($input['username']);
    $password = $input['password'];
    
    // Validaciones básicas
    if (empty($username) || empty($password)) {
        sendJsonError('Usuario y contraseña no pueden estar vacíos');
    }
    
    if (strlen($password) < 6) {
        sendJsonError('La contraseña debe tener al menos 6 caracteres');
    }
    
    $result = $auth->login($username, $password);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 401);
    }
}

function handleLogout($auth) {
    $result = $auth->logout();
    sendJsonResponse($result);
}

function handleVerifyToken($auth) {
    if ($auth->isAuthenticated()) {
        $user = $auth->getCurrentUser();
        sendJsonResponse([
            'success' => true,
            'message' => 'Token válido',
            'data' => ['user' => $user]
        ]);
    } else {
        sendJsonError('Token no válido o expirado', 401);
    }
}
?>