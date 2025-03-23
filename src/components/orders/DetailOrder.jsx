"use client"

import { useState, useEffect, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../../utils/Api"
import MainLayout from "../MainLayout"
import { AuthContext } from "../../context/AuthContext"

const OrderDetail = () => {
  const { orderId } = useParams() // Obtener el ID de la orden desde la URL
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  // Función para obtener los detalles de la orden
  const fetchOrderDetails = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/api/orders/${orderId}`)
      setOrder(response.data.order)
    } catch (error) {
      console.error("Error al obtener los detalles de la orden:", error)
      alert("No se pudieron cargar los detalles de la orden.")
    } finally {
      setLoading(false)
    }
  }

  // Cargar los detalles de la orden al montar el componente
  useEffect(() => {
    if (user) {
      fetchOrderDetails()
    }
  }, [user, orderId])

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

  return (
    <MainLayout>
      <div style={styles.header}>
        <h2 style={styles.title}>Detalles de la Orden</h2>
        <button onClick={() => navigate("/orders")} style={styles.backButton}>
          ← Volver a la lista
        </button>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Cargando detalles de la orden...</p>
        </div>
      ) : order ? (
        <div style={styles.container}>
          <div style={styles.orderHeader}>
            <div style={styles.orderIdContainer}>
              <span style={styles.orderIdLabel}>Orden #</span>
              <span style={styles.orderId}>{orderId}</span>
            </div>
            <div style={styles.statusContainer}>
              <span style={styles.statusLabel}>Estado:</span>
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

          <div style={styles.trackingSection}>
            <div style={styles.trackingHeader}>
              <span style={styles.trackingIcon}>📦</span>
              <span style={styles.trackingTitle}>Seguimiento</span>
            </div>
            <div style={styles.trackingCode}>
              <span style={styles.trackingLabel}>Código de seguimiento:</span>
              <span style={styles.trackingValue}>{order.tracking_code}</span>
            </div>
            <div style={styles.trackingDate}>
              <span style={styles.dateLabel}>Fecha de creación:</span>
              <span style={styles.dateValue}>
                {new Date(order.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div style={styles.detailsGrid}>
            <div style={styles.detailsSection}>
              <h3 style={styles.sectionTitle}>Información del Paquete</h3>
              <div style={styles.detailsContent}>
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
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>📦</span>
                  <div style={styles.detailInfo}>
                    <span style={styles.detailLabel}>Tipo</span>
                    <span style={styles.detailValue}>{order.package_type}</span>
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

          <div style={styles.actionsContainer}>
            <button style={styles.editButton} onClick={() => alert(`Editar orden ${orderId}`)}>
              Editar Orden
            </button>
            <button style={styles.deleteButton} onClick={() => alert(`Eliminar orden ${orderId}`)}>
              Eliminar Orden
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔍</div>
          <p style={styles.emptyText}>No se encontraron detalles para esta orden.</p>
          <button onClick={() => navigate("/orders")} style={styles.backButtonEmpty}>
            Volver a la lista de órdenes
          </button>
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
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #eaeaea",
    backgroundColor: "#f8fafc",
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
  statusContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
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
  trackingSection: {
    padding: "20px",
    borderBottom: "1px solid #eaeaea",
  },
  trackingHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  trackingIcon: {
    fontSize: "20px",
  },
  trackingTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
  },
  trackingCode: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  trackingLabel: {
    fontSize: "14px",
    color: "#666",
    minWidth: "160px",
  },
  trackingValue: {
    fontSize: "16px",
    color: "#333",
    fontWeight: "bold",
  },
  trackingDate: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dateLabel: {
    fontSize: "14px",
    color: "#666",
    minWidth: "160px",
  },
  dateValue: {
    fontSize: "14px",
    color: "#333",
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
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
}

export default OrderDetail

