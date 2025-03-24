"use client"

import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../utils/Api"
import MainLayout from "../MainLayout"
import { AuthContext } from "../../context/AuthContext"

const CarrierList = () => {
  const [carriers, setCarriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedCarrier, setSelectedCarrier] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [deleteSuccess, setDeleteSuccess] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  // Función para obtener los transportistas
  const fetchCarriers = async () => {
    setLoading(true)
    try {
      const response = await api.get("/api/list-carriers")
      setCarriers(response.data.carriers)
    } catch (error) {
      console.error("Error al obtener los transportistas:", error)
      alert("No se pudieron cargar los transportistas.")
    } finally {
      setLoading(false)
    }
  }

  // Cargar los transportistas al montar el componente
  useEffect(() => {
    if (user) {
      fetchCarriers()
    }
  }, [user])

  // Función para determinar el color del estado
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "disponible":
        return styles.statusAvailable
      case "en ruta":
        return styles.statusOnRoute
      case "en mantenimiento":
        return styles.statusMaintenance
      case "inactivo":
        return styles.statusInactive
      default:
        return styles.statusDefault
    }
  }

  // Funciones para manejar acciones
  const handleCreateCarrier = () => {
    navigate("/carriers/create")
  }

  const handleViewCarrier = (carrierId) => {
    navigate(`/carriers/${carrierId}`)
  }

  const handleEditCarrier = (carrierId) => {
    navigate(`/carriers/${carrierId}/edit`)
  }

  const handleOpenDeleteModal = (carrier) => {
    setSelectedCarrier(carrier)
    setDeleteError("")
    setDeleteSuccess("")
    setDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false)
    setSelectedCarrier(null)
  }

  const handleDeleteCarrier = async () => {
    if (!selectedCarrier) return

    setDeleteLoading(true)
    setDeleteError("")
    setDeleteSuccess("")

    try {
      await api.delete(`/api/carriers/${selectedCarrier.id}`)
      setDeleteSuccess("Transportista eliminado exitosamente.")

      // Actualizar la lista después de eliminar
      setTimeout(() => {
        fetchCarriers()
        handleCloseDeleteModal()
      }, 1500)
    } catch (error) {
      console.error("Error al eliminar el transportista:", error)
      setDeleteError(error.response?.data?.message || "Error al eliminar el transportista.")
    } finally {
      setDeleteLoading(false)
    }
  }

  // Filtrar transportistas según búsqueda y filtro de estado
  const filteredCarriers = carriers.filter((carrier) => {
    const matchesSearch =
      carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrier.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrier.current_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carrier.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || carrier.status?.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  return (
    <MainLayout>
      <div style={styles.header}>
        <h2 style={styles.title}>Transportistas</h2>
        <div style={styles.headerButtons}>
          <button onClick={handleCreateCarrier} style={styles.createButton}>
            + Nuevo Transportista
          </button>
          <button onClick={fetchCarriers} style={styles.refreshButton}>
            Actualizar
          </button>
        </div>
      </div>

      <div style={styles.filtersContainer}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar por nombre, vehículo, ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterContainer}>
          <label style={styles.filterLabel}>Estado:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.filterSelect}>
            <option value="all">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="en ruta">En Ruta</option>
            <option value="en mantenimiento">En Mantenimiento</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Cargando transportistas...</p>
        </div>
      ) : filteredCarriers.length > 0 ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Vehículo</th>
                <th style={styles.th}>Capacidad</th>
                <th style={styles.th}>Ubicación Actual</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Órdenes Activas</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCarriers.map((carrier, index) => (
                <tr key={carrier.id} style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.td}>{carrier.id}</td>
                  <td style={styles.td}>{carrier.name}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusColor(carrier.status),
                      }}
                    >
                      {carrier.status || "No definido"}
                    </span>
                  </td>
                  <td style={styles.td}>{carrier.vehicle_type}</td>
                  <td style={styles.td}>{carrier.capacity} kg</td>
                  <td style={styles.td}>{carrier.current_city}</td>
                  <td style={styles.td}>{carrier.phone}</td>
                  <td style={styles.td}>{carrier.active_orders || 0}</td>
                  <td style={styles.actionsTd}>
                    <div style={styles.actionsContainer}>
                      <button
                        onClick={() => handleViewCarrier(carrier.id)}
                        style={styles.actionButton}
                        title="Ver detalles"
                      >
                        <span style={styles.viewIcon}>👁️</span>
                      </button>
                      <button
                        onClick={() => handleEditCarrier(carrier.id)}
                        style={styles.actionButton}
                        title="Editar transportista"
                      >
                        <span style={styles.editIcon}>✏️</span>
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(carrier)}
                        style={{ ...styles.actionButton, ...styles.deleteButton }}
                        title="Eliminar transportista"
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
          <div style={styles.emptyIcon}>🚚</div>
          <p style={styles.emptyText}>
            {searchTerm || statusFilter !== "all"
              ? "No se encontraron transportistas con los filtros aplicados."
              : "No hay transportistas registrados."}
          </p>
          <div style={styles.emptyActions}>
            <button onClick={handleCreateCarrier} style={styles.createEmptyButton}>
              Registrar nuevo transportista
            </button>
            {(searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
                style={styles.clearFiltersButton}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal para confirmar eliminación */}
      {deleteModalOpen && selectedCarrier && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirmar Eliminación</h3>
              <button onClick={handleCloseDeleteModal} style={styles.modalCloseButton}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.warningIcon}>⚠️</div>
              <p style={styles.warningText}>
                ¿Está seguro que desea eliminar al transportista <strong>{selectedCarrier.name}</strong>?
              </p>
              <p style={styles.warningSubtext}>
                Esta acción no se puede deshacer. Si el transportista tiene órdenes activas, no podrá ser eliminado.
              </p>

              {deleteError && <div style={styles.errorMessage}>{deleteError}</div>}
              {deleteSuccess && <div style={styles.successMessage}>{deleteSuccess}</div>}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={handleCloseDeleteModal} style={styles.cancelButton} disabled={deleteLoading}>
                Cancelar
              </button>
              <button onClick={handleDeleteCarrier} style={styles.deleteConfirmButton} disabled={deleteLoading}>
                {deleteLoading ? "Eliminando..." : "Eliminar"}
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
  filtersContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  filterContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  filterLabel: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
  },
  filterSelect: {
    padding: "10px 16px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    outline: "none",
    backgroundColor: "white",
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
    textAlign: "center",
  },
  emptyActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    justifyContent: "center",
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
  clearFiltersButton: {
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
    textAlign: "center",
  },
  warningIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  warningText: {
    fontSize: "16px",
    color: "#333",
    marginBottom: "12px",
  },
  warningSubtext: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "20px",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 20px",
    borderTop: "1px solid #eaeaea",
    backgroundColor: "#f8fafc",
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
  deleteConfirmButton: {
    backgroundColor: "#e53935",
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
    marginTop: "16px",
    textAlign: "left",
  },
  successMessage: {
    backgroundColor: "#e6f7ee",
    color: "#0d6832",
    padding: "10px 12px",
    borderRadius: "4px",
    fontSize: "14px",
    marginTop: "16px",
    textAlign: "left",
  },
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
}

export default CarrierList

