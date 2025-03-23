import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/Api";

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const { user } = useContext(AuthContext);

    // Función para obtener las órdenes
    const fetchOrders = async () => {
        try {
            const response = await api.get("/api/orders");
            setOrders(response.data.orders);
        } catch (error) {
            console.error("Error al obtener las órdenes:", error);
            alert("No se pudieron cargar las órdenes.");
        }
    };

    // Cargar las órdenes al montar el componente
    useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    return (
        <div style={styles.container}>
            {/* Encabezado del Dashboard */}
            <div style={styles.header}>
                <h1 style={styles.title}>Bienvenido, {user?.name || "Usuario"} 👋</h1>
                <p style={styles.subtitle}>Este es tu dashboard. Aquí puedes gestionar tus órdenes.</p>
            </div>

            {/* Tabla de Órdenes */}
            <div style={styles.tableContainer}>
                {orders.length > 0 ? (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Estado</th>
                                <th style={styles.th}>Código de Seguimiento</th>
                                <th style={styles.th}>Dirección de Destino</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td style={styles.td}>{order.id}</td>
                                    <td style={styles.td}>{order.status}</td>
                                    <td style={styles.td}>{order.tracking_code}</td>
                                    <td style={styles.td}>{order.destination_address}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p style={styles.noOrders}>No hay órdenes disponibles.</p>
                )}
            </div>
        </div>
    );
};

// Estilos ajustados
const styles = {
    container: {
        flex: "1 1 0%",
        padding: "40px",
    },
    header: {
        marginBottom: "20px",
    },
    title: {
        fontSize: "28px",
        fontWeight: "bold",
        color: "#333",
    },
    subtitle: {
        fontSize: "18px",
        color: "#666",
    },
    tableContainer: {
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        overflowX: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    th: {
        backgroundColor: "#007bff",
        color: "#fff",
        padding: "10px",
        textAlign: "left",
    },
    td: {
        padding: "10px",
        borderBottom: "1px solid #ddd",
    },
    noOrders: {
        textAlign: "center",
        color: "#777",
        marginTop: "20px",
    },
};

export default OrderList;
