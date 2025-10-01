<?php
class Contact {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    public function createContact($data) {
        try {
            // Validar datos requeridos
            $required = ['name', 'email', 'subject', 'message'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    return ['success' => false, 'message' => "El campo {$field} es requerido"];
                }
            }
            
            // Validaciones específicas
            if (!isValidEmail($data['email'])) {
                return ['success' => false, 'message' => 'Email inválido'];
            }
            
            if (strlen($data['message']) < 10) {
                return ['success' => false, 'message' => 'El mensaje debe tener al menos 10 caracteres'];
            }
            
            // Insertar mensaje de contacto
            $sql = "INSERT INTO contacts (name, email, subject, message, status) 
                    VALUES (?, ?, ?, ?, 'unread')";
            
            $contactId = $this->db->insert($sql, [
                cleanInput($data['name']),
                cleanInput($data['email']),
                cleanInput($data['subject']),
                cleanInput($data['message'])
            ]);
            
            return [
                'success' => true,
                'message' => 'Mensaje enviado exitosamente. Te responderemos pronto.',
                'data' => [
                    'id' => $contactId,
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'subject' => $data['subject'],
                    'status' => 'unread'
                ]
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al enviar el mensaje'];
        }
    }
    
    public function getAllContacts($filters = []) {
        try {
            $page = isset($filters['page']) ? max(1, intval($filters['page'])) : 1;
            $limit = isset($filters['limit']) ? max(1, min(50, intval($filters['limit']))) : 10;
            $offset = ($page - 1) * $limit;
            $status = isset($filters['status']) ? $filters['status'] : 'all';
            
            $whereClause = '';
            $params = [];
            
            if ($status !== 'all') {
                $whereClause = 'WHERE status = ?';
                $params[] = $status;
            }
            
            // Contar total
            $countSql = "SELECT COUNT(*) as total FROM contacts $whereClause";
            $countResult = $this->db->fetchOne($countSql, $params);
            $total = $countResult['total'];
            
            // Obtener mensajes
            $sql = "SELECT * FROM contacts $whereClause 
                    ORDER BY created_at DESC 
                    LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $contacts = $this->db->fetchAll($sql, $params);
            
            return [
                'success' => true,
                'data' => [
                    'contacts' => $contacts,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $total,
                        'pages' => ceil($total / $limit)
                    ]
                ]
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al obtener mensajes'];
        }
    }
    
    public function getContactById($id) {
        try {
            $sql = "SELECT * FROM contacts WHERE id = ?";
            $contact = $this->db->fetchOne($sql, [$id]);
            
            if (!$contact) {
                return ['success' => false, 'message' => 'Mensaje no encontrado'];
            }
            
            return [
                'success' => true,
                'data' => $contact
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al obtener el mensaje'];
        }
    }
    
    public function updateContactStatus($id, $status) {
        try {
            $validStatuses = ['unread', 'read', 'replied'];
            if (!in_array($status, $validStatuses)) {
                return ['success' => false, 'message' => 'Estado inválido'];
            }
            
            $sql = "UPDATE contacts SET status = ? WHERE id = ?";
            $affectedRows = $this->db->update($sql, [$status, $id]);
            
            if ($affectedRows > 0) {
                return [
                    'success' => true,
                    'message' => 'Estado actualizado exitosamente',
                    'data' => ['id' => $id, 'status' => $status]
                ];
            } else {
                return ['success' => false, 'message' => 'Mensaje no encontrado'];
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al actualizar el estado'];
        }
    }
    
    public function deleteContact($id) {
        try {
            $sql = "DELETE FROM contacts WHERE id = ?";
            $affectedRows = $this->db->delete($sql, [$id]);
            
            if ($affectedRows > 0) {
                return [
                    'success' => true,
                    'message' => 'Mensaje eliminado exitosamente'
                ];
            } else {
                return ['success' => false, 'message' => 'Mensaje no encontrado'];
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al eliminar el mensaje'];
        }
    }
    
    public function getContactStats() {
        try {
            $stats = [];
            
            // Total de mensajes por estado
            $sql = "SELECT status, COUNT(*) as count FROM contacts GROUP BY status";
            $statusCounts = $this->db->fetchAll($sql);
            
            $stats['by_status'] = [];
            foreach ($statusCounts as $row) {
                $stats['by_status'][$row['status']] = $row['count'];
            }
            
            // Total general
            $totalSql = "SELECT COUNT(*) as total FROM contacts";
            $totalResult = $this->db->fetchOne($totalSql);
            $stats['total'] = $totalResult['total'];
            
            // Mensajes no leídos
            $unreadSql = "SELECT COUNT(*) as unread FROM contacts WHERE status = 'unread'";
            $unreadResult = $this->db->fetchOne($unreadSql);
            $stats['unread'] = $unreadResult['unread'];
            
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