import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response, // Devolver la respuesta si no hay errores
    (error) => {
        if (
            error.response?.status === 401 && // Código de error 401
            error.response?.data?.message === "Token inválido o expirado" // Mensaje del servidor
        ) {
            // Eliminar token y redirigir al login
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login"; // Redirigir al login
        }
        return Promise.reject(error); // Pasar el error a los manejadores posteriores
    }
);

export default api;