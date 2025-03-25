"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../utils/Api";
import MainLayout from "../MainLayout";
import { AuthContext } from "../../context/AuthContext";

const OrderDetail = () => {
  const { orderId } = useParams(); // Obtener el ID de la orden desde la URL
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    routeId: "",
    carrierId: "",
  });
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");
  const [routeDetails, setRouteDetails] = useState(null);
  const [carrierDetails, setCarrierDetails] = useState(null);

  // Función para obtener los detalles de la orden
  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/orders/${orderId}`);
      setOrder(response.data.order);

      // Si la orden tiene ruta y transportista asignados, obtener sus detalles
      if (response.data.order.route_id) {
        fetchRouteDetails(response.data.order.route_id);
      }

      if (response.data.order.carrier_id) {
        fetchCarrierDetails(response.data.order.carrier_id);
      }
    } catch (error) {
      console.error("Error al obtener los detalles de la orden:", error);
      alert("No se pudieron cargar los detalles de la orden.");
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener detalles de la ruta
  const fetchRouteDetails = async (routeId) => {
    try {
      const response = await api.get(`/api/list-routes/${routeId}`);
      console.log(response.data.route);
      setRouteDetails(response.data.route);
    } catch (error) {
      console.error("Error al obtener detalles de la ruta:", error);
    }
  };

  // Función para obtener detalles del transportista
  const fetchCarrierDetails = async (carrierId) => {
    try {
      const response = await api.get(`/api/list-carriers/${carrierId}`);
      setCarrierDetails(response.data.carrier);
    } catch (error) {
      console.error("Error al obtener detalles del transportista:", error);
    }
  };

  // Cargar los detalles de la orden al montar el componente
  useEffect(() => {
    if (user) {
      fetchOrderDetails();
    }
  }, [user, orderId]);

  // Función para determinar el color del estado
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "entregado":
        return styles.statusDelivered;
      case "en tránsito":
        return styles.statusInTransit;
      case "pendiente":
        return styles.statusPending;
      case "cancelado":
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  // Función para extraer ciudad y departamento de una dirección completa
  const extractCityAndDepartment = (fullAddress) => {
    if (!fullAddress) return "No disponible";

    // La dirección tiene formato: "Calle, número, Ciudad, Departamento, Colombia"
    const parts = fullAddress.split(",").map((part) => part.trim());

    // Si hay al menos 3 partes (dirección, ciudad, departamento, [país])
    if (parts.length >= 3) {
      // Extraer ciudad y departamento (normalmente los dos últimos antes de "Colombia")
      const departmentIndex =
        parts.findIndex((part) => part.toLowerCase() === "colombia") - 1;
      const cityIndex = departmentIndex - 1;

      if (departmentIndex > 0 && cityIndex >= 0) {
        return `${parts[cityIndex]}, ${parts[departmentIndex]}`;
      }

      // Si no encontramos "Colombia", asumimos que los dos últimos son ciudad y departamento
      if (parts.length >= 2) {
        return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
      }
    }

    return fullAddress; // Devolver la dirección completa si no podemos extraer
  };

  // Funciones para manejar la asignación de ruta
  const handleOpenAssignModal = async () => {
    setAssignmentData({
      routeId: "",
      carrierId: "",
    });
    setAssignError("");
    setAssignSuccess("");

    // Cargar rutas y transportistas
    await fetchRoutes();
    await fetchCarriers();

    setAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setAssignModalOpen(false);
  };

  const fetchRoutes = async () => {
    setLoadingRoutes(true);
    try {
      const response = await api.get("/api/list-routes");
      setRoutes(response.data.routes || []);
    } catch (error) {
      console.error("Error al obtener las rutas:", error);
      setAssignError("No se pudieron cargar las rutas disponibles.");
    } finally {
      setLoadingRoutes(false);
    }
  };

  const fetchCarriers = async () => {
    setLoadingCarriers(true);
    try {
      const response = await api.get("/api/list-carriers");
      setCarriers(response.data.carriers || []);
    } catch (error) {
      console.error("Error al obtener los transportistas:", error);
      setAssignError("No se pudieron cargar los transportistas disponibles.");
    } finally {
      setLoadingCarriers(false);
    }
  };

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData({
      ...assignmentData,
      [name]: value,
    });
  };

  const handleAssignOrder = async () => {
    if (!assignmentData.routeId || !assignmentData.carrierId) {
      setAssignError("Por favor, seleccione una ruta y un transportista.");
      return;
    }

    setAssignLoading(true);
    setAssignError("");
    setAssignSuccess("");

    try {
      const response = await api.post("/api/assign-manually", {
        orderId: orderId,
        routeId: Number.parseInt(assignmentData.routeId),
        carrierId: Number.parseInt(assignmentData.carrierId),
      });

      setAssignSuccess("Orden asignada exitosamente.");

      // Actualizar los detalles de la orden después de asignar
      setTimeout(() => {
        fetchOrderDetails();
        handleCloseAssignModal();
      }, 1000);
    } catch (error) {
      console.error("Error al asignar la orden:", error);
      setAssignError(
        error.response?.data?.message || "Error al asignar la orden."
      );
    } finally {
      setAssignLoading(false);
    }
  };

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

          {/* Sección de Ruta y Transportista */}
          <div style={styles.routeSection}>
            <div style={styles.routeHeader}>
              <div style={styles.routeTitle}>
                <span style={styles.routeIcon}>🚚</span>
                <span style={styles.routeTitleText}>Información de Envío</span>
              </div>
              {order.status?.toLowerCase() !== "en tránsito" && (
                <button
                  onClick={handleOpenAssignModal}
                  style={styles.assignButton}
                >
                  {order.route_id ? "Reasignar" : "Asignar Ruta"}
                </button>
              )}
            </div>

            {order.route_id && routeDetails ? (
              <div style={styles.routeInfo}>
                <div style={styles.routeDetails}>
                  <h4 style={styles.routeSubtitle}>Ruta Asignada</h4>
                  <div style={styles.routeCard}>
                    <div style={styles.routeCardHeader}>
                      <span style={styles.routeName}>
                        {routeDetails.name || `Ruta #${routeDetails.id}`}
                      </span>
                    </div>
                    <div style={styles.routeCardBody}>
                      <div style={styles.routeItem}>
                        <span style={styles.routeItemIcon}>🏠</span>
                        <div style={styles.routeItemContent}>
                          <span style={styles.routeItemLabel}>Origen:</span>
                          <span style={styles.routeItemValue}>
                            {routeDetails.origin}
                          </span>
                        </div>
                      </div>
                      <div style={styles.routeItem}>
                        <span style={styles.routeItemIcon}>📍</span>
                        <div style={styles.routeItemContent}>
                          <span style={styles.routeItemLabel}>Destino:</span>
                          <span style={styles.routeItemValue}>
                            {routeDetails.destination}
                          </span>
                        </div>
                      </div>
                      <div style={styles.routeItem}>
                        <span style={styles.routeItemIcon}>📏</span>
                        <div style={styles.routeItemContent}>
                          <span style={styles.routeItemLabel}>Distancia:</span>
                          <span style={styles.routeItemValue}>
                            {routeDetails.distance} km
                          </span>
                        </div>
                      </div>
                      <div style={styles.routeItem}>
                        <span style={styles.routeItemIcon}>⏱️</span>
                        <div style={styles.routeItemContent}>
                          <span style={styles.routeItemLabel}>
                            Tiempo estimado:
                          </span>
                          <span style={styles.routeItemValue}>
                            {routeDetails.estimated_time} horas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {order.carrier_id && carrierDetails && (
                  <div style={styles.carrierDetails}>
                    <h4 style={styles.routeSubtitle}>Transportista Asignado</h4>
                    <div style={styles.carrierCard}>
                      <div style={styles.carrierCardHeader}>
                        <span style={styles.carrierName}>
                          {carrierDetails.name}
                        </span>
                      </div>
                      <div style={styles.carrierCardBody}>
                        <div style={styles.carrierItem}>
                          <span style={styles.carrierItemIcon}>🚚</span>
                          <div style={styles.carrierItemContent}>
                            <span style={styles.carrierItemLabel}>
                              Vehículo:
                            </span>
                            <span style={styles.carrierItemValue}>
                              {carrierDetails.vehicle_type} -{" "}
                              {carrierDetails.vehicle_model}
                            </span>
                          </div>
                        </div>
                        <div style={styles.carrierItem}>
                          <span style={styles.carrierItemIcon}>⚖️</span>
                          <div style={styles.carrierItemContent}>
                            <span style={styles.carrierItemLabel}>
                              Capacidad:
                            </span>
                            <span style={styles.carrierItemValue}>
                              {carrierDetails.capacity} kg
                            </span>
                          </div>
                        </div>
                        <div style={styles.carrierItem}>
                          <span style={styles.carrierItemIcon}>📍</span>
                          <div style={styles.carrierItemContent}>
                            <span style={styles.carrierItemLabel}>
                              Ubicación actual:
                            </span>
                            <span style={styles.carrierItemValue}>
                              {carrierDetails.current_city}
                            </span>
                          </div>
                        </div>
                        <div style={styles.carrierItem}>
                          <span style={styles.carrierItemIcon}>📱</span>
                          <div style={styles.carrierItemContent}>
                            <span style={styles.carrierItemLabel}>
                              Contacto:
                            </span>
                            <span style={styles.carrierItemValue}>
                              {carrierDetails.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.noRouteAssigned}>
                <div style={styles.noRouteIcon}>🚫</div>
                <p style={styles.noRouteText}>
                  Esta orden aún no tiene ruta ni transportista asignados.
                </p>
                {order.status?.toLowerCase() !== "en tránsito" && (
                  <button
                    onClick={handleOpenAssignModal}
                    style={styles.assignButtonLarge}
                  >
                    Asignar Ruta y Transportista
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={styles.detailsGrid}>
            <div style={styles.detailsSection}>
              <h3 style={styles.sectionTitle}>Información del Paquete</h3>
              <div style={styles.detailsContent}>
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>⚖️</span>
                  <div style={styles.detailInfo}>
                    <span style={styles.detailLabel}>Peso</span>
                    <span style={styles.detailValue}>
                      {order.package_weight} kg
                    </span>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>📏</span>
                  <div style={styles.detailInfo}>
                    <span style={styles.detailLabel}>Dimensiones</span>
                    <span style={styles.detailValue}>
                      {order.package_dimensions}
                    </span>
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
                    <span style={styles.detailValue}>
                      {order.recipient_name}
                    </span>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailIcon}>📞</span>
                  <div style={styles.detailInfo}>
                    <span style={styles.detailLabel}>Teléfono</span>
                    <span style={styles.detailValue}>
                      {order.recipient_phone}
                    </span>
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
                <div style={styles.addressLocation}>
                  {extractCityAndDepartment(order.origin_address)}
                </div>
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
                <div style={styles.addressLocation}>
                  {extractCityAndDepartment(order.destination_address)}
                </div>
                <div style={styles.addressDetail}>
                  {order.destination_address}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.actionsContainer}>
            <button
              style={styles.editButton}
              onClick={() => alert(`Editar orden ${orderId}`)}
            >
              Editar Orden
            </button>
            <button
              style={styles.deleteButton}
              onClick={() => alert(`Eliminar orden ${orderId}`)}
            >
              Eliminar Orden
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔍</div>
          <p style={styles.emptyText}>
            No se encontraron detalles para esta orden.
          </p>
          <button
            onClick={() => navigate("/orders")}
            style={styles.backButtonEmpty}
          >
            Volver a la lista de órdenes
          </button>
        </div>
      )}

      {/* Modal para asignar ruta y transportista */}
      {assignModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Asignar Ruta y Transportista</h3>
              <button
                onClick={handleCloseAssignModal}
                style={styles.modalCloseButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.orderInfo}>
                <p style={styles.orderInfoText}>
                  <strong>Orden:</strong> #{orderId}
                </p>
                <p style={styles.orderInfoText}>
                  <strong>Origen:</strong>{" "}
                  {order && extractCityAndDepartment(order.origin_address)}
                </p>
                <p style={styles.orderInfoText}>
                  <strong>Destino:</strong>{" "}
                  {order && extractCityAndDepartment(order.destination_address)}
                </p>
                <p style={styles.orderInfoText}>
                  <strong>Peso:</strong> {order && order.package_weight} kg
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
                          {route.name ||
                            `${route.origin} → ${route.destination}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      Seleccionar Transportista:
                    </label>
                    <select
                      name="carrierId"
                      value={assignmentData.carrierId}
                      onChange={handleAssignmentChange}
                      style={styles.formSelect}
                    >
                      <option value="">Seleccione un transportista</option>
                      {carriers.map((carrier) => (
                        <option key={carrier.id} value={carrier.id}>
                          {carrier.name} - {carrier.vehicle_type} (
                          {carrier.capacity} kg)
                        </option>
                      ))}
                    </select>
                  </div>

                  {assignError && (
                    <div style={styles.errorMessage}>{assignError}</div>
                  )}

                  {assignSuccess && (
                    <div style={styles.successMessage}>{assignSuccess}</div>
                  )}
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={handleCloseAssignModal}
                style={styles.cancelButton}
                disabled={assignLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignOrder}
                style={styles.assignButtonModal}
                disabled={
                  assignLoading ||
                  !assignmentData.routeId ||
                  !assignmentData.carrierId
                }
              >
                {assignLoading ? "Asignando..." : "Asignar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

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
  // Estilos para la sección de ruta y transportista
  routeSection: {
    padding: "20px",
    borderBottom: "1px solid #eaeaea",
  },
  routeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  routeTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  routeIcon: {
    fontSize: "20px",
  },
  routeTitleText: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#333",
  },
  assignButton: {
    backgroundColor: "#003c82",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
  },
  routeInfo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  routeDetails: {
    flex: 1,
  },
  carrierDetails: {
    flex: 1,
  },
  routeSubtitle: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#003c82",
    marginBottom: "12px",
    marginTop: "0",
  },
  routeCard: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #eaeaea",
  },
  routeCardHeader: {
    backgroundColor: "#f0f4f8",
    padding: "12px 16px",
    borderBottom: "1px solid #eaeaea",
  },
  routeName: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
  },
  routeCardBody: {
    padding: "16px",
  },
  routeItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  routeItemIcon: {
    fontSize: "16px",
    width: "20px",
    textAlign: "center",
  },
  routeItemContent: {
    display: "flex",
    flexDirection: "column",
  },
  routeItemLabel: {
    fontSize: "12px",
    color: "#666",
  },
  routeItemValue: {
    fontSize: "14px",
    color: "#333",
    fontWeight: "500",
  },
  carrierCard: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #eaeaea",
  },
  carrierCardHeader: {
    backgroundColor: "#f0f4f8",
    padding: "12px 16px",
    borderBottom: "1px solid #eaeaea",
  },
  carrierName: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
  },
  carrierCardBody: {
    padding: "16px",
  },
  carrierItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  carrierItemIcon: {
    fontSize: "16px",
    width: "20px",
    textAlign: "center",
  },
  carrierItemContent: {
    display: "flex",
    flexDirection: "column",
  },
  carrierItemLabel: {
    fontSize: "12px",
    color: "#666",
  },
  carrierItemValue: {
    fontSize: "14px",
    color: "#333",
    fontWeight: "500",
  },
  noRouteAssigned: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px dashed #ccc",
  },
  noRouteIcon: {
    fontSize: "32px",
    marginBottom: "16px",
  },
  noRouteText: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "20px",
    textAlign: "center",
  },
  assignButtonLarge: {
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
  assignButtonModal: {
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
};

export default OrderDetail;
