"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import api from "../utils/Api"

const Register = () => {
  // Añadir confirmPassword al estado inicial
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState("")
  const [registerSuccess, setRegisterSuccess] = useState(false)

  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Limpiar errores al editar
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      })
    }
  }

  // Actualizar la función de validación para incluir confirmPassword
  const validateForm = () => {
    const newErrors = {}

    // Validar username
    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido"
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // La función handleSubmit sigue enviando solo username y password
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar formulario
    if (!validateForm()) return

    setIsSubmitting(true)
    setServerError("")

    try {
      // Preparar datos para enviar al servidor (solo username y password)
      const userData = {
        username: formData.username,
        password: formData.password,
      }

      // Enviar solicitud al endpoint de registro
      await api.post("/api/auth/register", userData)

      // Registro exitoso
      setRegisterSuccess(true)

      // Redireccionar después de 2 segundos
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (error) {
      console.error("Error al registrar usuario:", error)

      // Manejar errores del servidor
      if (error.response) {
        // El servidor respondió con un código de error
        setServerError(error.response.data?.message || "Error al registrar usuario. Inténtelo de nuevo.")
      } else if (error.request) {
        // La solicitud fue hecha pero no se recibió respuesta
        setServerError("No se pudo conectar con el servidor. Verifique su conexión a internet.")
      } else {
        // Error al configurar la solicitud
        setServerError("Error al procesar su solicitud. Inténtelo de nuevo.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
         {/* Imagen corporativa */}
         <img src="/logo-coordinadora.svg" alt="Logo Corporativo"/>
        <h2 style={styles.title}>Crear Cuenta</h2>
        <p style={styles.subtitle}>Ingrese un nombre de usuario y contraseña para registrarse</p>

        {registerSuccess ? (
          <div style={styles.successMessage}>
            <div style={styles.successIcon}>✓</div>
            <p style={styles.successText}>¡Registro exitoso! Redirigiendo al inicio de sesión...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nombre de usuario</label>
              <input
                type="text"
                name="username"
                placeholder="Ingrese su nombre de usuario"
                value={formData.username}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.username ? styles.inputError : {}),
                }}
              />
              {errors.username && <div style={styles.errorText}>{errors.username}</div>}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Contraseña</label>
              <input
                type="password"
                name="password"
                placeholder="Ingrese su contraseña"
                value={formData.password}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.password ? styles.inputError : {}),
                }}
              />
              {errors.password && <div style={styles.errorText}>{errors.password}</div>}
            </div>

            {/* Añadir campo de confirmación de contraseña */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirmar contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirme su contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(errors.confirmPassword ? styles.inputError : {}),
                }}
              />
              {errors.confirmPassword && <div style={styles.errorText}>{errors.confirmPassword}</div>}
            </div>

            {serverError && <div style={styles.serverError}>{serverError}</div>}

            <button type="submit" style={styles.button} disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrarse"}
            </button>
          </form>
        )}

        <div style={styles.footer}>
          <p>
            ¿Ya tiene una cuenta?{" "}
            <Link to="/login" style={styles.link}>
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

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
    width: "420px",
    padding: "30px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0, 60, 130, 0.1)",
    textAlign: "center",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  logo: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "#003c82",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(0, 60, 130, 0.3)",
  },
  logoText: {
    color: "white",
    fontSize: "28px",
    fontWeight: "bold",
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
  inputError: {
    borderColor: "#e53935",
    backgroundColor: "#fff8f8",
  },
  errorText: {
    color: "#e53935",
    fontSize: "12px",
    marginTop: "6px",
  },
  serverError: {
    backgroundColor: "#ffe6e6",
    color: "#b30000",
    padding: "12px",
    borderRadius: "6px",
    fontSize: "14px",
    marginBottom: "20px",
    textAlign: "center",
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
  successMessage: {
    backgroundColor: "#e6f7ee",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: "#0d6832",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    marginBottom: "15px",
  },
  successText: {
    color: "#0d6832",
    fontSize: "16px",
    fontWeight: "bold",
  },
}

export default Register