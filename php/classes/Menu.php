<?php
class Menu {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    public function getAllMenuItems($category = 'all') {
        try {
            $whereClause = 'WHERE available = 1';
            $params = [];
            
            if ($category !== 'all') {
                $whereClause .= ' AND category = ?';
                $params[] = $category;
            }
            
            $sql = "SELECT id, name, description, price, category, image 
                    FROM menu_items $whereClause 
                    ORDER BY category, name";
            
            $items = $this->db->fetchAll($sql, $params);
            
            // Agrupar por categorías
            $menuByCategory = [];
            foreach ($items as $item) {
                if (!isset($menuByCategory[$item['category']])) {
                    $menuByCategory[$item['category']] = [];
                }
                $menuByCategory[$item['category']][] = $item;
            }
            
            return [
                'success' => true,
                'data' => [
                    'items' => $items,
                    'categories' => $menuByCategory
                ]
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al obtener el menú'];
        }
    }
    
    public function getCategories() {
        try {
            $sql = "SELECT DISTINCT category 
                    FROM menu_items 
                    WHERE available = 1 
                    ORDER BY category";
            
            $categories = $this->db->fetchAll($sql);
            $categoryList = array_column($categories, 'category');
            
            return [
                'success' => true,
                'data' => $categoryList
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al obtener categorías'];
        }
    }
    
    public function createMenuItem($data) {
        try {
            // Validar datos requeridos
            $required = ['name', 'description', 'price', 'category'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    return ['success' => false, 'message' => "El campo {$field} es requerido"];
                }
            }
            
            // Validar precio
            $price = floatval($data['price']);
            if ($price <= 0) {
                return ['success' => false, 'message' => 'El precio debe ser un número válido mayor a 0'];
            }
            
            $available = isset($data['available']) ? (bool)$data['available'] : true;
            $image = isset($data['image']) ? cleanInput($data['image']) : '';
            
            // Insertar elemento del menú
            $sql = "INSERT INTO menu_items (name, description, price, category, image, available) 
                    VALUES (?, ?, ?, ?, ?, ?)";
            
            $menuItemId = $this->db->insert($sql, [
                cleanInput($data['name']),
                cleanInput($data['description']),
                $price,
                cleanInput($data['category']),
                $image,
                $available ? 1 : 0
            ]);
            
            return [
                'success' => true,
                'message' => 'Elemento del menú creado exitosamente',
                'data' => [
                    'id' => $menuItemId,
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'price' => $price,
                    'category' => $data['category'],
                    'image' => $image,
                    'available' => $available
                ]
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al crear elemento del menú'];
        }
    }
    
    public function getMenuItemById($id) {
        try {
            $sql = "SELECT * FROM menu_items WHERE id = ?";
            $menuItem = $this->db->fetchOne($sql, [$id]);
            
            if (!$menuItem) {
                return ['success' => false, 'message' => 'Elemento del menú no encontrado'];
            }
            
            return [
                'success' => true,
                'data' => $menuItem
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al obtener el elemento del menú'];
        }
    }
    
    public function updateMenuItem($id, $data) {
        try {
            // Verificar que el elemento existe
            $existing = $this->getMenuItemById($id);
            if (!$existing['success']) {
                return $existing;
            }
            
            $updateFields = [];
            $params = [];
            
            if (isset($data['name']) && !empty($data['name'])) {
                $updateFields[] = 'name = ?';
                $params[] = cleanInput($data['name']);
            }
            
            if (isset($data['description']) && !empty($data['description'])) {
                $updateFields[] = 'description = ?';
                $params[] = cleanInput($data['description']);
            }
            
            if (isset($data['price'])) {
                $price = floatval($data['price']);
                if ($price <= 0) {
                    return ['success' => false, 'message' => 'El precio debe ser un número válido mayor a 0'];
                }
                $updateFields[] = 'price = ?';
                $params[] = $price;
            }
            
            if (isset($data['category']) && !empty($data['category'])) {
                $updateFields[] = 'category = ?';
                $params[] = cleanInput($data['category']);
            }
            
            if (isset($data['image'])) {
                $updateFields[] = 'image = ?';
                $params[] = cleanInput($data['image']);
            }
            
            if (isset($data['available'])) {
                $updateFields[] = 'available = ?';
                $params[] = (bool)$data['available'] ? 1 : 0;
            }
            
            if (empty($updateFields)) {
                return ['success' => false, 'message' => 'No hay campos para actualizar'];
            }
            
            $params[] = $id;
            $sql = "UPDATE menu_items SET " . implode(', ', $updateFields) . " WHERE id = ?";
            
            $affectedRows = $this->db->update($sql, $params);
            
            if ($affectedRows > 0) {
                return $this->getMenuItemById($id);
            } else {
                return ['success' => false, 'message' => 'No se pudo actualizar el elemento del menú'];
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al actualizar el elemento del menú'];
        }
    }
    
    public function updateMenuItemAvailability($id, $available) {
        try {
            $sql = "UPDATE menu_items SET available = ? WHERE id = ?";
            $affectedRows = $this->db->update($sql, [$available ? 1 : 0, $id]);
            
            if ($affectedRows > 0) {
                return [
                    'success' => true,
                    'message' => 'Disponibilidad actualizada exitosamente',
                    'data' => ['id' => $id, 'available' => (bool)$available]
                ];
            } else {
                return ['success' => false, 'message' => 'Elemento del menú no encontrado'];
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al actualizar la disponibilidad'];
        }
    }
    
    public function deleteMenuItem($id) {
        try {
            $sql = "DELETE FROM menu_items WHERE id = ?";
            $affectedRows = $this->db->delete($sql, [$id]);
            
            if ($affectedRows > 0) {
                return [
                    'success' => true,
                    'message' => 'Elemento del menú eliminado exitosamente'
                ];
            } else {
                return ['success' => false, 'message' => 'Elemento del menú no encontrado'];
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al eliminar el elemento del menú'];
        }
    }
    
    public function getAllMenuItemsAdmin() {
        try {
            $sql = "SELECT * FROM menu_items ORDER BY category, name";
            $items = $this->db->fetchAll($sql);
            
            // Agrupar por categorías
            $menuByCategory = [];
            foreach ($items as $item) {
                if (!isset($menuByCategory[$item['category']])) {
                    $menuByCategory[$item['category']] = [];
                }
                $menuByCategory[$item['category']][] = $item;
            }
            
            return [
                'success' => true,
                'data' => [
                    'items' => $items,
                    'categories' => $menuByCategory
                ]
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al obtener el menú'];
        }
    }
    
    public function getMenuStats() {
        try {
            $stats = [];
            
            // Total de elementos por categoría
            $sql = "SELECT category, COUNT(*) as count FROM menu_items GROUP BY category";
            $categoryCounts = $this->db->fetchAll($sql);
            
            $stats['by_category'] = [];
            foreach ($categoryCounts as $row) {
                $stats['by_category'][$row['category']] = $row['count'];
            }
            
            // Total general
            $totalSql = "SELECT COUNT(*) as total FROM menu_items";
            $totalResult = $this->db->fetchOne($totalSql);
            $stats['total'] = $totalResult['total'];
            
            // Elementos disponibles
            $availableSql = "SELECT COUNT(*) as available FROM menu_items WHERE available = 1";
            $availableResult = $this->db->fetchOne($availableSql);
            $stats['available'] = $availableResult['available'];
            
            return [
                'success' => true,
                'data' => $stats
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al obtener estadísticas'];
        }
    }
}
?>