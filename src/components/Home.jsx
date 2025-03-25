import React, { useContext } from "react";
import MainLayout from "./MainLayout";
import { AuthContext } from "../context/AuthContext";

const Home = () => {
    const { user } = useContext(AuthContext);

    return (
        <MainLayout>
            <h1 style={styles.title}>Bienvenido, {user?.username} 👋</h1>
            <p style={styles.subtitle}>Este es tu dashboard. Aquí puedes gestionar tus órdenes.</p>
        </MainLayout>
    );
};

// Estilos para el contenido de Home
const styles = {
    title: {
        fontSize: "28px",
        fontWeight: "bold",
        color: "#333",
    },
    subtitle: {
        fontSize: "18px",
        color: "#666",
    },
};

export default Home;