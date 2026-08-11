import React, { useState, useEffect } from 'react';
import { getDoctors } from '../services/userService';

export default function Dashboard({ user }) {
    // 'menu' = Ana butonlar, randevu alma butonu
    const [activeTab, setActiveTab] = useState('menu');
    const [doctors, setDoctors] = useState([]);

    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDate, setSelectedDate] = useState('');

    useEffect(() => {
        if (activeTab === 'new-appointment') {
            const fetchDoctors = async () => {
                const doctorList = await getDoctors();
                setDoctors(doctorList);
            };
            fetchDoctors();
        } else if (activeTab === 'my-appointments') {
            const fetchAppointments = async () => {
                try {
                    const allAppointments = await getAppointments();

                    console.log("Backend'den Gelen Tüm Randevular:", allAppointments);
                    console.log("Şu an giriş yapan hastanın ID'si:", user.id);

                    //randevuları giriş yapan hastaya göre filtrele
                    const myApps = allAppointments.filter(app => app.patient && app.patient.id === user.id);

                    console.log("Ekrana basılacak olan (Filtrelenmiş) Randevular:", myApps);

                    setAppointments(myApps);
                } catch (error) {
                    console.error("Randevular çekilemedi:", error);
                }
            };
            fetchAppointments();
        }
    }, [activeTab, user.id]);

    return (
        <div className="dc-dashboard">
            <style>{`
                .dc-dashboard {
                    padding: 28px;
                    background: #ffffff;
                    border-radius: 18px;
                    box-shadow: 0 15px 35px rgba(20, 90, 90, 0.08), 0 4px 10px rgba(20, 90, 90, 0.05);
                    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }

                .dc-section-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #123b3a;
                    font-size: 19px;
                    font-weight: 700;
                    margin: 0 0 20px;
                    padding-bottom: 14px;
                    border-bottom: 2px solid #e6f2f0;
                }

                .dc-section-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .dc-card-grid {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }

                .dc-card {
                    flex: 1;
                    min-width: 200px;
                    padding: 26px 22px;
                    border-radius: 14px;
                    color: #ffffff;
                    cursor: pointer;
                    text-align: left;
                    font-weight: 600;
                    font-size: 15.5px;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 22px rgba(20, 90, 90, 0.18);
                    transition: transform 0.18s ease, box-shadow 0.18s ease;
                }

                .dc-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 14px 28px rgba(20, 90, 90, 0.26);
                }

                .dc-card::after {
                    content: "";
                    position: absolute;
                    top: -30px;
                    right: -30px;
                    width: 90px;
                    height: 90px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.14);
                }

                .dc-card-icon {
                    width: 34px;
                    height: 34px;
                    border-radius: 9px;
                    background: rgba(255, 255, 255, 0.22);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 14px;
                }

                .dc-back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 18px;
                    padding: 9px 16px;
                    cursor: pointer;
                    background: #eef3f2;
                    color: #2c4a49;
                    border: none;
                    border-radius: 8px;
                    font-size: 13.5px;
                    font-weight: 600;
                    transition: background 0.15s ease;
                }

                .dc-back-btn:hover {
                    background: #e0eae8;
                }

                .dc-form-title {
                    color: #21867a;
                    font-size: 17px;
                    font-weight: 700;
                    margin: 0 0 4px;
                }

                .dc-form-subtitle {
                    color: #6c8a89;
                    font-size: 13.5px;
                    margin: 0 0 18px;
                }

                .dc-form-box {
                    padding: 24px;
                    background: #f9fcfb;
                    border: 1.5px solid #e2edec;
                    border-radius: 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    max-width: 420px;
                }

                .dc-form-field label {
                    font-weight: 600;
                    font-size: 13px;
                    color: #2c4a49;
                    display: block;
                    margin-bottom: 6px;
                }

                .dc-select, .dc-datetime {
                    width: 100%;
                    padding: 11px 14px;
                    border-radius: 10px;
                    border: 1.5px solid #dce8e7;
                    background: #ffffff;
                    font-size: 14px;
                    color: #123b3a;
                    box-sizing: border-box;
                    font-family: inherit;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                .dc-select:focus, .dc-datetime:focus {
                    outline: none;
                    border-color: #2a9d8f;
                    box-shadow: 0 0 0 4px rgba(42, 157, 143, 0.12);
                }

                .dc-confirm-btn {
                    padding: 13px;
                    background: linear-gradient(135deg, #2a9d8f, #21867a);
                    color: #ffffff;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14.5px;
                    box-shadow: 0 10px 20px rgba(33, 134, 122, 0.28);
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }

                .dc-confirm-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 14px 24px rgba(33, 134, 122, 0.35);
                }
            `}</style>

            {/* hasta ekran */}
            {user.role === 'ROLE_PATIENT' && (
                <div>
                    {/*menu butonu */}
                    {activeTab === 'menu' && (
                        <>
                            <h3 className="dc-section-title">
                                <span className="dc-section-dot" style={{ background: '#2a9d8f' }} />
                                Hasta İşlemleri
                            </h3>
                            <div className="dc-card-grid">
                                <div
                                    className="dc-card"
                                    style={{ background: 'linear-gradient(135deg, #2a9d8f, #21867a)' }}
                                    onClick={() => setActiveTab('new-appointment')} // Tıklanınca formu aç
                                >
                                    <div className="dc-card-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                            <line x1="12" y1="14" x2="12" y2="18" />
                                            <line x1="10" y1="16" x2="14" y2="16" />
                                        </svg>
                                    </div>
                                    Yeni Randevu Al
                                </div>
                                <div
                                    className="dc-card"
                                    style={{ background: 'linear-gradient(135deg, #3fb6a8, #2a9d8f)' }}
                                >
                                    <div className="dc-card-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="9" />
                                            <polyline points="12 7 12 12 15 14" />
                                        </svg>
                                    </div>
                                    Geçmiş Randevularım
                                </div>
                            </div>
                        </>
                    )}
                    {/*kullanıcı kendi randevularını görecek*/}
                    {activeTab === 'my-appointments' && (
                        <div>
                            <button
                                onClick={() => setActiveTab('menu')}
                                style={{ marginBottom: '15px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px' }}
                            >
                                ← Geri Dön
                            </button>
                            <h3 style={{ color: '#2980b9' }}>Geçmiş Randevularım</h3>

                            {appointments.length === 0 ? (
                                <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '5px', color: '#7f8c8d' }}>
                                    Henüz alınmış bir randevunuz bulunmamaktadır.
                                </div>
                            ) : (
                                <ul style={{ listStyleType: 'none', padding: 0 }}>
                                    {appointments.map(app => (
                                        <li key={app.id} style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '15px', backgroundColor: '#fdfdfd', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                                                <strong>👨‍⚕️ Doktor:</strong> Dr. {app.doctor?.name} {app.doctor?.surname}
                                            </div>
                                            <div style={{ fontSize: '15px', marginBottom: '8px', color: '#555' }}>
                                                <strong>📅 Tarih:</strong> {new Date(app.appointmentDate).toLocaleString('tr-TR')}
                                            </div>
                                            <div style={{ fontSize: '14px' }}>
                                                <strong>📌 Durum:</strong>
                                                <span style={{
                                                    marginLeft: '10px',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: app.status === 'PENDING' ? '#f39c12' : '#27ae60',
                                                    color: 'white'
                                                }}>
                                {app.status === 'PENDING' ? '⏳ Onay Bekliyor' : '✅ Onaylandı'}
                            </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}


                    {/* randevu eklme butonu */}
                    {activeTab === 'new-appointment' && (
                        <div>
                            <button
                                className="dc-back-btn"
                                onClick={() => setActiveTab('menu')}
                            >
                                ← Geri Dön
                            </button>

                            <h3 className="dc-form-title">Yeni Randevu Oluştur</h3>
                            <p className="dc-form-subtitle">Lütfen doktor ve uygun tarih seçin</p>

                            <div className="dc-form-box">

                                <div className="dc-form-field">
                                    <label>Doktor Seçin</label>
                                    <select
                                        className="dc-select"
                                        value={selectedDoctor}
                                        onChange={(e) => setSelectedDoctor(e.target.value)}
                                    >
                                        <option value="">-- Lütfen Doktor Seçin --</option>
                                        {doctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                Dr. {doc.name} {doc.surname}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="dc-form-field">
                                    <label>Tarih ve Saat Seçin</label>
                                    <input
                                        type="datetime-local"
                                        className="dc-datetime"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                    />
                                </div>

                                <button
                                    className="dc-confirm-btn"
                                    onClick={() => console.log("Seçilen Doktor ID:", selectedDoctor, "Tarih:", selectedDate)}
                                >
                                    Randevuyu Onayla
                                </button>

                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* doktor-sekreter ekranı*/}
            {user.role === 'ROLE_DOCTOR' && (
                <div>
                    <h3 className="dc-section-title">
                        <span className="dc-section-dot" style={{ background: '#27ae60' }} />
                        Doktor İşlemleri
                    </h3>
                    <div className="dc-card-grid">
                        <div className="dc-card" style={{ background: 'linear-gradient(135deg, #27ae60, #1e8449)' }}>
                            <div className="dc-card-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            Bugünkü Randevularım
                        </div>
                        <div className="dc-card" style={{ background: 'linear-gradient(135deg, #52c47f, #27ae60)' }}>
                            <div className="dc-card-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                </svg>
                            </div>
                            Hasta Geçmişi İncele
                        </div>
                    </div>
                </div>
            )}

            {user.role === 'ROLE_SECRETARY' && (
                <div>
                    <h3 className="dc-section-title">
                        <span className="dc-section-dot" style={{ background: '#8e44ad' }} />
                        Sekreter / Klinik Yönetimi
                    </h3>
                    <div className="dc-card-grid">
                        <div className="dc-card" style={{ background: 'linear-gradient(135deg, #8e44ad, #6c3483)' }}>
                            <div className="dc-card-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            Tüm Randevuları Gör
                        </div>
                        <div className="dc-card" style={{ background: 'linear-gradient(135deg, #a569bd, #8e44ad)' }}>
                            <div className="dc-card-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 6h16" />
                                    <path d="M4 12h16" />
                                    <path d="M4 18h10" />
                                </svg>
                            </div>
                            Doktor Takvimi Düzenle
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}