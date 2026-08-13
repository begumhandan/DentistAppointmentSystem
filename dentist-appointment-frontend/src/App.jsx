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
                                <header
                                    style={{
                                        padding: '16px 28px',
                                        background: 'linear-gradient(135deg, #123b3a, #1a4f4d)',
                                        color: 'white',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        boxShadow: '0 4px 14px rgba(18, 59, 58, 0.25)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div
                                            style={{
                                                width: '34px',
                                                height: '34px',
                                                borderRadius: '9px',
                                                background: 'rgba(255,255,255,0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                <path
                                                    d="M12 3c-2.2 0-3.5 1.3-4.8 1.3-1.5 0-2.7-1-2.7 1.7 0 3.4 1 6.8 1.6 9.1.4 1.6.8 3.4 2 3.4 1.5 0 1.4-3.2 1.9-5 .3-1 .5-1.8 1.4-1.8s1.1.8 1.4 1.8c.5 1.8.4 5 1.9 5 1.2 0 1.6-1.8 2-3.4.6-2.3 1.6-5.7 1.6-9.1 0-2.7-1.2-1.7-2.7-1.7C15.5 4.3 14.2 3 12 3z"
                                                    fill="#ffffff"
                                                />
                                            </svg>
                                        </div>
                                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.2px' }}>
                                            DentSmielRandevu Sistemi
                                        </h2>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
            Hoş geldin, <strong style={{ color: 'white' }}>{currentUser.name}</strong>
        </span>
                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                padding: '8px 16px',
                                                cursor: 'pointer',
                                                backgroundColor: 'rgba(231, 76, 60, 0.15)',
                                                color: '#ff8a80',
                                                border: '1.5px solid rgba(231, 76, 60, 0.4)',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                fontSize: '13.5px',
                                                transition: 'background 0.15s ease, color 0.15s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#e74c3c';
                                                e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.15)';
                                                e.currentTarget.style.color = '#ff8a80';
                                            }}
                                        >
                                            Çıkış Yap
                                        </button>
                                    </div>
                                </header>

                                <div style={{ padding: '20px' }}>
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