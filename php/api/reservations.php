<?php
require_once __DIR__ . '/../config/config.php';

setCorsHeaders();

$auth = new Auth();
$reservations = new Reservations();

// Obtener método HTTP y parámetros
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Extraer ID si está presente en la URL
$reservationId = null;
if (count($pathParts) > 3 && is_numeric($pathParts[3])) {
    $reservationId = intval($pathParts[3]);
}

// Extraer acción especial (como /status)
$action = null;
if (count($pathParts) > 4) {
    $action = $pathParts[4];
}

switch ($method) {
    case 'POST':
        if ($reservationId && $action === 'status') {
            handleUpdateStatus($auth, $reservations, $reservationId);
        } else {
            handleCreateReservation($reservations);
        }
        break;
    
    case 'GET':
        if ($reservationId) {
            handleGetReservation($auth, $reservations, $reservationId);
        } elseif (isset($_GET['stats'])) {
            handleGetStats($auth, $reservations);
        } else {
            handleGetAllReservations($auth, $reservations);
        }
        break;
    
    case 'PUT':
        if ($reservationId && $action === 'status') {
            handleUpdateStatus($auth, $reservations, $reservationId);
        } elseif ($reservationId) {
            handleUpdateReservation($auth, $reservations, $reservationId);
        } else {
            sendJsonError('ID de reserva requerido para actualización', 400);
        }
        break;
    
    case 'DELETE':
        if ($reservationId) {
            handleDeleteReservation($auth, $reservations, $reservationId);
        } else {
            sendJsonError('ID de reserva requerido para eliminación', 400);
        }
        break;
    
    default:
        sendJsonError('Método no permitido', 405);
}

function handleCreateReservation($reservations) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendJsonError('Datos de reserva requeridos');
    }
    
    $result = $reservations->createReservation($input);
    
    if ($result['success']) {
        sendJsonResponse($result, 201);
    } else {
        sendJsonError($result['message'], 400);
    }
}

function handleGetAllReservations($auth, $reservations) {
    $auth->requireAdmin();
    
    $filters = [
        'page' => $_GET['page'] ?? 1,
        'limit' => $_GET['limit'] ?? 10,
        'status' => $_GET['status'] ?? 'all'
    ];
    
    $result = $reservations->getAllReservations($filters);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 500);
    }
}

function handleGetReservation($auth, $reservations, $reservationId) {
    $auth->requireAdmin();
    
    $result = $reservations->getReservationById($reservationId);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 404);
    }
}

function handleUpdateReservation($auth, $reservations, $reservationId) {
    $auth->requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendJsonError('Datos de actualización requeridos');
    }
    
    $result = $reservations->updateReservation($reservationId, $input);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 400);
    }
}

function handleUpdateStatus($auth, $reservations, $reservationId) {
    $auth->requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['status'])) {
        sendJsonError('Estado requerido');
    }
    
    $result = $reservations->updateReservationStatus($reservationId, $input['status']);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 400);
    }
}

function handleDeleteReservation($auth, $reservations, $reservationId) {
    $auth->requireAdmin();
    
    $result = $reservations->deleteReservation($reservationId);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 404);
    }
}

function handleGetStats($auth, $reservations) {
    $auth->requireAdmin();
    
    $result = $reservations->getReservationStats();
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 500);
    }
}
?>