"use client"

import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../utils/Api"
import MainLayout from "../MainLayout"
import { AuthContext } from "../../context/AuthContext"

const OrderList = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState([])
  const [carriers, setCarriers] = useState([])
  const [loadingRoutes, setLoadingRoutes] = useState(false)
  const [loadingCarriers, setLoadingCarriers] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [assignmentData, setAssignmentData] = useState({
    routeId: "",
    carrierId: "",
  })
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignError, setAssignError] = useState("")
  const [assignSuccess, setAssignSuccess] = useState("")

  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  // Función para obtener las órdenes
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const response = await api.get("/api/orders")
      setOrders(response.data.orders)
    } catch (error) {
      console.error("Error al obtener las órdenes:", error)
      alert("No se pudieron cargar las órdenes.")
    } finally {
      setLoading(false)
    }
  }

  // Cargar las órdenes al montar el componente
  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user])

  // Función para determinar el color del estado
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "entregado":
        return styles.statusDelivered
      case "en tránsito":
        return styles.statusInTransit
      case "pendiente":
        return styles.statusPending
      case "cancelado":
        return styles.statusCancelled
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

  // Funciones para manejar acciones
  const handleCreateOrder = () => {
    navigate("/orders/create")
  }

  const handleViewOrder = (orderId) => {
    navigate(`/orders/${orderId}`)
  }

  const handleEditOrder = (orderId) => {
    alert(`Editar orden ${orderId}`)
  }

  const handleDeleteOrder = (orderId) => {
    alert(`Eliminar orden ${orderId}`)
  }

  // Funciones para manejar la asignación de ruta
  const handleOpenAssignModal = async (order) => {
    setSelectedOrder(order)
    setAssignmentData({
      routeId: "",
      carrierId: "",
    })
    setAssignError("")
    setAssignSuccess("")

    // Cargar rutas y transportistas
    await fetchRoutes()
    await fetchCarriers()

    setAssignModalOpen(true)
  }

  const handleCloseAssignModal = () => {
    setAssignModalOpen(false)
    setSelectedOrder(null)
  }

  const fetchRoutes = async () => {
    setLoadingRoutes(true)
    try {
      const response = await api.get("/api/list-routes")
      setRoutes(response.data.routes || [])
    } catch (error) {
      console.error("Error al obtener las rutas:", error)
      setAssignError("No se pudieron cargar las rutas disponibles.")
    } finally {
      setLoadingRoutes(false)
    }
  }

  const fetchCarriers = async () => {
    setLoadingCarriers(true)
    try {
      const response = await api.get("/api/list-carriers")
      setCarriers(response.data.carriers || [])
    } catch (error) {
      console.error("Error al obtener los transportistas:", error)
      setAssignError("No se pudieron cargar los transportistas disponibles.")
    } finally {
      setLoadingCarriers(false)
    }
  }

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target
    setAssignmentData({
      ...assignmentData,
      [name]: value,
    })
  }

  const handleAssignOrder = async () => {
    if (!assignmentData.routeId || !assignmentData.carrierId) {
      setAssignError("Por favor, seleccione una ruta y un transportista.")
      return
    }

    setAssignLoading(true)
    setAssignError("")
    setAssignSuccess("")

    try {
      const response = await api.post("/api/assign-manually", {
        orderId: selectedOrder.id,
        routeId: Number.parseInt(assignmentData.routeId),
        carrierId: Number.parseInt(assignmentData.carrierId),
      })

      setAssignSuccess("Orden asignada exitosamente.")

      // Actualizar la lista de órdenes después de asignar
      setTimeout(() => {
        fetchOrders()
        handleCloseAssignModal()
      }, 1500)
    } catch (error) {
      console.error("Error al asignar la orden:", error)
      setAssignError(error.response?.data?.message || "Error al asignar la orden.")
    } finally {
      setAssignLoading(false)
    }
  }

  return (
    <MainLayout>
      <div style={styles.header}>
        <h2 style={styles.title}>Lista de Órdenes</h2>
        <div style={styles.headerButtons}>
          <button onClick={handleCreateOrder} style={styles.createButton}>
            + Crear Orden
          </button>
          <button onClick={fetchOrders} style={styles.refreshButton}>
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Cargando órdenes...</p>
        </div>
      ) : orders.length > 0 ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Código</th>
                <th style={styles.th}>Destino</th>
                <th style={styles.th}>Origen</th>
                <th style={styles.th}>Destinatario</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Peso</th>
                <th style={styles.th}>Dimensiones</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id} style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.td}>{order.id}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusColor(order.status),
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={styles.td}>{order.tracking_code}</td>
                  <td style={styles.td} title={order.destination_address}>
                    {extractCityAndDepartment(order.destination_address)}
                  </td>
                  <td style={styles.td} title={order.origin_address}>
                    {extractCityAndDepartment(order.origin_address)}
                  </td>
                  <td style={styles.td}>{order.recipient_name}</td>
                  <td style={styles.td}>{order.recipient_phone}</td>
                  <td style={styles.td}>{order.package_weight} kg</td>
                  <td style={styles.td}>{order.package_dimensions}</td>
                  <td style={styles.td}>{order.package_type}</td>
                  <td style={styles.td}>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td style={styles.actionsTd}>
                    <div style={styles.actionsContainer}>
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        style={styles.actionButton}
                        title="Ver detalles"
                      >
                        <span style={styles.viewIcon}>👁️</span>
                      </button>
                      <button
                        onClick={() => handleEditOrder(order.id)}
                        style={styles.actionButton}
                        title="Editar orden"
                      >
                        <span style={styles.editIcon}>✏️</span>
                      </button>
                      {order.status?.toLowerCase() !== "en tránsito" && (
                        <button
                          onClick={() => handleOpenAssignModal(order)}
                          style={styles.actionButton}
                          title="Asignar ruta"
                        >
                          <span style={styles.assignIcon}>🚚</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        style={{ ...styles.actionButton, ...styles.deleteButton }}
                        title="Eliminar orden"
                      >
                        <span style={styles.deleteIcon}>🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📦</div>
          <p style={styles.emptyText}>No hay órdenes disponibles.</p>
          <div style={styles.emptyActions}>
            <button onClick={handleCreateOrder} style={styles.createEmptyButton}>
              Crear primera orden
            </button>
            <button onClick={fetchOrders} style={styles.retryButton}>
              Actualizar
            </button>
          </div>
        </div>
      )}

      {/* Modal para asignar ruta y transportista */}
      {assignModalOpen && selectedOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Asignar Ruta y Transportista</h3>
              <button onClick={handleCloseAssignModal} style={styles.modalCloseButton}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.orderInfo}>
                <p style={styles.orderInfoText}>
                  <strong>Orden:</strong> #{selectedOrder.id}
                </p>
                <p style={styles.orderInfoText}>
                  <strong>Origen:</strong> {extractCityAndDepartment(selectedOrder.origin_address)}
                </p>
                <p style={styles.orderInfoText}>
                  <strong>Destino:</strong> {extractCityAndDepartment(selectedOrder.destination_address)}
                </p>
                <p style={styles.orderInfoText}>
                  <strong>Peso:</strong> {selectedOrder.package_weight} kg
                </p>
              </div>

              {(loadingRoutes || loadingCarriers) && (
                <div style={styles.modalLoading}>
                  <div style={styles.loadingSpinner}></div>
                  <p>Cargando datos...</p>
                </div>
              )}

              {!loadingRoutes && !loadingCarriers && (
                <div style={styles.formContainer}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Seleccionar Ruta:</label>
                    <select
                      name="routeId"
                      value={assignmentData.routeId}
                      onChange={handleAssignmentChange}
                      style={styles.formSelect}
                    >
                      <option value="">Seleccione una ruta</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name || `${route.origin} → ${route.destination}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Seleccionar Transportista:</label>
                    <select
                      name="carrierId"
                      value={assignmentData.carrierId}
                      onChange={handleAssignmentChange}
                      style={styles.formSelect}
                    >
                      <option value="">Seleccione un transportista</option>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {carrier.name} - {carrier.vehicle_type} ({carrier.capacity} kg)
                        </option>
                      ))}
                    </select>
                  </div>

                  {assignError && <div style={styles.errorMessage}>{assignError}</div>}

                  {assignSuccess && <div style={styles.successMessage}>{assignSuccess}</div>}
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={handleCloseAssignModal} style={styles.cancelButton} disabled={assignLoading}>
                Cancelar
              </button>
              <button
                onClick={handleAssignOrder}
                style={styles.assignButton}
                disabled={assignLoading || !assignmentData.routeId || !assignmentData.carrierId}
              >
                {assignLoading ? "Asignando..." : "Asignar"}
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
  headerButtons: {
    display: "flex",
    gap: "12px",
  },
  createButton: {
    backgroundColor: "#00a86b",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
    boxShadow: "0 2px 4px rgba(0, 168, 107, 0.2)",
  },
  refreshButton: {
    backgroundColor: "#003c82",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
    boxShadow: "0 2px 4px rgba(0, 60, 130, 0.2)",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 0",
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
  tableContainer: {
    overflowX: "auto",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: "14px",
  },
  th: {
    backgroundColor: "#003c82",
    color: "white",
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: "bold",
    position: "sticky",
    top: 0,
    whiteSpace: "nowrap",
    borderBottom: "2px solid #002a5c",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #eaeaea",
    color: "#333",
    whiteSpace: "nowrap",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  actionsTd: {
    padding: "8px 16px",
    borderBottom: "1px solid #eaeaea",
    whiteSpace: "nowrap",
  },
  actionsContainer: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
  },
  actionButton: {
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "4px",
    padding: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
  },
  deleteButton: {
    color: "#e53935",
  },
  viewIcon: {
    fontSize: "16px",
  },
  editIcon: {
    fontSize: "16px",
  },
  assignIcon: {
    fontSize: "16px",
  },
  deleteIcon: {
    fontSize: "16px",
  },
  rowEven: {
    backgroundColor: "#f8fafc",
  },
  rowOdd: {
    backgroundColor: "white",
  },
  statusBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "12px",
    textAlign: "center",
    minWidth: "80px",
  },
  statusDelivered: {
    backgroundColor: "#e6f7ee",
    color: "#0d6832",
  },
  statusInTransit: {
    backgroundColor: "#e6f0ff",
    color: "#0047b3",
  },
  statusPending: {
    backgroundColor: "#fff8e6",
    color: "#b37400",
  },
  statusCancelled: {
    backgroundColor: "#ffe6e6",
    color: "#b30000",
  },
  statusDefault: {
    backgroundColor: "#f0f0f0",
    color: "#666666",
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
  emptyActions: {
    display: "flex",
    gap: "12px",
  },
  createEmptyButton: {
    backgroundColor: "#00a86b",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 20px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  retryButton: {
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
    maxWidth: "500px",
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
  orderInfo: {
    backgroundColor: "#f0f4f8",
    padding: "12px 16px",
    borderRadius: "6px",
    marginBottom: "20px",
  },
  orderInfoText: {
    margin: "6px 0",
    fontSize: "14px",
    color: "#333",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
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
  assignButton: {
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
  modalLoading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px 0",
  },
  errorMessage: {
    backgroundColor: "#ffe6e6",
    color: "#b30000",
    padding: "10px 12px",
    borderRadius: "4px",
    fontSize: "14px",
  },
  successMessage: {
    backgroundColor: "#e6f7ee",
    color: "#0d6832",
    padding: "10px 12px",
    borderRadius: "4px",
    fontSize: "14px",
  },
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
}

export default OrderList

