import React, { useState, useEffect } from 'react';
import { register } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export default function Register({}) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', surname: '', username: '', password: '' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        try {
            await register(formData.name, formData.surname, formData.username, formData.password, 'ROLE_PATIENT');
            setMessage('Kayıt başarılı! Giriş yapabilirsiniz.');
            setTimeout(() => navigate('/login'), 2000); // 2 saniye sonra login ekranına at
        }catch (err) {
            setMessage('Kayıt olurken bir hata oluştu.');
        }
         finally {
            setLoading(false);
        }
    };

    const isSuccess = message.includes('başarılı');

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
                    max-width: 400px;
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

                .dc-message {
                    padding: 10px 12px;
                    border-radius: 10px;
                    font-size: 13.5px;
                    margin-bottom: 16px;
                    text-align: center;
                }

                .dc-message.success {
                    background: #e9f9ee;
                    color: #1e8449;
                    border: 1px solid #bfe9cc;
                }

                .dc-message.error {
                    background: #fdecec;
                    color: #c0392b;
                    border: 1px solid #f5c6c2;
                }

                .dc-row {
                    display: flex;
                    gap: 12px;
                }

                .dc-field {
                    margin-bottom: 16px;
                    flex: 1;
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
                    font-family: inherit;
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
                    margin-top: 4px;
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

                @media (max-width: 420px) {
                    .dc-row {
                        flex-direction: column;
                        gap: 0;
                    }
                }
            `}</style>

            <div className="dc-login-card">
                <div className="dc-icon-badge">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                        <path d="M12 12c2.5 0 4.5-2 4.5-4.5S14.5 3 12 3 7.5 5 7.5 7.5 9.5 12 12 12z" fill="#ffffff" />
                        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    </svg>
                </div>

                <h2 className="dc-title">Yeni Kayıt</h2>
                <p className="dc-subtitle">Diş Kliniği hesabınızı oluşturun</p>

                {message && (
                    <div className={`dc-message ${isSuccess ? 'success' : 'error'}`}>{message}</div>
                )}

                <form onSubmit={handleRegister}>
                    <div className="dc-row">
                        <div className="dc-field">
                            <label className="dc-label">Ad</label>
                            <input
                                type="text"
                                name="name"
                                className="dc-input"
                                placeholder="Adınız"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="dc-field">
                            <label className="dc-label">Soyad</label>
                            <input
                                type="text"
                                name="surname"
                                className="dc-input"
                                placeholder="Soyadınız"
                                value={formData.surname}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="dc-field">
                        <label className="dc-label">Email</label>
                        <input
                            type="text"
                            name="username"
                            className="dc-input"
                            placeholder="Email yazın"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="dc-field">
                        <label className="dc-label">Şifre</label>
                        <input
                            type="password"
                            name="password"
                            className="dc-input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>


                    <button type="submit" className="dc-submit" disabled={loading}>
                        {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                <p className="dc-register" onClick={() => navigate('/login')}>
                    Zaten hesabın var mı? <span>Giriş Yap</span>
                </p>
            </div>
        </div>
    );
}