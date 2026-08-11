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
            <style>{`
                .dc-login-wrapper {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: radial-gradient(circle at 20% 20%, #e6f7f4 0%, #f4faf9 45%, #eef3f5 100%);
                    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    padding: 20px;
                    box-sizing: border-box;
                }

                .dc-login-card {
                    background: #ffffff;
                    width: 100%;
                    max-width: 380px;
                    border-radius: 20px;
                    padding: 40px 36px 32px;
                    box-shadow: 0 20px 45px rgba(20, 90, 90, 0.12), 0 4px 10px rgba(20, 90, 90, 0.06);
                    position: relative;
                    overflow: hidden;
                    animation: dc-fade-up 0.5s ease;
                }

                .dc-login-card::before {
                    content: "";
                    position: absolute;
                    top: -60px;
                    right: -60px;
                    width: 160px;
                    height: 160px;
                    background: linear-gradient(135deg, #2a9d8f, #6fd6c4);
                    opacity: 0.12;
                    border-radius: 50%;
                }

                @keyframes dc-fade-up {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .dc-icon-badge {
                    width: 60px;
                    height: 60px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, #2a9d8f, #21867a);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 18px;
                    box-shadow: 0 8px 18px rgba(42, 157, 143, 0.35);
                }

                .dc-title {
                    text-align: center;
                    margin: 0 0 4px;
                    color: #123b3a;
                    font-size: 22px;
                    font-weight: 700;
                    letter-spacing: -0.2px;
                }

                .dc-subtitle {
                    text-align: center;
                    margin: 0 0 26px;
                    color: #6c8a89;
                    font-size: 13.5px;
                }

                .dc-error {
                    background: #fdecec;
                    color: #c0392b;
                    border: 1px solid #f5c6c2;
                    padding: 10px 12px;
                    border-radius: 10px;
                    font-size: 13.5px;
                    margin-bottom: 16px;
                    text-align: center;
                }

                .dc-field {
                    margin-bottom: 18px;
                }

                .dc-label {
                    display: block;
                    margin-bottom: 6px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #2c4a49;
                }

                .dc-input {
                    width: 100%;
                    padding: 12px 14px;
                    border-radius: 10px;
                    border: 1.5px solid #dce8e7;
                    background: #f9fcfb;
                    font-size: 14.5px;
                    color: #123b3a;
                    box-sizing: border-box;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
                }

                .dc-input::placeholder {
                    color: #a9bdbc;
                }

                .dc-input:focus {
                    outline: none;
                    border-color: #2a9d8f;
                    background: #ffffff;
                    box-shadow: 0 0 0 4px rgba(42, 157, 143, 0.12);
                }

                .dc-submit {
                    width: 100%;
                    padding: 12px;
                    margin-top: 6px;
                    background: linear-gradient(135deg, #2a9d8f, #21867a);
                    color: #ffffff;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 15px;
                    letter-spacing: 0.2px;
                    cursor: pointer;
                    transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
                    box-shadow: 0 10px 20px rgba(33, 134, 122, 0.28);
                }

                .dc-submit:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 14px 24px rgba(33, 134, 122, 0.35);
                }

                .dc-submit:active:not(:disabled) {
                    transform: translateY(0);
                }

                .dc-submit:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .dc-register {
                    text-align: center;
                    margin-top: 20px;
                    font-size: 13.5px;
                    color: #6c8a89;
                }

                .dc-register span {
                    color: #21867a;
                    font-weight: 600;
                    cursor: pointer;
                }

                .dc-register span:hover {
                    text-decoration: underline;
                }
            `}</style>

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