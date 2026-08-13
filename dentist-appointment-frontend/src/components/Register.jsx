import './styles.css';
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