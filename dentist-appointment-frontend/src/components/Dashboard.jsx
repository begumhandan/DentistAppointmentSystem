import React, { useState, useEffect } from 'react';
import { getAppointments, createAppointment, updateAppointment } from '../services/appointmentService';
import { getDoctors } from '../services/userService';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/tr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('tr');
const localizer = momentLocalizer(moment);

export default function Dashboard({ user }) {
    const [activeTab, setActiveTab] = useState('menu');
    const [doctors, setDoctors] = useState([]);

    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

// Bugünden önceki tarihleri seçtirmemek için bugünün tarihini alıyoruz
    const today = new Date().toISOString().split('T')[0];

// 09:00 - 18:00 arası 30 dakikalık periyotlar
    const timeSlots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];

    //rendevuları tuttuğum state
    const [appointments, setAppointments] = useState([]);
    const [editingAppId, setEditingAppId] = useState(null);
    const [editDuration, setEditDuration] = useState(30);
    const [editNote, setEditNote] = useState('');

    useEffect(() => {
        if (activeTab === 'new-appointment') {
            const fetchDoctors = async () => {
                const doctorList = await getDoctors();
                setDoctors(doctorList);
            };
            fetchDoctors();
        } else if (activeTab === 'my-appointments' || activeTab === 'doctor-calendar'|| activeTab === 'secretary-appointments') {
            const fetchAppointments = async () => {
                try {
                    const allAppointments = await getAppointments();

                    // randevuları giriş yapan kullanıcıya göre filtrele
                    if (user.role === 'ROLE_PATIENT') {
                        setAppointments(allAppointments.filter(app => app.patient && app.patient.id === user.id));
                    } else if (user.role === 'ROLE_DOCTOR') {
                        setAppointments(allAppointments.filter(app =>
                            app.doctor && app.doctor.id === user.id && app.status === 'APPROVED'
                        ));
                    }
                    else if (user.role === 'ROLE_SECRETARY') {
                        //sekreter herkesin rndevusunu görür.
                        setAppointments(allAppointments);
                    }
                } catch (error) {
                    console.error("Randevular çekilemedi:", error);
                }
            };

            fetchAppointments();
        }
    }, [activeTab, user.id]);

    //randevu kaydetme fonksiyonu
    const handleSaveAppointment = async () => {
        if (!selectedDoctor || !selectedDay || !selectedTime) {
            alert("Lütfen doktor, tarih ve saat seçiminizi tamamlayınız!");
            return;
        }

        try {
            // Seçilen gün ve saati backend'in istediği LocalDateTime formatına birleştirdik.
            const finalDateTime = `${selectedDay}T${selectedTime}:00`;

            await createAppointment(user.id, selectedDoctor, finalDateTime);
            alert("Randevunuz başarıyla oluşturuldu!");
            setActiveTab('menu');
            setSelectedDoctor('');
            setSelectedDay('');
            setSelectedTime('');
        } catch (error) {
            console.error("Randevu kaydedilemedi:", error);
            alert("Randevu alınırken bir hata oluştu.");
        }
    };

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

            {/*hasta ekranı*/}
            {user.role === 'ROLE_PATIENT' && (
                <div>
                    {/* menu buton*/}
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
                                    onClick={() => setActiveTab('new-appointment')}
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
                                    onClick={() => setActiveTab('my-appointments')}
                                >
                                    <div className="dc-card-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="9" />
                                            <polyline points="12 7 12 12 15 14" />
                                        </svg>
                                    </div>
                                    Randevularım
                                </div>
                            </div>
                        </>
                    )}

                    {/* kullanıcının randevuları*/}
                    {activeTab === 'my-appointments' && (
                        <div>
                            <button
                                onClick={() => setActiveTab('menu')}
                                style={{ marginBottom: '15px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px' }}
                            >
                                &larr; Geri Dön
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
                                                <strong>Doktor:</strong> Dr. {app.doctor?.name} {app.doctor?.surname}
                                            </div>
                                            <div style={{ fontSize: '15px', marginBottom: '8px', color: '#555' }}>
                                                <strong>Tarih:</strong> {new Date(app.appointmentDate).toLocaleString('tr-TR')}
                                            </div>
                                            <div style={{ fontSize: '14px' }}>
                                                <strong>Durum:</strong>
                                                <span style={{ marginLeft: '10px', padding: '4px 8px', borderRadius: '12px', backgroundColor: app.status === 'PENDING' ? '#f39c12' : '#27ae60', color: 'white' }}>
                                                    {app.status === 'PENDING' ? 'Onay Bekliyor' : 'Onaylandı'}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}


                    {/*yenş randevu*/}
                    {activeTab === 'new-appointment' && (
                        <div>
                            <button
                                className="dc-back-btn"
                                onClick={() => setActiveTab('menu')}
                            >
                                &larr; Geri Dön
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
                                    <label>Tarih Seçin</label>
                                    {/* min={today} sayesinde geçmiş tarihler tıklanamaz hale gelir */}
                                    <input
                                        type="date"
                                        className="dc-select"
                                        min={today}
                                        value={selectedDay}
                                        onChange={(e) => setSelectedDay(e.target.value)}
                                    />
                                </div>

                                {/* Sadece tarih seçildikten sonra saatler görünecek */}
                                {selectedDay && (
                                    <div className="dc-form-field">
                                        <label>Uygun Saatler</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                            {timeSlots.map(time => (
                                                <button
                                                    key={time}
                                                    onClick={() => setSelectedTime(time)}
                                                    style={{
                                                        padding: '10px',
                                                        borderRadius: '8px',
                                                        border: selectedTime === time ? '2px solid #27ae60' : '1px solid #dce8e7',
                                                        backgroundColor: selectedTime === time ? '#e8f8f5' : '#ffffff',
                                                        color: selectedTime === time ? '#27ae60' : '#2c3e50',
                                                        fontWeight: selectedTime === time ? 'bold' : 'normal',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    className="dc-confirm-btn"
                                    onClick={handleSaveAppointment}
                                >
                                    Randevuyu Onayla
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/*doktor ekranı*/}
            {user.role === 'ROLE_DOCTOR' && (
                <div>
                    {activeTab === 'menu' && (
                        <>
                            <h3 className="dc-section-title">
                                <span className="dc-section-dot" style={{ background: '#27ae60' }} />
                                Doktor İşlemleri
                            </h3>
                            <div className="dc-card-grid">
                                <div
                                    className="dc-card"
                                    style={{ background: 'linear-gradient(135deg, #27ae60, #1e8449)' }}
                                    onClick={() => setActiveTab('doctor-calendar')}
                                >
                                    <div className="dc-card-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                    Randevularım (Takvim)
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
                        </>
                    )}

                    {/* takvim-not */}
                    {activeTab === 'doctor-calendar' && (
                        <div style={{ marginTop: '20px' }}>
                            <button
                                onClick={() => setActiveTab('menu')}
                                style={{ marginBottom: '15px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px' }}
                            >
                                &larr; Geri Dön
                            </button>
                            <h3 style={{ color: '#27ae60', marginBottom: '20px' }}>Randevu Takvimim</h3>

                            {/*takvim */}
                            <div style={{ height: '550px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                <Calendar
                                    localizer={localizer}
                                    events={appointments.map(app => ({
                                        id: app.id,
                                        title: `Hasta: ${app.patient?.name || 'Bilinmiyor'} ${app.patient?.surname || ''}`,
                                        start: new Date(app.appointmentDate),
                                        end: new Date(new Date(app.appointmentDate).getTime() + (app.duration || 30) * 60000),
                                    }))}
                                    startAccessor="start"
                                    endAccessor="end"
                                    messages={{
                                        next: "İleri",
                                        previous: "Geri",
                                        today: "Bugün",
                                        month: "Ay",
                                        week: "Hafta",
                                        day: "Gün",
                                        agenda: "Ajanda",
                                        noEventsInRange: "Bu aralıkta randevu bulunmamaktadır."
                                    }}
                                />
                            </div>

                            {/* TEDAVİ NOTU LİSTESİ (Takvimin altına taşındı) */}
                            <div style={{ marginTop: '30px' }}>
                                <h4 style={{ color: '#27ae60', marginBottom: '15px' }}>Randevu Tedavi Notları ve Geçmişi</h4>

                                {appointments.length === 0 ? (
                                    <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '5px', color: '#7f8c8d' }}>
                                        Onaylanmış randevunuz bulunmamaktadır.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {appointments.map(app => (
                                            <div key={app.id} style={{ padding: '15px', border: '1px solid #e2edec', borderRadius: '10px', background: '#f9fcfb' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                    <div>
                                                        <strong>Hasta:</strong> {app.patient?.name} {app.patient?.surname} |
                                                        <span style={{ marginLeft: '10px', color: '#555' }}>
                                                            {new Date(app.appointmentDate).toLocaleString('tr-TR')}
                                                        </span>
                                                    </div>
                                                    <span style={{ padding: '4px 8px', borderRadius: '10px', backgroundColor: '#27ae60', color: 'white', fontSize: '12px' }}>
                                                        Onaylandı
                                                    </span>
                                                </div>

                                                <div style={{ fontSize: '14px', color: '#333', marginBottom: '10px' }}>
                                                    <strong>Mevcut Not / İşlem:</strong> {app.note || 'Henüz not girilmemiş.'}
                                                </div>

                                                {/* Not güncelleme alanı */}
                                                {editingAppId === app.id ? (
                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                        <input
                                                            type="text"
                                                            value={editNote}
                                                            onChange={(e) => setEditNote(e.target.value)}
                                                            placeholder="Örn: Dolgu yapıldı, 20lik diş kontrol edildi..."
                                                            style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                                                        />
                                                        <button
                                                            style={{ padding: '8px 15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                                            onClick={async () => {
                                                                try {
                                                                    await updateAppointment(app.id, { note: editNote });
                                                                    setAppointments(appointments.map(a => a.id === app.id ? { ...a, note: editNote } : a));
                                                                    setEditingAppId(null);
                                                                    alert("Tedavi notu başarıyla güncellendi!");
                                                                } catch (error) {
                                                                    alert("Not güncellenemedi!");
                                                                }
                                                            }}
                                                        >
                                                            Kaydet
                                                        </button>
                                                        <button
                                                            style={{ padding: '8px 15px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                                            onClick={() => setEditingAppId(null)}
                                                        >
                                                            İptal
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        style={{ padding: '6px 12px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}
                                                        onClick={() => {
                                                            setEditingAppId(app.id);
                                                            setEditNote(app.note || '');
                                                        }}
                                                    >
                                                        Tedavi Notunu Güncelle
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* sekreter/admin ekranı*/}
            {user.role === 'ROLE_SECRETARY' && (
                <div>
                    {activeTab === 'menu' && (
                        <>
                            <h3 className="dc-section-title">
                                <span className="dc-section-dot" style={{ background: '#8e44ad' }} />
                                Sekreter / Klinik Yönetimi
                            </h3>
                            <div className="dc-card-grid">
                                <div
                                    className="dc-card"
                                    style={{ background: 'linear-gradient(135deg, #8e44ad, #6c3483)' }}
                                    onClick={() => setActiveTab('secretary-appointments')}
                                >
                                    <div className="dc-card-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                    Tüm Randevuları ve Onayları Gör
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
                        </>
                    )}

                    {/* sekreter onay ve düzenleme ekranı*/}
                    {activeTab === 'secretary-appointments' && (
                        <div>
                            <button
                                onClick={() => setActiveTab('menu')}
                                style={{ marginBottom: '15px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px' }}
                            >
                                &larr; Geri Dön
                            </button>

                            <h3 style={{ color: '#8e44ad', marginBottom: '20px' }}>Klinik Randevu Yönetimi</h3>

                            {appointments.length === 0 ? (
                                <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '5px', color: '#7f8c8d' }}>
                                    Sistemde kayıtlı randevu bulunmamaktadır.
                                </div>
                            ) : (
                                <ul style={{ listStyleType: 'none', padding: 0 }}>
                                    {appointments.map(app => (
                                        <li key={app.id} style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '15px', backgroundColor: '#fdfdfd' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                                                        <strong>Hasta:</strong> {app.patient?.name} {app.patient?.surname} <br/>
                                                        <strong>Doktor:</strong> Dr. {app.doctor?.name} {app.doctor?.surname}
                                                    </div>
                                                    <div style={{ fontSize: '14px', marginBottom: '8px', color: '#555' }}>
                                                        <strong>Tarih:</strong> {new Date(app.appointmentDate).toLocaleString('tr-TR')}
                                                        {app.duration && <span style={{ marginLeft: '10px' }}>{app.duration} Dk</span>}
                                                    </div>
                                                    <div style={{ fontSize: '14px', color: '#2c3e50', fontStyle: 'italic', marginBottom: '10px' }}>
                                                        {app.note && ` Not: ${app.note}`}
                                                    </div>
                                                </div>
                                                <div>
                                        <span style={{ padding: '6px 10px', borderRadius: '12px', backgroundColor: app.status === 'APPROVED' ? '#27ae60' : (app.status === 'REJECTED' ? '#e74c3c' : '#f39c12'), color: 'white', fontSize: '13px' }}>
                                            {app.status === 'APPROVED' ? 'Onaylandı' : (app.status === 'REJECTED' ? 'Reddedildi' : 'Onay Bekliyor')}
                                        </span>
                                                </div>
                                            </div>

                                            {/*düzenleme formu*/}
                                            {editingAppId === app.id ? (
                                                <div style={{ marginTop: '15px', padding: '15px', background: '#f4f6f6', borderRadius: '8px', border: '1px dashed #bdc3c7' }}>
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Tahmini Süre (Dakika):</label>
                                                        <input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
                                                    </div>
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Doktora Not:</label>
                                                        <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows="2" style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} placeholder="Örn: Kanal tedavisi için röntgen çekilecek..."></textarea>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button
                                                            style={{ padding: '8px 12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                                            onClick={async () => {
                                                                try {
                                                                    //backende güncellme
                                                                    await updateAppointment(app.id, { status: 'APPROVED', note: editNote, duration: Number(editDuration) });
                                                                    //anlık değişiklik gösterilisn
                                                                    setAppointments(appointments.map(a => a.id === app.id ? { ...a, status: 'APPROVED', note: editNote, duration: Number(editDuration) } : a));
                                                                    setEditingAppId(null);
                                                                } catch (error) {
                                                                    alert("Güncelleme başarısız!");
                                                                }
                                                            }}
                                                        >
                                                            Onayla ve Kaydet
                                                        </button>
                                                        <button
                                                            style={{ padding: '8px 12px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                                            onClick={() => setEditingAppId(null)}
                                                        >
                                                            İptal
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                //onaylanmayan randevuları düzenle
                                                app.status !== 'APPROVED' && (
                                                    <button
                                                        style={{ marginTop: '10px', padding: '6px 12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}
                                                        onClick={() => {
                                                            setEditingAppId(app.id);
                                                            setEditDuration(app.duration || 30);
                                                            setEditNote(app.note || '');
                                                        }}
                                                    >
                                                        Süre/Not Ekle & Onayla
                                                    </button>
                                                )
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
    }