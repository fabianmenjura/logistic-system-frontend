"use client"

import { useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../utils/Api"
import MainLayout from "../MainLayout"
import { AuthContext } from "../../context/AuthContext"

const CreateOrder = () => {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  // Estado para los datos de Colombia
  const [colombiaData, setColombiaData] = useState([])
  const [loading, setLoading] = useState(true)
  const [dataError, setDataError] = useState(false)

  // Estado para los campos del formulario
  const [formData, setFormData] = useState({
    packageWeight: "",
    packageDimensions: "",
    packageType: "",
    originAddress: "",
    originDepartamento: "",
    originCiudad: "",
    destinationAddress: "",
    destinationDepartamento: "",
    destinationCiudad: "",
    recipientName: "",
    recipientPhone: "",
  })

  // Estado para las ciudades disponibles según el departamento seleccionado
  const [originCiudades, setOriginCiudades] = useState([])
  const [destinationCiudades, setDestinationCiudades] = useState([])

  // Estado para errores de validación
  const [errors, setErrors] = useState({
    originAddress: "",
    destinationAddress: "",
    recipientPhone: "",
  })

  // Cargar datos de Colombia
  useEffect(() => {
    const fetchColombiaData = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.min.json",
        )
        if (!response.ok) {
          throw new Error("Error al cargar datos")
        }
        const data = await response.json()
        setColombiaData(data)
        setDataError(false)
      } catch (error) {
        console.error("Error cargando datos de Colombia:", error)
        setDataError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchColombiaData()
  }, [])

  // Actualizar ciudades cuando cambia el departamento
  useEffect(() => {
    if (formData.originDepartamento && colombiaData.length > 0) {
      const departamento = colombiaData.find((d) => d.departamento === formData.originDepartamento)
      if (departamento) {
        setOriginCiudades(departamento.ciudades || [])
        // Resetear ciudad si cambia el departamento
        if (!departamento.ciudades.includes(formData.originCiudad)) {
          setFormData((prev) => ({ ...prev, originCiudad: "" }))
        }
      }
    }
  }, [formData.originDepartamento, colombiaData])

  useEffect(() => {
    if (formData.destinationDepartamento && colombiaData.length > 0) {
      const departamento = colombiaData.find((d) => d.departamento === formData.destinationDepartamento)
      if (departamento) {
        setDestinationCiudades(departamento.ciudades || [])
        // Resetear ciudad si cambia el departamento
        if (!departamento.ciudades.includes(formData.destinationCiudad)) {
          setFormData((prev) => ({ ...prev, destinationCiudad: "" }))
        }
      }
    }
  }, [formData.destinationDepartamento, colombiaData])

  // Manejar cambios en los campos del formulario
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

  // Validar dirección específica (calle, número, etc.)
  const validateSpecificAddress = (address, fieldName) => {
    // Verificar longitud mínima
    if (address.length < 5) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "La dirección debe tener al menos 5 caracteres",
      }))
      return false
    }

    // Verificar que contenga número
    if (!/\d/.test(address)) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: "La dirección debe incluir un número",
      }))
      return false
    }

    return true
  }

  // Validar teléfono
  const validatePhone = (phone) => {
    // Verificar que solo contenga números y algunos caracteres especiales permitidos
    if (!/^[0-9+\-\s()]*$/.test(phone)) {
      setErrors((prev) => ({
        ...prev,
        recipientPhone: "El teléfono solo debe contener números y caracteres + - ( )",
      }))
      return false
    }

    // Verificar longitud mínima (considerando posibles caracteres especiales)
    const digitsOnly = phone.replace(/[^0-9]/g, "")
    if (digitsOnly.length < 7) {
      setErrors((prev) => ({
        ...prev,
        recipientPhone: "El teléfono debe tener al menos 7 dígitos",
      }))
      return false
    }

    return true
  }

  // Construir direcciones completas
  const buildFullAddress = (specificAddress, ciudad, departamento) => {
    return `${specificAddress}, ${ciudad}, ${departamento}, Colombia`
  }

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Resetear errores
    setErrors({
      originAddress: "",
      destinationAddress: "",
      recipientPhone: "",
    })

    // Validar que se hayan seleccionado departamentos y ciudades
    if (!formData.originDepartamento || !formData.originCiudad) {
      setErrors((prev) => ({
        ...prev,
        originAddress: "Seleccione departamento y ciudad de origen",
      }))
      return
    }

    if (!formData.destinationDepartamento || !formData.destinationCiudad) {
      setErrors((prev) => ({
        ...prev,
        destinationAddress: "Seleccione departamento y ciudad de destino",
      }))
      return
    }

    // Validar direcciones específicas y teléfono
    const isOriginValid = validateSpecificAddress(formData.originAddress, "originAddress")
    const isDestinationValid = validateSpecificAddress(formData.destinationAddress, "destinationAddress")
    const isPhoneValid = validatePhone(formData.recipientPhone)

    // Si hay errores, detener el envío
    if (!isOriginValid || !isDestinationValid || !isPhoneValid) {
      return
    }

    // Construir direcciones completas
    const fullOriginAddress = buildFullAddress(
      formData.originAddress,
      formData.originCiudad,
      formData.originDepartamento,
    )

    const fullDestinationAddress = buildFullAddress(
      formData.destinationAddress,
      formData.destinationCiudad,
      formData.destinationDepartamento,
    )

    try {
      const response = await api.post("/api/orders", {
        packageWeight: formData.packageWeight,
        packageDimensions: formData.packageDimensions,
        packageType: formData.packageType,
        originAddress: fullOriginAddress,
        destinationAddress: fullDestinationAddress,
        recipientName: formData.recipientName,
        recipientPhone: formData.recipientPhone,
        userId: user.id,
      })
      alert("Orden creada exitosamente")
      navigate("/orders") // Redirigir a la lista de órdenes
    } catch (error) {
      console.error("Error al crear la orden:", error)
      alert("No se pudo crear la orden. Inténtalo de nuevo.")
    }
  }

  // Renderizar mensaje de carga o error
  if (loading) {
    return (
      <MainLayout>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Cargando datos de ubicaciones...</p>
        </div>
      </MainLayout>
    )
  }

  if (dataError) {
    return (
      <MainLayout>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>
            Error al cargar los datos de ubicaciones. Por favor, recargue la página o intente más tarde.
          </p>
          <button onClick={() => window.location.reload()} style={styles.retryButton}>
            Reintentar
          </button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div style={styles.container}>
        <h2 style={styles.title}>Crear Nueva Orden</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.sectionTitle}>Información del Paquete</div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Peso del paquete (kg):</label>
              <input
                type="number"
                name="packageWeight"
                value={formData.packageWeight}
                onChange={handleChange}
                style={styles.input}
                min="0.1"
                step="0.1"
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Dimensiones:</label>
              <input
                type="text"
                name="packageDimensions"
                value={formData.packageDimensions}
                onChange={handleChange}
                style={styles.input}
                placeholder="Ej: 30cm x 20cm x 15cm"
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tipo de paquete:</label>
            <select
              name="packageType"
              value={formData.packageType}
              onChange={handleChange}
              style={styles.select}
              required
            >
              <option value="">Seleccione un tipo</option>
              <option value="Documento">Documento</option>
              <option value="Paquete pequeño">Paquete pequeño</option>
              <option value="Paquete mediano">Paquete mediano</option>
              <option value="Paquete grande">Paquete grande</option>
              <option value="Frágil">Frágil</option>
            </select>
          </div>

          <div style={styles.sectionTitle}>Dirección de Origen</div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Departamento:</label>
              <select
                name="originDepartamento"
                value={formData.originDepartamento}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Seleccione departamento</option>
                {colombiaData.map((depto) => (
                  <option key={`origin-${depto.id}`} value={depto.departamento}>
                    {depto.departamento}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Ciudad:</label>
              <select
                name="originCiudad"
                value={formData.originCiudad}
                onChange={handleChange}
                style={styles.select}
                disabled={!formData.originDepartamento}
                required
              >
                <option value="">Seleccione ciudad</option>
                {originCiudades.map((ciudad, index) => (
                  <option key={`origin-city-${index}`} value={ciudad}>
                    {ciudad}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Dirección específica:</label>
            <input
              type="text"
              name="originAddress"
              value={formData.originAddress}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.originAddress ? styles.inputError : {}),
              }}
              placeholder="Calle, número, barrio, etc."
              required
            />
            {errors.originAddress && <div style={styles.errorMessage}>{errors.originAddress}</div>}
            <div style={styles.addressTip}>Ejemplo: Calle 123 #45-67, Barrio Los Pinos</div>
          </div>

          <div style={styles.sectionTitle}>Dirección de Destino</div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Departamento:</label>
              <select
                name="destinationDepartamento"
                value={formData.destinationDepartamento}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Seleccione departamento</option>
                {colombiaData.map((depto) => (
                  <option key={`dest-${depto.id}`} value={depto.departamento}>
                    {depto.departamento}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Ciudad:</label>
              <select
                name="destinationCiudad"
                value={formData.destinationCiudad}
                onChange={handleChange}
                style={styles.select}
                disabled={!formData.destinationDepartamento}
                required
              >
                <option value="">Seleccione ciudad</option>
                {destinationCiudades.map((ciudad, index) => (
                  <option key={`dest-city-${index}`} value={ciudad}>
                    {ciudad}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Dirección específica:</label>
            <input
              type="text"
              name="destinationAddress"
              value={formData.destinationAddress}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.destinationAddress ? styles.inputError : {}),
              }}
              placeholder="Calle, número, barrio, etc."
              required
            />
            {errors.destinationAddress && <div style={styles.errorMessage}>{errors.destinationAddress}</div>}
            <div style={styles.addressTip}>Ejemplo: Carrera 45 #67-89, Edificio Torre Alta, Apto 502</div>
          </div>

          <div style={styles.sectionTitle}>Información del Destinatario</div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre del destinatario:</label>
            <input
              type="text"
              name="recipientName"
              value={formData.recipientName}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Teléfono del destinatario:</label>
            <input
              type="text"
              name="recipientPhone"
              value={formData.recipientPhone}
              onChange={handleChange}
              style={{
                ...styles.input,
                ...(errors.recipientPhone ? styles.inputError : {}),
              }}
              placeholder="Ej: +57 300 123 4567"
              required
            />
            {errors.recipientPhone && <div style={styles.errorMessage}>{errors.recipientPhone}</div>}
          </div>
          <div style={styles.buttonContainer}>
            <button type="button" style={styles.cancelButton} onClick={() => navigate("/orders")}>
              Cancelar
            </button>
            <button type="submit" style={styles.submitButton}>
              Crear Orden
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}

// Estilos mejorados
const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    maxWidth: "800px",
    margin: "20px auto",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#003c82",
    marginBottom: "24px",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#003c82",
    marginTop: "20px",
    marginBottom: "15px",
    paddingBottom: "8px",
    borderBottom: "1px solid #e0e0e0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: "1",
    minWidth: "250px",
  },
  label: {
    fontSize: "15px",
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    padding: "12px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    outline: "none",
    transition: "all 0.2s",
  },
  inputError: {
    borderColor: "#e53935",
    backgroundColor: "#fff8f8",
  },
  select: {
    padding: "12px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    outline: "none",
    transition: "border-color 0.2s",
    backgroundColor: "#fff",
  },
  errorMessage: {
    color: "#e53935",
    fontSize: "13px",
    marginTop: "4px",
  },
  addressTip: {
    color: "#666",
    fontSize: "12px",
    fontStyle: "italic",
    marginTop: "4px",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginTop: "20px",
  },
  submitButton: {
    backgroundColor: "#00a86b",
    color: "white",
    border: "none",
    borderRadius: "4px",
    padding: "14px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
    flex: "1",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "14px",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background-color 0.2s",
    flex: "1",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "300px",
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
    height: "300px",
    padding: "20px",
    textAlign: "center",
  },
  errorText: {
    color: "#e53935",
    fontSize: "16px",
    marginBottom: "20px",
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
  },
  "@keyframes spin": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
}

export default CreateOrder

