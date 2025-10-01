<?php
require_once '../config/config.php';

setCorsHeaders();

$auth = new Auth();
$contact = new Contact();

// Obtener método HTTP y parámetros
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Extraer ID si está presente en la URL
$contactId = null;
if (count($pathParts) > 3 && is_numeric($pathParts[3])) {
    $contactId = intval($pathParts[3]);
}

// Extraer acción especial (como /status)
$action = null;
if (count($pathParts) > 4) {
    $action = $pathParts[4];
}

switch ($method) {
    case 'POST':
        handleCreateContact($contact);
        break;
    
    case 'GET':
        if ($contactId) {
            handleGetContact($auth, $contact, $contactId);
        } elseif (isset($_GET['stats'])) {
            handleGetStats($auth, $contact);
        } else {
            handleGetAllContacts($auth, $contact);
        }
        break;
    
    case 'PUT':
        if ($contactId && $action === 'status') {
            handleUpdateStatus($auth, $contact, $contactId);
        } else {
            sendJsonError('Operación no soportada', 400);
        }
        break;
    
    case 'DELETE':
        if ($contactId) {
            handleDeleteContact($auth, $contact, $contactId);
        } else {
            sendJsonError('ID de mensaje requerido para eliminación', 400);
        }
        break;
    
    default:
        sendJsonError('Método no permitido', 405);
}

function handleCreateContact($contact) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendJsonError('Datos de contacto requeridos');
    }
    
    $result = $contact->createContact($input);
    
    if ($result['success']) {
        sendJsonResponse($result, 201);
    } else {
        sendJsonError($result['message'], 400);
    }
}

function handleGetAllContacts($auth, $contact) {
    $auth->requireAdmin();
    
    $filters = [
        'page' => $_GET['page'] ?? 1,
        'limit' => $_GET['limit'] ?? 10,
        'status' => $_GET['status'] ?? 'all'
    ];
    
    $result = $contact->getAllContacts($filters);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 500);
    }
}

function handleGetContact($auth, $contact, $contactId) {
    $auth->requireAdmin();
    
    $result = $contact->getContactById($contactId);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 404);
    }
}

function handleUpdateStatus($auth, $contact, $contactId) {
    $auth->requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['status'])) {
        sendJsonError('Estado requerido');
    }
    
    $result = $contact->updateContactStatus($contactId, $input['status']);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 400);
    }
}

function handleDeleteContact($auth, $contact, $contactId) {
    $auth->requireAdmin();
    
    $result = $contact->deleteContact($contactId);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 404);
    }
}

function handleGetStats($auth, $contact) {
    $auth->requireAdmin();
    
    $result = $contact->getContactStats();
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 500);
    }
}
?>