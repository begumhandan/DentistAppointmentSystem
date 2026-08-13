import './styles.css';
import React, { useState, useEffect } from 'react';
import { login } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLoginSuccess }) {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            onLoginSuccess(); // girşi başarılı -> anasayfaya
        } catch (err) {
            setError('email veya şifre hatalı!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dc-login-wrapper">
            

            <div className="dc-login-card">
                <div className="dc-icon-badge">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path
                            d="M12 3c-2.2 0-3.5 1.3-4.8 1.3-1.5 0-2.7-1-2.7 1.7 0 3.4 1 6.8 1.6 9.1.4 1.6.8 3.4 2 3.4 1.5 0 1.4-3.2 1.9-5 .3-1 .5-1.8 1.4-1.8s1.1.8 1.4 1.8c.5 1.8.4 5 1.9 5 1.2 0 1.6-1.8 2-3.4.6-2.3 1.6-5.7 1.6-9.1 0-2.7-1.2-1.7-2.7-1.7C15.5 4.3 14.2 3 12 3z"
                            fill="#ffffff"
                        />
                    </svg>
                </div>

                <h2 className="dc-title">Diş Kliniği</h2>
                <p className="dc-subtitle">Hesabınıza giriş yapın</p>

                {error && <div className="dc-error">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="dc-field">
                        <label className="dc-label">Emai</label>
                        <input
                            type="text"
                            className="dc-input"
                            placeholder="Email girin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="dc-field">
                        <label className="dc-label">Şifre</label>
                        <input
                            type="password"
                            className="dc-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="dc-submit" disabled={loading}>
                        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>

                <p className="dc-register" onClick={() => navigate('/register')}>
                    Hesabın yok mu? <span>Kayıt Ol</span>
                </p>
            </div>
        </div>
    );
}