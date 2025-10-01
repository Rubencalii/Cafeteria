<?php
require_once '../config/config.php';

setCorsHeaders();

$auth = new Auth();
$menu = new Menu();

// Obtener método HTTP y parámetros
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Extraer ID si está presente en la URL
$menuItemId = null;
if (count($pathParts) > 3 && is_numeric($pathParts[3])) {
    $menuItemId = intval($pathParts[3]);
}

// Extraer acción especial (como /availability, /categories)
$action = null;
if (count($pathParts) > 3) {
    if ($pathParts[3] === 'categories') {
        $action = 'categories';
    } elseif (count($pathParts) > 4) {
        $action = $pathParts[4];
    }
}

switch ($method) {
    case 'POST':
        handleCreateMenuItem($auth, $menu);
        break;
    
    case 'GET':
        if ($action === 'categories') {
            handleGetCategories($menu);
        } elseif ($menuItemId) {
            handleGetMenuItem($auth, $menu, $menuItemId);
        } elseif (isset($_GET['stats'])) {
            handleGetStats($auth, $menu);
        } elseif (isset($_GET['admin'])) {
            handleGetAllMenuItemsAdmin($auth, $menu);
        } else {
            handleGetAllMenuItems($menu);
        }
        break;
    
    case 'PUT':
        if ($menuItemId && $action === 'availability') {
            handleUpdateAvailability($auth, $menu, $menuItemId);
        } elseif ($menuItemId) {
            handleUpdateMenuItem($auth, $menu, $menuItemId);
        } else {
            sendJsonError('ID de elemento requerido para actualización', 400);
        }
        break;
    
    case 'DELETE':
        if ($menuItemId) {
            handleDeleteMenuItem($auth, $menu, $menuItemId);
        } else {
            sendJsonError('ID de elemento requerido para eliminación', 400);
        }
        break;
    
    default:
        sendJsonError('Método no permitido', 405);
}

function handleGetAllMenuItems($menu) {
    $category = $_GET['category'] ?? 'all';
    $result = $menu->getAllMenuItems($category);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 500);
    }
}

function handleGetAllMenuItemsAdmin($auth, $menu) {
    $auth->requireAdmin();
    
    $result = $menu->getAllMenuItemsAdmin();
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 500);
    }
}

function handleGetCategories($menu) {
    $result = $menu->getCategories();
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 500);
    }
}

function handleCreateMenuItem($auth, $menu) {
    $auth->requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendJsonError('Datos de elemento requeridos');
    }
    
    $result = $menu->createMenuItem($input);
    
    if ($result['success']) {
        sendJsonResponse($result, 201);
    } else {
        sendJsonError($result['message'], 400);
    }
}

function handleGetMenuItem($auth, $menu, $menuItemId) {
    $auth->requireAdmin();
    
    $result = $menu->getMenuItemById($menuItemId);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 404);
    }
}

function handleUpdateMenuItem($auth, $menu, $menuItemId) {
    $auth->requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendJsonError('Datos de actualización requeridos');
    }
    
    $result = $menu->updateMenuItem($menuItemId, $input);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 400);
    }
}

function handleUpdateAvailability($auth, $menu, $menuItemId) {
    $auth->requireAdmin();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['available'])) {
        sendJsonError('Disponibilidad requerida');
    }
    
    $result = $menu->updateMenuItemAvailability($menuItemId, $input['available']);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 400);
    }
}

function handleDeleteMenuItem($auth, $menu, $menuItemId) {
    $auth->requireAdmin();
    
    $result = $menu->deleteMenuItem($menuItemId);
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 404);
    }
}

function handleGetStats($auth, $menu) {
    $auth->requireAdmin();
    
    $result = $menu->getMenuStats();
    
    if ($result['success']) {
        sendJsonResponse($result);
    } else {
        sendJsonError($result['message'], 500);
    }
}
?>