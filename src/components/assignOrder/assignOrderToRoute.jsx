import React, { useState } from "react";
import axios from "axios";

const AssignOrderToRoute = () => {
  const [orderId, setOrderId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post("http://localhost:3000/api/assign-manually", {
        orderId,
        routeId,
        carrierId,
      });
      setMessage(response.data.message);
    } catch (error) {
      if (error.response) {
        setMessage(error.response.data.message || "Error al asignar la orden.");
      } else {
        setMessage("Error de red o servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Asignar Orden a Ruta</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="orderId" style={styles.label}>ID de la Orden</label>
          <input
            type="text"
            id="orderId"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="routeId" style={styles.label}>ID de la Ruta</label>
          <input
            type="text"
            id="routeId"
            value={routeId}
            onChange={(e) => setRouteId(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="carrierId" style={styles.label}>ID del Transportista</label>
          <input
            type="text"
            id="carrierId"
            value={carrierId}
            onChange={(e) => setCarrierId(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Asignando..." : "Asignar"}
        </button>
      </form>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "400px",
    margin: "0 auto",
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center",
    color: "#003c82",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "8px",
    fontSize: "14px",
    color: "#333",
  },
  input: {
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
  },
  button: {
    padding: "10px 16px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#003c82",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  message: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#333",
    textAlign: "center",
  },
};

export default AssignOrderToRoute;