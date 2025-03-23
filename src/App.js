import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import OrderList from "./components/orders/OrderList";
import CreateOrder from "./components/orders/CreateOrder";

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/orders" element={<OrderList />} />
                    <Route path="/orders/create" element={<CreateOrder />} />
                    <Route path="/" element={<Login />} /> {/* Ruta por defecto */}
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;