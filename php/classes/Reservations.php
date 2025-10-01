<?php
class Reservations {
    private $db;
    
    public function __construct() {
        $this->db = new Database();
    }
    
    public function createReservation($data) {
        try {
            // Validar datos requeridos
            $required = ['name', 'email', 'phone', 'date', 'time', 'guests'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    return ['success' => false, 'message' => "El campo {$field} es requerido"];
                }
            }
            
            // Validaciones específicas
            if (!isValidEmail($data['email'])) {
                return ['success' => false, 'message' => 'Email inválido'];
            }
            
            $guests = intval($data['guests']);
            if ($guests < 1 || $guests > 12) {
                return ['success' => false, 'message' => 'Número de comensales debe ser entre 1 y 12'];
            }
            
            // Verificar que la fecha no sea en el pasado
            $reservationDateTime = strtotime($data['date'] . ' ' . $data['time']);
            if ($reservationDateTime <= time()) {
                return ['success' => false, 'message' => 'No se pueden hacer reservas para fechas pasadas'];
            }
            
            // Insertar reserva
            $sql = "INSERT INTO reservations (name, email, phone, date, time, guests, message, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')";
            
            $reservationId = $this->db->insert($sql, [
                cleanInput($data['name']),
                cleanInput($data['email']),
                cleanInput($data['phone']),
                $data['date'],
                $data['time'],
                $guests,
                isset($data['message']) ? cleanInput($data['message']) : ''
            ]);
            
            return [
                'success' => true,
                'message' => 'Reserva creada exitosamente',
                'data' => [
                    'id' => $reservationId,
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'date' => $data['date'],
                    'time' => $data['time'],
                    'guests' => $guests,
                    'status' => 'pending'
                ]
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al crear la reserva'];
        }
    }
    
    public function getAllReservations($filters = []) {
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
            $countSql = "SELECT COUNT(*) as total FROM reservations $whereClause";
            $countResult = $this->db->fetchOne($countSql, $params);
            $total = $countResult['total'];
            
            // Obtener reservas
            $sql = "SELECT * FROM reservations $whereClause 
                    ORDER BY created_at DESC 
                    LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            $reservations = $this->db->fetchAll($sql, $params);
            
            return [
                'success' => true,
                'data' => [
                    'reservations' => $reservations,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => $total,
                        'pages' => ceil($total / $limit)
                    ]
                ]
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al obtener reservas'];
        }
    }
    
    public function getReservationById($id) {
        try {
            $sql = "SELECT * FROM reservations WHERE id = ?";
            $reservation = $this->db->fetchOne($sql, [$id]);
            
            if (!$reservation) {
                return ['success' => false, 'message' => 'Reserva no encontrada'];
            }
            
            return [
                'success' => true,
                'data' => $reservation
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al obtener la reserva'];
        }
    }
    
    public function updateReservation($id, $data) {
        try {
            // Verificar que la reserva existe
            $existing = $this->getReservationById($id);
            if (!$existing['success']) {
                return $existing;
            }
            
            $updateFields = [];
            $params = [];
            
            if (isset($data['name']) && !empty($data['name'])) {
                $updateFields[] = 'name = ?';
                $params[] = cleanInput($data['name']);
            }
            
            if (isset($data['email']) && !empty($data['email'])) {
                if (!isValidEmail($data['email'])) {
                    return ['success' => false, 'message' => 'Email inválido'];
                }
                $updateFields[] = 'email = ?';
                $params[] = cleanInput($data['email']);
            }
            
            if (isset($data['phone']) && !empty($data['phone'])) {
                $updateFields[] = 'phone = ?';
                $params[] = cleanInput($data['phone']);
            }
            
            if (isset($data['date']) && !empty($data['date'])) {
                $updateFields[] = 'date = ?';
                $params[] = $data['date'];
            }
            
            if (isset($data['time']) && !empty($data['time'])) {
                $updateFields[] = 'time = ?';
                $params[] = $data['time'];
            }
            
            if (isset($data['guests'])) {
                $guests = intval($data['guests']);
                if ($guests < 1 || $guests > 12) {
                    return ['success' => false, 'message' => 'Número de comensales debe ser entre 1 y 12'];
                }
                $updateFields[] = 'guests = ?';
                $params[] = $guests;
            }
            
            if (isset($data['message'])) {
                $updateFields[] = 'message = ?';
                $params[] = cleanInput($data['message']);
            }
            
            if (empty($updateFields)) {
                return ['success' => false, 'message' => 'No hay campos para actualizar'];
            }
            
            $params[] = $id;
            $sql = "UPDATE reservations SET " . implode(', ', $updateFields) . " WHERE id = ?";
            
            $affectedRows = $this->db->update($sql, $params);
            
            if ($affectedRows > 0) {
                return $this->getReservationById($id);
            } else {
                return ['success' => false, 'message' => 'No se pudo actualizar la reserva'];
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al actualizar la reserva'];
        }
    }
    
    public function updateReservationStatus($id, $status) {
        try {
            $validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
            if (!in_array($status, $validStatuses)) {
                return ['success' => false, 'message' => 'Estado inválido'];
            }
            
            $sql = "UPDATE reservations SET status = ? WHERE id = ?";
            $affectedRows = $this->db->update($sql, [$status, $id]);
            
            if ($affectedRows > 0) {
                return [
                    'success' => true,
                    'message' => 'Estado actualizado exitosamente',
                    'data' => ['id' => $id, 'status' => $status]
                ];
            } else {
                return ['success' => false, 'message' => 'Reserva no encontrada'];
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al actualizar el estado'];
        }
    }
    
    public function deleteReservation($id) {
        try {
            $sql = "DELETE FROM reservations WHERE id = ?";
            $affectedRows = $this->db->delete($sql, [$id]);
            
            if ($affectedRows > 0) {
                return [
                    'success' => true,
                    'message' => 'Reserva eliminada exitosamente'
                ];
            } else {
                return ['success' => false, 'message' => 'Reserva no encontrada'];
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al eliminar la reserva'];
        }
    }
    
    public function getReservationStats() {
        try {
            $stats = [];
            
            // Total de reservas por estado
            $sql = "SELECT status, COUNT(*) as count FROM reservations GROUP BY status";
            $statusCounts = $this->db->fetchAll($sql);
            
            $stats['by_status'] = [];
            foreach ($statusCounts as $row) {
                $stats['by_status'][$row['status']] = $row['count'];
            }
            
            // Total general
            $totalSql = "SELECT COUNT(*) as total FROM reservations";
            $totalResult = $this->db->fetchOne($totalSql);
            $stats['total'] = $totalResult['total'];
            
            // Reservas de hoy
            $todaySql = "SELECT COUNT(*) as today FROM reservations WHERE date = ?";
            $todayResult = $this->db->fetchOne($todaySql, [date('Y-m-d')]);
            $stats['today'] = $todayResult['today'];
            
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