"use client"

import { useState, useEffect, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../../utils/Api"
import MainLayout from "../MainLayout"
import { AuthContext } from "../../context/AuthContext"

const OrderHistoryView = () => {
  const { trackingCode } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const [order, setOrder] = useState(null)
  const [statusHistory, setStatusHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTrackingCode, setSearchTrackingCode] = useState(trackingCode || "")
  const [isSearching, setIsSearching] = useState(false)

  // Modificar la función searchOrderByTrackingCode para que busque la orden y luego su historial
  const searchOrderByTrackingCode = async (code) => {
    if (!code.trim()) return

    setIsSearching(true)
    setLoading(true)
    setError(null)

    try {
      // Usar el endpoint para buscar por código de seguimiento
      const response = await api.get(`/api/orders/tracking/${code}`)
      setOrder(response.data.order)

      // Si encontramos la orden, obtener su historial
      if (response.data.order?.id) {
        fetchStatusHistory(response.data.order.id)
      } else {
        setStatusHistory([])
      }
    } catch (error) {
      console.error("Error al buscar la orden:", error)
      setError("No se pudo encontrar información para el código de seguimiento proporcionado.")
      setOrder(null)
      setStatusHistory([])
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }

  // Mantener la función fetchStatusHistory separada
  const fetchStatusHistory = async (orderId) => {
    try {
      const response = await api.get(`/api/orders/${orderId}/status-history`)
      // console.log("status", response.data.order);
      setStatusHistory(response.data.order || [])
    } catch (error) {
      console.error("Error al obtener el historial de estados:", error)
      setStatusHistory([])
    }
  }

  // Buscar la orden si viene un código de seguimiento en la URL
  useEffect(() => {
    if (trackingCode) {
      searchOrderByTrackingCode(trackingCode)
    }
  }, [trackingCode])

  // Modificar la función handleSearch para que no navegue a una nueva URL
  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchTrackingCode.trim()) return

    // No navegamos, simplemente buscamos la orden
    searchOrderByTrackingCode(searchTrackingCode.trim())
  }

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

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "No disponible"

    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <MainLayout>
      <div style={styles.header}>
        <h2 style={styles.title}>Historial de Orden</h2>
        <button onClick={() => navigate("/orders")} style={styles.backButton}>
          ← Volver a la lista
        </button>
      </div>

      {/* Formulario de búsqueda */}
      <div style={styles.searchContainer}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            placeholder="Ingrese código de seguimiento (ej: 1IZTQHK9GZ)"
            value={searchTrackingCode}
            onChange={(e) => setSearchTrackingCode(e.target.value)}
            style={styles.searchInput}
            disabled={isSearching}
          />
          <button type="submit" style={styles.searchButton} disabled={isSearching || !searchTrackingCode.trim()}>
            {isSearching ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Buscando información de la orden...</p>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>❌</div>
          <p style={styles.errorText}>{error}</p>
          <p style={styles.errorSubtext}>Verifique el código de seguimiento e intente nuevamente.</p>
        </div>
      ) : order ? (
        <div style={styles.orderContainer}>
          {/* Encabezado de la orden */}
          <div style={styles.orderHeader}>
            <div style={styles.orderInfo}>
              <div style={styles.orderIdContainer}>
                <span style={styles.orderIdLabel}>Orden #</span>
                <span style={styles.orderId}>{order.id}</span>
              </div>
              <div style={styles.trackingCodeContainer}>
                <span style={styles.trackingCodeLabel}>Código de seguimiento:</span>
                <span style={styles.trackingCode}>{order.tracking_code}</span>
              </div>
              <div style={styles.dateContainer}>
                <span style={styles.dateLabel}>Fecha de creación:</span>
                <span style={styles.dateValue}>{formatDate(order.created_at)}</span>
              </div>
            </div>
            <div style={styles.statusContainer}>
              <span style={styles.statusLabel}>Estado actual:</span>
              <span
                style={{
                  ...styles.statusBadge,
                  ...getStatusColor(order.status),
                }}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Detalles de la orden */}
          <div style={styles.detailsGrid}>
            <div style={styles.detailsSection}>
              <h3 style={styles.sectionTitle}>Información del Paquete</h3>
              <div style={styles.detailsContent}>
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>📦</span>
                  <div style={styles.detailInfo}>
                    <span style={styles.detailLabel}>Tipo de paquete</span>
                    <span style={styles.detailValue}>{order.package_type}</span>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>⚖️</span>
                  <div style={styles.detailInfo}>
                    <span style={styles.detailLabel}>Peso</span>
                    <span style={styles.detailValue}>{order.package_weight} kg</span>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>📏</span>
                  <div style={styles.detailInfo}>
                    <span style={styles.detailLabel}>Dimensiones</span>
                    <span style={styles.detailValue}>{order.package_dimensions}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.detailsSection}>
              <h3 style={styles.sectionTitle}>Información del Destinatario</h3>
              <div style={styles.detailsContent}>
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>👤</span>
                  <div style={styles.detailInfo}>
                    <span style={styles.detailLabel}>Nombre</span>
                    <span style={styles.detailValue}>{order.recipient_name}</span>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>📞</span>
                  <div style={styles.detailInfo}>
                    <span style={styles.detailLabel}>Teléfono</span>
                    <span style={styles.detailValue}>{order.recipient_phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Direcciones */}
          <div style={styles.addressesSection}>
            <div style={styles.addressBox}>
              <h3 style={styles.addressTitle}>
                <span style={styles.addressIcon}>🏠</span>
                Dirección de Origen
              </h3>
              <div style={styles.addressContent}>
                <div style={styles.addressLocation}>{extractCityAndDepartment(order.origin_address)}</div>
                <div style={styles.addressDetail}>{order.origin_address}</div>
              </div>
            </div>

            <div style={styles.addressDivider}>
              <div style={styles.dividerLine}></div>
              <span style={styles.dividerIcon}>➡️</span>
              <div style={styles.dividerLine}></div>
            </div>

            <div style={styles.addressBox}>
              <h3 style={styles.addressTitle}>
                <span style={styles.addressIcon}>📍</span>
                Dirección de Destino
              </h3>
              <div style={styles.addressContent}>
                <div style={styles.addressLocation}>{extractCityAndDepartment(order.destination_address)}</div>
                <div style={styles.addressDetail}>{order.destination_address}</div>
              </div>
            </div>
          </div>

          {/* Información del transportista si está asignado */}
          {order.carrier_id && (
            <div style={styles.carrierSection}>
              <h3 style={styles.sectionTitle}>Información del Transportista</h3>
              <div style={styles.carrierContent}>
                <div style={styles.carrierItem}>
                  <span style={styles.carrierIcon}>🚚</span>
                  <div style={styles.carrierInfo}>
                    <span style={styles.carrierLabel}>Transportista</span>
                    <span style={styles.carrierValue}>
                      {order.carrier_name || `Transportista #${order.carrier_id}`}
                    </span>
                  </div>
                </div>
                {order.vehicle_type && (
                  <div style={styles.carrierItem}>
                    <span style={styles.carrierIcon}>🚗</span>
                    <div style={styles.carrierInfo}>
                      <span style={styles.carrierLabel}>Vehículo</span>
                      <span style={styles.carrierValue}>{order.vehicle_type}</span>
                    </div>
                  </div>
                )}
                {order.license_plate && (
                  <div style={styles.carrierItem}>
                    <span style={styles.carrierIcon}>🔢</span>
                    <div style={styles.carrierInfo}>
                      <span style={styles.carrierLabel}>Placa</span>
                      <span style={styles.carrierValue}>{order.license_plate}</span>
                    </div>
                  </div>
                )}
                {order.carrier_phone && (
                  <div style={styles.carrierItem}>
                    <span style={styles.carrierIcon}>📞</span>
                    <div style={styles.carrierInfo}>
                      <span style={styles.carrierLabel}>Contacto</span>
                      <span style={styles.carrierValue}>{order.carrier_phone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Historial de estados */}
          <div style={styles.historySection}>
            <h3 style={styles.historyTitle}>Historial de Estados</h3>

            {statusHistory.length > 0 ? (
              <div style={styles.historyTimeline}>
                {statusHistory.map((item, index) => (
                  <div key={index} style={styles.historyItem}>
                    <div style={styles.historyDate}>
                      <div style={styles.historyDay}>
                        {new Date(item.timestamp).toLocaleDateString("es-ES", { day: "numeric" })}
                      </div>
                      <div style={styles.historyMonth}>
                        {new Date(item.timestamp).toLocaleDateString("es-ES", { month: "short" })}
                      </div>
                      <div style={styles.historyTime}>
                        {new Date(item.timestamp).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div style={styles.historyConnector}>
                      <div style={styles.historyLine}></div>
                      <div
                        style={{
                          ...styles.historyDot,
                          ...getStatusColor(item.status),
                        }}
                      ></div>
                      <div style={styles.historyLine}></div>
                    </div>
                    <div style={styles.historyContent}>
                      <div style={styles.historyStatus}>
                        <span
                          style={{
                            ...styles.historyStatusBadge,
                            ...getStatusColor(item.status),
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div style={styles.historyDescription}>
                        {item.description || getDefaultDescription(item.status)}
                      </div>
                      {item.location && (
                        <div style={styles.historyLocation}>
                          <span style={styles.historyLocationIcon}>📍</span>
                          {item.location}
                        </div>
                      )}
                      {item.notes && <div style={styles.historyNotes}>{item.notes}</div>}
                      {item.user && (
                        <div style={styles.historyUser}>
                          <span style={styles.historyUserIcon}>👤</span>
                          Actualizado por: {item.user}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noHistoryMessage}>
                <p>No hay historial de estados disponible para esta orden.</p>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div style={styles.actionsContainer}>
            <button onClick={() => navigate(`/tracking/${order.tracking_code}`)} style={styles.trackingButton}>
              Ver Seguimiento Público
            </button>
            <button onClick={() => window.print()} style={styles.printButton}>
              Imprimir Detalles
            </button>
            {order.status?.toLowerCase() !== "entregado" && order.status?.toLowerCase() !== "cancelado" && (
              <button onClick={() => navigate(`/orders/${order.id}/edit`)} style={styles.editButton}>
                Editar Orden
              </button>
            )}
          </div>
        </div>
      ) : trackingCode ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔍</div>
          <p style={styles.emptyText}>No se encontró la orden con el código de seguimiento proporcionado.</p>
          <p style={styles.emptySubtext}>Verifique el código e intente nuevamente.</p>
        </div>
      ) : (
        <div style={styles.instructionsContainer}>
          <div style={styles.instructionsIcon}>🔎</div>
          <h3 style={styles.instructionsTitle}>Consulta el historial de tu envío</h3>
          <p style={styles.instructionsText}>
            Ingresa el código de seguimiento de tu orden en el campo de búsqueda para ver todos los detalles y el
            historial completo de estados.
          </p>
          <div style={styles.exampleContainer}>
            <span style={styles.exampleLabel}>Ejemplo de código:</span>
            <span style={styles.exampleCode}>1IZTQHK9GZ</span>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

// Función para obtener una descripción predeterminada basada en el estado
const getDefaultDescription = (status) => {
  switch (status?.toLowerCase()) {
    case "pendiente":
      return "La orden ha sido registrada y está en espera de ser procesada."
    case "asignado":
      return "La orden ha sido asignada a un transportista y está lista para ser recogida."
    case "en tránsito":
      return "La orden está en camino hacia el destino."
    case "entregado":
      return "La orden ha sido entregada exitosamente en el destino."
    case "cancelado":
      return "La orden ha sido cancelada."
    default:
      return "Estado actualizado."
  }
}

// Estilos
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
  searchContainer: {
    marginBottom: "24px",
  },
  searchForm: {
    display: "flex",
    gap: "12px",
    maxWidth: "600px",
    margin: "0 auto",
  },
  searchInput: {
    flex: 1,
    padding: "12px 16px",
    fontSize: "16px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    outline: "none",
  },
  searchButton: {
    backgroundColor: "#003c82",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "12px 24px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  instructionsContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    padding: "30px",
    textAlign: "center",
    maxWidth: "600px",
    margin: "0 auto",
  },
  instructionsIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  instructionsTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#003c82",
    marginBottom: "16px",
  },
  instructionsText: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  exampleContainer: {
    backgroundColor: "#f8fafc",
    padding: "12px",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  exampleLabel: {
    fontSize: "14px",
    color: "#666",
  },
  exampleCode: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#003c82",
    fontFamily: "monospace",
  },
  backButtonLarge: {
    backgroundColor: "#003c82",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "10px 20px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
    marginTop: "20px",
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
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 0",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    textAlign: "center",
  },
  errorIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  errorText: {
    fontSize: "18px",
    color: "#e53935",
    marginBottom: "8px",
    fontWeight: "bold",
  },
  errorSubtext: {
    fontSize: "16px",
    color: "#666",
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
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "18px",
    color: "#666",
    marginBottom: "8px",
  },
  emptySubtext: {
    fontSize: "16px",
    color: "#999",
    marginBottom: "20px",
  },
  orderContainer: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #eaeaea",
    backgroundColor: "#f8fafc",
    flexWrap: "wrap",
    gap: "16px",
  },
  orderInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  orderIdContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  orderIdLabel: {
    fontSize: "16px",
    color: "#666",
    fontWeight: "bold",
  },
  orderId: {
    fontSize: "18px",
    color: "#333",
    fontWeight: "bold",
  },
  trackingCodeContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  trackingCodeLabel: {
    fontSize: "14px",
    color: "#666",
  },
  trackingCode: {
    fontSize: "14px",
    color: "#003c82",
    fontWeight: "bold",
  },
  dateContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dateLabel: {
    fontSize: "14px",
    color: "#666",
  },
  dateValue: {
    fontSize: "14px",
    color: "#333",
  },
  statusContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
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
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    padding: "20px",
    borderBottom: "1px solid #eaeaea",
  },
  detailsSection: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#003c82",
    padding: "12px 16px",
    margin: 0,
    borderBottom: "1px solid #eaeaea",
    backgroundColor: "#f0f4f8",
  },
  detailsContent: {
    padding: "16px",
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  detailIcon: {
    fontSize: "20px",
    width: "24px",
    textAlign: "center",
  },
  detailInfo: {
    display: "flex",
    flexDirection: "column",
  },
  detailLabel: {
    fontSize: "12px",
    color: "#666",
  },
  detailValue: {
    fontSize: "14px",
    color: "#333",
    fontWeight: "500",
  },
  addressesSection: {
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    gap: "16px",
    borderBottom: "1px solid #eaeaea",

    "@media (min-width: 768px)": {
      flexDirection: "row",
      alignItems: "center",
    },
  },
  addressBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    overflow: "hidden",
  },
  addressTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#003c82",
    padding: "12px 16px",
    margin: 0,
    borderBottom: "1px solid #eaeaea",
    backgroundColor: "#f0f4f8",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  addressIcon: {
    fontSize: "16px",
  },
  addressContent: {
    padding: "16px",
  },
  addressLocation: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "8px",
  },
  addressDetail: {
    fontSize: "14px",
    color: "#666",
    lineHeight: "1.4",
  },
  addressDivider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 16px",
  },
  dividerLine: {
    height: "1px",
    backgroundColor: "#ddd",
    flex: 1,
  },
  dividerIcon: {
    margin: "0 12px",
    fontSize: "20px",
  },
  carrierSection: {
    padding: "20px",
    borderBottom: "1px solid #eaeaea",
  },
  carrierContent: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "16px",
    marginTop: "12px",
  },
  carrierItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  carrierIcon: {
    fontSize: "20px",
    width: "24px",
    textAlign: "center",
  },
  carrierInfo: {
    display: "flex",
    flexDirection: "column",
  },
  carrierLabel: {
    fontSize: "12px",
    color: "#666",
  },
  carrierValue: {
    fontSize: "14px",
    color: "#333",
    fontWeight: "500",
  },
  historySection: {
    padding: "20px",
    borderBottom: "1px solid #eaeaea",
  },
  historyTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#003c82",
    marginBottom: "20px",
  },
  historyTimeline: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  historyItem: {
    display: "flex",
    padding: "16px 0",
  },
  historyDate: {
    width: "80px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  historyDay: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
  },
  historyMonth: {
    fontSize: "14px",
    color: "#666",
    textTransform: "uppercase",
  },
  historyTime: {
    fontSize: "12px",
    color: "#666",
    marginTop: "4px",
  },
  historyConnector: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "30px",
    margin: "0 16px",
  },
  historyLine: {
    width: "2px",
    backgroundColor: "#ddd",
    flex: 1,
  },
  historyDot: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    backgroundColor: "#003c82",
    margin: "8px 0",
  },
  historyContent: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "16px",
  },
  historyStatus: {
    marginBottom: "8px",
  },
  historyStatusBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "12px",
    textAlign: "center",
  },
  historyDescription: {
    fontSize: "14px",
    color: "#333",
    marginBottom: "8px",
  },
  historyLocation: {
    fontSize: "13px",
    color: "#666",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginBottom: "8px",
  },
  historyLocationIcon: {
    fontSize: "14px",
  },
  historyNotes: {
    fontSize: "13px",
    color: "#666",
    fontStyle: "italic",
    backgroundColor: "#f0f0f0",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "8px",
  },
  historyUser: {
    fontSize: "12px",
    color: "#666",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  historyUserIcon: {
    fontSize: "14px",
  },
  noHistoryMessage: {
    padding: "30px 0",
    textAlign: "center",
    color: "#666",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
  },
  actionsContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    padding: "20px",
    flexWrap: "wrap",
  },
  trackingButton: {
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
  printButton: {
    backgroundColor: "#f5f5f5",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "10px 20px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  editButton: {
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
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
}

export default OrderHistoryView

