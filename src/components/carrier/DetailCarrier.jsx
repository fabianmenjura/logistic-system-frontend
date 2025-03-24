"use client"

import { useState, useEffect, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../../utils/Api"
import MainLayout from "../MainLayout"
import { AuthContext } from "../../context/AuthContext"

const CarrierDetail = () => {
  const { carrierId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [carrier, setCarrier] = useState(null)
  const [activeOrders, setActiveOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  const [statusUpdateError, setStatusUpdateError] = useState("")
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState("")

  // Función para obtener los detalles del transportista
  const fetchCarrierDetails = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/api/list-carriers/${carrierId}`)
      
      setCarrier(response.data.carrier)
      setNewStatus(response.data.carrier.status || "")
    } catch (error) {
      console.error("Error al obtener los detalles del transportista:", error)
      alert("No se pudieron cargar los detalles del transportista.")
    } finally {
      setLoading(false)
    }
  }

  // Función para obtener las órdenes activas del transportista
  const fetchActiveOrders = async () => {
    setOrdersLoading(true)
    try {
      const response = await api.get(`/api/carriers/${carrierId}/orders`)
      setActiveOrders(response.data.orders || [])
    } catch (error) {
      console.error("Error al obtener las órdenes del transportista:", error)
    } finally {
      setOrdersLoading(false)
    }
  }

  // Cargar los datos al montar el componente
  useEffect(() => {
    if (user) {
      fetchCarrierDetails()
      fetchActiveOrders()
    }
  }, [user, carrierId])

  // Función para determinar el color del estado
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "disponible":
        return styles.statusAvailable
      case "en ruta":
        return styles.statusOnRoute
      case "en tránsito":
        return styles.statusOnRoute
      case "entregado":
        return styles.statusAvailable
      case "en mantenimiento":
        return styles.statusMaintenance
      case "inactivo":
        return styles.statusInactive
      default:
        return styles.statusDefault
    }
  }

  // Función para extraer ciudad y departamento de una dirección completa
  const extractCityAndDepartment = (fullAddress) => {
    if (!fullAddress) return "No disponible"

    // La dirección tiene formato: "Calle, número, Ciudad, Departamento, Colombia"
    const parts = fullAddress.split(",").map((part) => part.trim())

    // Si hay al menos 3 partes (dirección, ciudad, departamento, [país])
    if (parts.length >= 3) {
      // Extraer ciudad y departamento (normalmente los dos últimos antes de "Colombia")
      const departmentIndex = parts.findIndex((part) => part.toLowerCase() === "colombia") - 1
      const cityIndex = departmentIndex - 1

      if (departmentIndex > 0 && cityIndex >= 0) {
        return `${parts[cityIndex]}, ${parts[departmentIndex]}`
      }

      // Si no encontramos "Colombia", asumimos que los dos últimos son ciudad y departamento
      if (parts.length >= 2) {
        return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`
      }
    }

    return fullAddress // Devolver la dirección completa si no podemos extraer
  }

  // Funciones para manejar la actualización de estado
  const handleOpenStatusModal = () => {
    setNewStatus(carrier.status || "")
    setStatusUpdateError("")
    setStatusUpdateSuccess("")
    setStatusUpdateModalOpen(true)
  }

  const handleCloseStatusModal = () => {
    setStatusUpdateModalOpen(false)
  }

  const handleStatusChange = (e) => {
    setNewStatus(e.target.value)
  }

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      setStatusUpdateError("Por favor, seleccione un estado.")
      return
    }

    setStatusUpdateLoading(true)
    setStatusUpdateError("")
    setStatusUpdateSuccess("")

    try {
      await api.patch(`/api/carriers/${carrierId}/status`, {
        status: newStatus,
      })

      setStatusUpdateSuccess("Estado actualizado exitosamente.")

      // Actualizar los detalles después de cambiar el estado
      setTimeout(() => {
        fetchCarrierDetails()
        handleCloseStatusModal()
      }, 1500)
    } catch (error) {
      console.error("Error al actualizar el estado:", error)
      setStatusUpdateError(error.response?.data?.message || "Error al actualizar el estado.")
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  return (
    <MainLayout>
      <div style={styles.header}>
        <h2 style={styles.title}>Detalles del Transportista</h2>
        <button onClick={() => navigate("/carriers")} style={styles.backButton}>
          ← Volver a la lista
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Cargando detalles del transportista...</p>
        </div>
      ) : carrier ? (
        <div style={styles.container}>
          <div style={styles.carrierHeader}>
            <div style={styles.carrierIdContainer}>
              <span style={styles.carrierIdLabel}>Transportista #</span>
              <span style={styles.carrierId}>{carrierId}</span>
            </div>
            <div style={styles.statusContainer}>
              <span style={styles.statusLabel}>Estado:</span>
              <span
                style={{
                  ...styles.statusBadge,
                  ...getStatusColor(carrier.status),
                }}
              >
                {carrier.status || "No definido"}
              </span>
              <button onClick={handleOpenStatusModal} style={styles.updateStatusButton}>
                Actualizar Estado
              </button>
            </div>
          </div>

          <div style={styles.infoSection}>
            <div style={styles.infoHeader}>
              <span style={styles.infoIcon}>👤</span>
              <span style={styles.infoTitle}>Información Personal</span>
            </div>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Nombre:</span>
                <span style={styles.infoValue}>{carrier.name}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Teléfono:</span>
                <span style={styles.infoValue}>{carrier.phone}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Email:</span>
                <span style={styles.infoValue}>{carrier.email || "No disponible"}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Documento:</span>
                <span style={styles.infoValue}>{carrier.document_id || "No disponible"}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Fecha de registro:</span>
                <span style={styles.infoValue}>
                  {carrier.created_at
                    ? new Date(carrier.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "No disponible"}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.infoSection}>
            <div style={styles.infoHeader}>
              <span style={styles.infoIcon}>🚚</span>
              <span style={styles.infoTitle}>Información del Vehículo</span>
            </div>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Tipo de vehículo:</span>
                <span style={styles.infoValue}>{carrier.vehicle_type}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Placa:</span>
                <span style={styles.infoValue}>{carrier.license_plate || "No disponible"}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Capacidad:</span>
                <span style={styles.infoValue}>{carrier.capacity} kg</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Modelo:</span>
                <span style={styles.infoValue}>{carrier.vehicle_model || "No disponible"}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Año:</span>
                <span style={styles.infoValue}>{carrier.vehicle_year || "No disponible"}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Último mantenimiento:</span>
                <span style={styles.infoValue}>
                  {carrier.last_maintenance ? new Date(carrier.last_maintenance).toLocaleDateString() : "No disponible"}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.infoSection}>
            <div style={styles.infoHeader}>
              <span style={styles.infoIcon}>📍</span>
              <span style={styles.infoTitle}>Ubicación y Actividad</span>
            </div>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Ubicación actual:</span>
                <span style={styles.infoValue}>{carrier.current_city || "No disponible"}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Última actualización:</span>
                <span style={styles.infoValue}>
                  {carrier.last_update ? new Date(carrier.last_update).toLocaleString() : "No disponible"}
                </span>
              </div>
              {/* <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Órdenes activas:</span>
                <span style={styles.infoValue}>{carrier.active_orders || 0}</span>
              </div> */}
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Órdenes completadas:</span>
                <span style={styles.infoValue}>{carrier.completed_orders || 0}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Distancia recorrida:</span>
                <span style={styles.infoValue}>{carrier.total_distance || 0} km</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Calificación:</span>
                <span style={styles.infoValue}>{carrier.rating ? `${carrier.rating}/5 ⭐` : "Sin calificaciones"}</span>
              </div>
            </div>
          </div>

          {/* Sección de órdenes activas */}
          <div style={styles.ordersSection}>
            <div style={styles.ordersHeader}>
              <h3 style={styles.ordersTitle}>Órdenes Activas</h3>
            </div>

            {ordersLoading ? (
              <div style={styles.ordersLoading}>
                <div style={styles.loadingSpinner}></div>
                <p>Cargando órdenes...</p>
              </div>
            ) : activeOrders.length > 0 ? (
              <div style={styles.ordersTableContainer}>
                <table style={styles.ordersTable}>
                  <thead>
                    <tr>
                      <th style={styles.ordersTh}>ID</th>
                      <th style={styles.ordersTh}>Estado</th>
                      <th style={styles.ordersTh}>Origen</th>
                      <th style={styles.ordersTh}>Destino</th>
                      <th style={styles.ordersTh}>Peso</th>
                      {/* <th style={styles.ordersTh}>Fecha Asignación</th> */}
                      <th style={styles.ordersTh}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeOrders.map((order, index) => (
                      <tr key={order.id} style={index % 2 === 0 ? styles.ordersRowEven : styles.ordersRowOdd}>
                        <td style={styles.ordersTd}>{order.id}</td>
                        <td style={styles.ordersTd}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...getStatusColor(order.status),
                            }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td style={styles.ordersTd} title={order.origin_address}>
                          {extractCityAndDepartment(order.origin_address)}
                        </td>
                        <td style={styles.ordersTd} title={order.destination_address}>
                          {extractCityAndDepartment(order.destination_address)}
                        </td>
                        <td style={styles.ordersTd}>{order.package_weight} kg</td>
                        {/* <td style={styles.ordersTd}>{new Date(order.assignment_date).toLocaleDateString()}</td> */}
                        <td style={styles.ordersTd}>
                          <button onClick={() => navigate(`/orders/${order.id}`)} style={styles.viewOrderButton}>
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={styles.noOrdersMessage}>
                <p>Este transportista no tiene órdenes activas actualmente.</p>
              </div>
            )}
          </div>

          <div style={styles.actionsContainer}>
            <button style={styles.editButton} onClick={() => navigate(`/carriers/${carrierId}/edit`)}>
              Editar Transportista
            </button>
            <button
              style={styles.deleteButton}
              onClick={() => {
                if (window.confirm("¿Está seguro que desea eliminar este transportista?")) {
                  // Lógica para eliminar transportista
                  alert("Funcionalidad de eliminación pendiente")
                }
              }}
            >
              Eliminar Transportista
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔍</div>
          <p style={styles.emptyText}>No se encontraron detalles para este transportista.</p>
          <button onClick={() => navigate("/carriers")} style={styles.backButtonEmpty}>
            Volver a la lista de transportistas
          </button>
        </div>
      )}

      {/* Modal para actualizar estado */}
      {statusUpdateModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Actualizar Estado</h3>
              <button onClick={handleCloseStatusModal} style={styles.modalCloseButton}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Seleccione el nuevo estado:</label>
                <select value={newStatus} onChange={handleStatusChange} style={styles.formSelect}>
                  <option value="">Seleccione un estado</option>
                  <option value="Disponible">Disponible</option>
                  <option value="En Ruta">En Ruta</option>
                  <option value="En Mantenimiento">En Mantenimiento</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              {statusUpdateError && <div style={styles.errorMessage}>{statusUpdateError}</div>}

              {statusUpdateSuccess && <div style={styles.successMessage}>{statusUpdateSuccess}</div>}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={handleCloseStatusModal} style={styles.cancelButton} disabled={statusUpdateLoading}>
                Cancelar
              </button>
              <button
                onClick={handleUpdateStatus}
                style={styles.updateButton}
                disabled={statusUpdateLoading || !newStatus}
              >
                {statusUpdateLoading ? "Actualizando..." : "Actualizar Estado"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

// Estilos mejorados
const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#003c82",
    margin: 0,
  },
  backButton: {
    backgroundColor: "#f5f5f5",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
    display: "flex",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  carrierHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #eaeaea",
    backgroundColor: "#f8fafc",
    flexWrap: "wrap",
    gap: "16px",
  },
  carrierIdContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  carrierIdLabel: {
    fontSize: "16px",
    color: "#666",
    fontWeight: "bold",
  },
  carrierId: {
    fontSize: "18px",
    color: "#333",
    fontWeight: "bold",
  },
  statusContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  statusLabel: {
    fontSize: "14px",
    color: "#666",
  },
  statusBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "16px",
    fontWeight: "bold",
    fontSize: "14px",
    textAlign: "center",
    minWidth: "100px",
  },
  statusAvailable: {
    backgroundColor: "#e6f7ee",
    color: "#0d6832",
  },
  statusOnRoute: {
    backgroundColor: "#e6f0ff",
    color: "#0047b3",
  },
  statusMaintenance: {
    backgroundColor: "#fff8e6",
    color: "#b37400",
  },
  statusInactive: {
    backgroundColor: "#ffe6e6",
    color: "#b30000",
  },
  statusDefault: {
    backgroundColor: "#f0f0f0",
    color: "#666666",
  },
  updateStatusButton: {
    backgroundColor: "#003c82",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    fontSize: "13px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  infoSection: {
    padding: "20px",
    borderBottom: "1px solid #eaeaea",
  },
  infoHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  infoIcon: {
    fontSize: "20px",
  },
  infoTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  infoLabel: {
    fontSize: "13px",
    color: "#666",
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: "15px",
    color: "#333",
  },
  ordersSection: {
    padding: "20px",
    borderBottom: "1px solid #eaeaea",
  },
  ordersHeader: {
    marginBottom: "16px",
  },
  ordersTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#003c82",
    margin: 0,
  },
  ordersLoading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px 0",
  },
  ordersTableContainer: {
    overflowX: "auto",
  },
  ordersTable: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "14px",
  },
  ordersTh: {
    backgroundColor: "#f0f4f8",
    color: "#333",
    padding: "12px 16px",
    textAlign: "left",
    fontWeight: "bold",
    borderBottom: "2px solid #e0e0e0",
  },
  ordersTd: {
    padding: "10px 16px",
    borderBottom: "1px solid #eaeaea",
    color: "#333",
  },
  ordersRowEven: {
    backgroundColor: "#f8fafc",
  },
  ordersRowOdd: {
    backgroundColor: "white",
  },
  viewOrderButton: {
    backgroundColor: "#003c82",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "6px 10px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  noOrdersMessage: {
    padding: "30px 0",
    textAlign: "center",
    color: "#666",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px dashed #ccc",
  },
  actionsContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "20px",
  },
  editButton: {
    backgroundColor: "#003c82",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 20px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  deleteButton: {
    backgroundColor: "#fff",
    color: "#e53935",
    border: "1px solid #e53935",
    borderRadius: "4px",
    padding: "10px 20px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(0, 60, 130, 0.1)",
    borderRadius: "50%",
    borderTop: "4px solid #003c82",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    color: "#666",
    fontSize: "16px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "18px",
    color: "#666",
    marginBottom: "20px",
  },
  backButtonEmpty: {
    backgroundColor: "#003c82",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 20px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  // Estilos para el modal
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    width: "90%",
    maxWidth: "400px",
    maxHeight: "90vh",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #eaeaea",
    backgroundColor: "#f8fafc",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#003c82",
    margin: 0,
  },
  modalCloseButton: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#666",
  },
  modalBody: {
    padding: "20px",
    flexGrow: 1,
    overflowY: "auto",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 20px",
    borderTop: "1px solid #eaeaea",
    backgroundColor: "#f8fafc",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  formLabel: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
  },
  formSelect: {
    padding: "10px 12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "14px",
    backgroundColor: "#fff",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  updateButton: {
    backgroundColor: "#003c82",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  errorMessage: {
    backgroundColor: "#ffe6e6",
    color: "#b30000",
    padding: "10px 12px",
    borderRadius: "4px",
    fontSize: "14px",
    marginBottom: "16px",
  },
  successMessage: {
    backgroundColor: "#e6f7ee",
    color: "#0d6832",
    padding: "10px 12px",
    borderRadius: "4px",
    fontSize: "14px",
    marginBottom: "16px",
  },
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
}

export default CarrierDetail

