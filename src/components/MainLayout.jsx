import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaBars, FaBox, FaSignOutAlt } from "react-icons/fa";

const MainLayout = ({ children }) => {
    const navigate = useNavigate();
    const { user, logout } = useContext(AuthContext);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div style={styles.container}>
            {/* Sidebar con opción de colapsar */}
            <div style={{ ...styles.sidebar, width: isCollapsed ? "40px" : "200px" }}>
                <button onClick={() => setIsCollapsed(!isCollapsed)} style={styles.toggleButton}>
                    <FaBars />
                </button>

                <ul style={styles.navList}>
                {/* <li style={styles.navItem} onClick={() => navigate("/orders")}>
                        <FaBox />
                        {!isCollapsed && "Transportistas"}
                    </li> */}
                    <li style={styles.navItem} onClick={() => navigate("/orders")}>
                        <FaBox />
                        {!isCollapsed && "Órdenes"}
                    </li>
                    <li style={styles.navItemLogout} onClick={handleLogout}>
                        <FaSignOutAlt />
                        {!isCollapsed && "Cerrar Sesión"}
                    </li>
                </ul>
            </div>

            {/* Área de contenido */}
            <div style={styles.content}>
                {children}
            </div>
        </div>
    );
};


const styles = {
    container: {
        display: "flex",
        height: "100vh",
        backgroundColor: "#f4f4f4",
        overflow: "hidden",
    },
    sidebar: {
        backgroundColor: "#003c82",
        color: "#fff",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "4px 0 10px rgba(0, 0, 0, 0.1)",
        transition: "width 0.3s ease-in-out",
        overflow: "hidden",
    },
    toggleButton: {
        backgroundColor: "transparent",
        border: "none",
        color: "#fff",
        fontSize: "20px",
        cursor: "pointer",
        marginBottom: "20px",
    },
    navList: {
        listStyle: "none",
        padding: 0,
        width: "100%",
    },
    navItem: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px",
        cursor: "pointer",
        fontSize: "18px",
        borderRadius: "5px",
        transition: "background 0.3s",
    },
    navItemLogout: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "12px",
        cursor: "pointer",
        fontSize: "18px",
        color: "#ff4d4d",
        borderRadius: "5px",
        transition: "background 0.3s",
    },
    content: {
        flex: 1,
        padding: "20px",
        overflow: "auto",
    },
};

export default MainLayout;