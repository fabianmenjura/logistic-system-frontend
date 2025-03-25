"use client";

import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate("/home"); // Redirige al usuario a la página de inicio
    } catch (error) {
      alert(error.message || "Error al iniciar sesión");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
         {/* Imagen corporativa */}
         <img src="/logo-coordinadora.svg" alt="Logo Corporativo"/>
        <h2 style={styles.title}>Iniciar Sesión</h2>
        <p style={styles.subtitle}>Ingrese sus credenciales para continuar</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Usuario</label>
            <input
              type="text"
              placeholder="Ingrese su nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* <div style={styles.forgotPassword}>
            <a href="#" style={styles.link}>
              ¿Olvidó su contraseña?
            </a>
          </div> */}

          <button type="submit" style={styles.button}>
            Iniciar Sesión
          </button>
        </form>

        <div style={styles.footer}>
          <p>
            ¿No tiene una cuenta?{" "}
            <a href="/register" style={styles.link}>
              Regístrese
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Estilos mejorados
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "#f5f8fa",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "380px",
    padding: "30px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0, 60, 130, 0.1)",
    textAlign: "center",
  },
  title: {
    color: "#333333",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 0 10px 0",
  },
  subtitle: {
    color: "#666666",
    fontSize: "14px",
    marginBottom: "25px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  inputGroup: {
    marginBottom: "20px",
    textAlign: "left",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#555555",
  },
  input: {
    width: "100%",
    padding: "12px 15px",
    fontSize: "14px",
    border: "1px solid #e1e5e9",
    borderRadius: "6px",
    boxSizing: "border-box",
    transition: "border-color 0.3s, box-shadow 0.3s",
    outline: "none",
  },
  forgotPassword: {
    textAlign: "right",
    marginBottom: "20px",
  },
  button: {
    padding: "14px",
    fontSize: "16px",
    fontWeight: "bold",
    backgroundColor: "#003c82",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    boxShadow: "0 4px 6px rgba(0, 60, 130, 0.2)",
  },
  footer: {
    marginTop: "25px",
    fontSize: "14px",
    color: "#666666",
  },
  link: {
    color: "#003c82",
    textDecoration: "none",
    fontWeight: "bold",
  },
};

export default Login;
