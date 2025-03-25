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

  // Agregar después de la declaración de estados existentes, antes de useContext
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [packageTypeFilter, setPackageTypeFilter] = useState("all")

  // Agregar después de la declaración de estados de filtros, antes de useContext
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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
      if (error.response?.status === 401 &&
        error.response?.data?.message === "Token inválido o expirado") {
        alert("Su sesión ha expirado. Por favor, inicie sesión nuevamente.")
        navigate("/login")
      } else{
      alert("No se pudieron cargar las órdenes.")
      }
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

  // Agregar después de fetchOrders() y antes de getStatusColor()
  // Modificar la función filteredOrders para incluir la paginación
  // Reemplazar la constante filteredOrders con esta implementación
  const filteredOrders = orders.filter((order) => {
    // Filtro de búsqueda
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      order.id?.toString().includes(searchLower) ||
      order.tracking_code?.toLowerCase().includes(searchLower) ||
      order.recipient_name?.toLowerCase().includes(searchLower) ||
      order.recipient_phone?.toLowerCase().includes(searchLower) ||
      order.origin_address?.toLowerCase().includes(searchLower) ||
      order.destination_address?.toLowerCase().includes(searchLower)

    // Filtro de estado
    const matchesStatus = statusFilter === "all" || order.status?.toLowerCase() === statusFilter.toLowerCase()

    // Filtro de fecha
    let matchesDate = true
    const orderDate = new Date(order.created_at)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    if (dateFilter === "today") {
      matchesDate = orderDate.toDateString() === today.toDateString()
    } else if (dateFilter === "yesterday") {
      matchesDate = orderDate.toDateString() === yesterday.toDateString()
    } else if (dateFilter === "lastWeek") {
      matchesDate = orderDate >= lastWeek
    } else if (dateFilter === "lastMonth") {
      matchesDate = orderDate >= lastMonth
    }

    // Filtro de tipo de paquete
    const matchesPackageType =
      packageTypeFilter === "all" || order.package_type?.toLowerCase() === packageTypeFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesDate && matchesPackageType
  })

  // Calcular el total de páginas y los elementos a mostrar en la página actual
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem)

  // Función para cambiar de página
  const paginate = (pageNumber) => {
    // Asegurarse de que el número de página esté dentro de los límites
    if (pageNumber < 1) pageNumber = 1
    if (pageNumber > totalPages) pageNumber = totalPages
    setCurrentPage(pageNumber)
  }

  // Función para cambiar el número de elementos por página
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value))
    setCurrentPage(1) // Resetear a la primera página cuando cambia el número de elementos por página
  }

  // Función para determinar el color del estado
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "entregado":
        return styles.statusDelivered
      case "en tránsito":
        return styles.statusInTransit
      case "en espera":
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

      {/* Agregar después del div de headerButtons y antes del bloque de loading */}
      <div style={styles.filtersContainer}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar por ID, código, destinatario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filtersGroup}>
          <div style={styles.filterContainer}>
            <label style={styles.filterLabel}>Estado:</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">Todos</option>
              <option value="en espera">En espera</option>
              <option value="en tránsito">En Tránsito</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div style={styles.filterContainer}>
            <label style={styles.filterLabel}>Fecha:</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={styles.filterSelect}>
              <option value="all">Todas</option>
              <option value="today">Hoy</option>
              <option value="yesterday">Ayer</option>
              <option value="lastWeek">Última semana</option>
              <option value="lastMonth">Último mes</option>
            </select>
          </div>
          <div style={styles.filterContainer}>
            <label style={styles.filterLabel}>Tipo:</label>
            <select
              value={packageTypeFilter}
              onChange={(e) => setPackageTypeFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">Todos</option>
              <option value="documento">Documento</option>
              <option value="paquete pequeño">Paquete pequeño</option>
              <option value="paquete mediano">Paquete mediano</option>
              <option value="paquete grande">Paquete grande</option>
              <option value="frágil">Frágil</option>
            </select>
          </div>
          {(searchTerm || statusFilter !== "all" || dateFilter !== "all" || packageTypeFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setDateFilter("all")
                setPackageTypeFilter("all")
              }}
              style={styles.clearFiltersButton}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Agregar después del div de filtersContainer y antes del bloque de loading */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Cargando órdenes...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div>
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
                  {/* <th style={styles.th}>Teléfono</th>
                  <th style={styles.th}>Peso</th>
                  <th style={styles.th}>Dimensiones</th> */}
                  <th style={styles.th}>Tipo</th>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((order, index) => (
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
                    {/* <td style={styles.td}>{order.recipient_phone}</td>
                    <td style={styles.td}>{order.package_weight} kg</td>
                    <td style={styles.td}>{order.package_dimensions}</td> */}
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
                        {order.status?.toLowerCase() == "en espera" && (
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

          {/* Paginador */}
          <div style={styles.paginationContainer}>
            <div style={styles.paginationInfo}>
              <span>
                Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredOrders.length)} de{" "}
                {filteredOrders.length} órdenes
              </span>
              <div style={styles.itemsPerPageContainer}>
                <label style={styles.itemsPerPageLabel}>Mostrar:</label>
                <select value={itemsPerPage} onChange={handleItemsPerPageChange} style={styles.itemsPerPageSelect}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div style={styles.paginationControls}>
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
                }}
                title="Primera página"
              >
                &laquo;
              </button>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
                }}
                title="Página anterior"
              >
                &lsaquo;
              </button>

              <div style={styles.paginationPages}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Mostrar 5 páginas centradas en la página actual cuando sea posible
                  let pageNum
                  if (totalPages <= 5) {
                    // Si hay 5 o menos páginas, mostrar todas
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    // Si estamos en las primeras 3 páginas, mostrar 1-5
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    // Si estamos en las últimas 3 páginas, mostrar las últimas 5
                    pageNum = totalPages - 4 + i
                  } else {
                    // En otro caso, mostrar 2 antes y 2 después de la página actual
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      style={{
                        ...styles.paginationButton,
                        ...(currentPage === pageNum ? styles.paginationButtonActive : {}),
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}),
                }}
                title="Página siguiente"
              >
                &rsaquo;
              </button>
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}),
                }}
                title="Última página"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📦</div>
          <p style={styles.emptyText}>
            {searchTerm || statusFilter !== "all" || dateFilter !== "all" || packageTypeFilter !== "all"
              ? "No se encontraron órdenes con los filtros aplicados."
              : "No hay órdenes disponibles."}
          </p>
          <div style={styles.emptyActions}>
            <button onClick={handleCreateOrder} style={styles.createEmptyButton}>
              {searchTerm || statusFilter !== "all" || dateFilter !== "all" || packageTypeFilter !== "all"
                ? "Crear nueva orden"
                : "Crear primera orden"}
            </button>
            {searchTerm || statusFilter !== "all" || dateFilter !== "all" || packageTypeFilter !== "all" ? (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setDateFilter("all")
                  setPackageTypeFilter("all")
                }}
                style={styles.clearFiltersButton}
              >
                Limpiar filtros
              </button>
            ) : (
              <button onClick={fetchOrders} style={styles.retryButton}>
                Actualizar
              </button>
            )}
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
  filtersContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "16px",
  },
  searchContainer: {
    flex: "1",
    minWidth: "250px",
  },
  searchInput: {
    width: "90%",
    padding: "10px 16px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    outline: "none",
  },
  filtersGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    alignItems: "flex-start",
  },
  filterContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  filterLabel: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    whiteSpace: "nowrap",
  },
  filterSelect: {
    padding: "10px 16px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    outline: "none",
    backgroundColor: "white",
  },
  clearFiltersButton: {
    backgroundColor: "#003c82",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
    whiteSpace: "nowrap",
  },
  paginationContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "white",
    borderTop: "1px solid #eaeaea",
    borderBottomLeftRadius: "8px",
    borderBottomRightRadius: "8px",
    flexWrap: "wrap",
    gap: "16px",
  },
  paginationInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    color: "#666",
    fontSize: "14px",
    flexWrap: "wrap",
  },
  itemsPerPageContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  itemsPerPageLabel: {
    fontSize: "14px",
    color: "#666",
  },
  itemsPerPageSelect: {
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    fontSize: "14px",
    backgroundColor: "white",
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  paginationButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "36px",
    height: "36px",
    padding: "0 8px",
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "4px",
    color: "#333",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  paginationButtonActive: {
    backgroundColor: "#003c82",
    color: "white",
    borderColor: "#003c82",
  },
  paginationButtonDisabled: {
    backgroundColor: "#f5f5f5",
    color: "#ccc",
    cursor: "not-allowed",
  },
  paginationPages: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
}

export default OrderList

