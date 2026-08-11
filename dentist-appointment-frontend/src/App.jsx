import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard'; // Dashboard'u içeri aldık
import { getCurrentUser, logout } from './services/authService';

function App() {
    const [currentUser, setCurrentUser] = useState(getCurrentUser());

    const handleLogout = () => {
        logout();
        setCurrentUser(null);
    };

    return (
        <BrowserRouter>
            <Routes>
                {/* ANA SAYFA */}
                <Route
                    path="/"
                    element={
                        currentUser ? (
                            <div>
                                <header style={{ padding: '15px', background: '#333', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2>Randevu Sistemi</h2>
                                    <div>
                                        <span style={{ marginRight: '15px' }}>Hoş geldin, {currentUser.name}</span>
                                        <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px' }}>Çıkış Yap</button>
                                    </div>
                                </header>

                                <div style={{ padding: '20px' }}>
                                    {/* DASHBOARD BİLEŞENİ BURADA ÇALIŞIYOR */}
                                    <Dashboard user={currentUser} />
                                </div>
                            </div>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />

                {/* GİRİŞ VE KAYIT SAYFALARI */}
                <Route
                    path="/login"
                    element={
                        !currentUser ? <Login onLoginSuccess={() => setCurrentUser(getCurrentUser())} /> : <Navigate to="/" />
                    }
                />
                <Route
                    path="/register"
                    element={
                        !currentUser ? <Register /> : <Navigate to="/" />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;