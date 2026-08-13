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
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [selectedEventModal, setSelectedEventModal] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('');
    const [filterPatient, setFilterPatient] = useState('');
    const [filterDoctor, setFilterDoctor] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterNote, setFilterNote] = useState('');
    const [bookedSlots, setBookedSlots] = useState([]);

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
        } else if (activeTab === 'my-appointments' || activeTab === 'doctor-calendar'|| activeTab === 'secretary-appointments' || activeTab === 'secretary-master-calendar') {
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
    // doktor-tarih doluysa göstermeme kısmı
    useEffect(() => {
        if (activeTab === 'new-appointment' && selectedDoctor && selectedDay) {
            const fetchBookedSlots = async () => {
                try {
                    const allApps = await getAppointments();

                    const booked = allApps
                        .filter(app => {
                            // 1. İptal edilen (REJECTED) randevular saati meşgul etmez
                            if (app.status === 'REJECTED') return false;

                            // 2. Sadece seçili günün randevularına bak
                            const d = new Date(app.appointmentDate);
                            const yyyy = d.getFullYear();
                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                            const dd = String(d.getDate()).padStart(2, '0');
                            const appDateStr = `${yyyy}-${mm}-${dd}`;

                            if (appDateStr !== selectedDay) return false;

                            // Seçilen doktor o saatte doluysa
                            const isDoctorBusy = String(app.doctor?.id) === String(selectedDoctor);

                            //veya bu kullanıcının (hastanın) o saatte zaten bir randevusu varsa
                            const isPatientBusy = String(app.patient?.id) === String(user.id);

                            // ikisinden biri bile doğruysa bu saati dolu (booked) listesine atıcak
                            return isDoctorBusy || isPatientBusy;
                        })
                        .map(app => {
                            const d = new Date(app.appointmentDate);
                            const hh = String(d.getHours()).padStart(2, '0');
                            const mm = String(d.getMinutes()).padStart(2, '0');
                            return `${hh}:${mm}`;
                        });

                    setBookedSlots(booked);
                } catch (error) {
                    console.error("Dolu saatler çekilemedi:", error);
                }
            };
            fetchBookedSlots();
        } else {
            setBookedSlots([]); // Doktor veya tarih silinirse dolu saatleri sıfırla
        }
    }, [selectedDoctor, selectedDay, activeTab, user.id]);

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
    //takvimde randevunun durumuna göre renk faklı olucak
    const eventStyleGetter = (event, start, end, isSelected) => {
        let backgroundColor = '#f39c12'; // PENDING (Onay Bekliyor - Turuncu)

        if (event.originalData.status === 'APPROVED') {
            backgroundColor = '#27ae60'; // APPROVED (Onaylandı - Yeşil)
        } else if (event.originalData.status === 'REJECTED') {
            backgroundColor = '#e74c3c'; // REJECTED (İptal - Kırmızı)
        }else if (event.originalData.status === 'RESCHEDULED_BY_CLINIC') {
            backgroundColor = '#3498db'; // MAVİ (Hastadan onay bekleyen)
        }
        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.9,
                color: 'white',
                border: 'none',
                display: 'block',
                fontSize: '12px',
                padding: '2px 5px'
            }
        };
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
                    {/* hasta icin ertelemenme bildirimi */}
                    {appointments.filter(app => app.status === 'RESCHEDULED_BY_CLINIC').map(rescheduledApp => (
                        <div key={rescheduledApp.id} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                            <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '450px', textAlign: 'center', boxShadow: '0 15px 30px rgba(0,0,0,0.3)' }}>
                                <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
                                <h3 style={{ color: '#e67e22', marginTop: 0 }}>Randevu Saatiniz Değiştirildi</h3>
                                <p style={{ color: '#34495e', fontSize: '15px', lineHeight: '1.5' }}>
                                    Klinik tarafından <strong>Dr. {rescheduledApp.doctor?.name} {rescheduledApp.doctor?.surname}</strong> ile olan randevunuz yeni bir saate alındı.
                                </p>
                                <div style={{ margin: '20px 0', padding: '15px', background: '#fdf2e9', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', color: '#d35400' }}>
                                    Yeni Tarih: <br/>{new Date(rescheduledApp.appointmentDate).toLocaleString('tr-TR')}
                                </div>
                                <p style={{ color: '#7f8c8d', fontSize: '13px', marginBottom: '20px' }}>Bu yeni saati onaylıyor musunuz?</p>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await updateAppointment(rescheduledApp.id, { status: 'APPROVED' });
                                                setAppointments(appointments.map(a => a.id === rescheduledApp.id ? { ...a, status: 'APPROVED' } : a));
                                                alert("Randevunuz onaylandı!");
                                            } catch (error) {
                                                alert("Bir hata oluştu.");
                                            }
                                        }}
                                        style={{ flex: 1, padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Onaylıyorum
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await updateAppointment(rescheduledApp.id, { status: 'REJECTED' });
                                                setAppointments(appointments.map(a => a.id === rescheduledApp.id ? { ...a, status: 'REJECTED' } : a));
                                                alert("Randevunuz iptal edildi.");
                                            } catch (error) {
                                                alert("Bir hata oluştu.");
                                            }
                                        }}
                                        style={{ flex: 1, padding: '12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        İptal Et
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
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
                                                <span style={{
                                                    marginLeft: '10px',
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    color: 'white',
                                                    backgroundColor: app.status === 'APPROVED' ? '#27ae60' : (app.status === 'REJECTED' ? '#e74c3c' : '#f39c12')
                                                }}>
                                {app.status === 'APPROVED' ? 'Onaylandı' : (app.status === 'REJECTED' ? 'Reddedildi / İptal' : 'Onay Bekliyor')}
                            </span>
                                            </div>

                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}


                    {/*yeni randevu*/}
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
                                            {timeSlots.map(time => {
                                                const isBooked = bookedSlots.includes(time); // Saat dolu mu kontrolü

                                                return (
                                                    <button
                                                        key={time}
                                                        disabled={isBooked} // Doluysa butonu tıklanamaz yap
                                                        onClick={() => setSelectedTime(time)}
                                                        style={{
                                                            padding: '10px',
                                                            borderRadius: '8px',
                                                            border: selectedTime === time ? '2px solid #27ae60' : '1px solid #dce8e7',

                                                            // Doluysa gri, seçiliyse yeşil, boşsa beyaz:
                                                            backgroundColor: isBooked ? '#f2f4f4' : (selectedTime === time ? '#e8f8f5' : '#ffffff'),
                                                            color: isBooked ? '#bdc3c7' : (selectedTime === time ? '#27ae60' : '#2c3e50'),

                                                            fontWeight: selectedTime === time ? 'bold' : 'normal',
                                                            cursor: isBooked ? 'not-allowed' : 'pointer', // Doluysa imleç yasak işareti olur
                                                            textDecoration: isBooked ? 'line-through' : 'none', // Doluysa üstünü çiz
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {time}
                                                    </button>
                                                );
                                            })}
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
                    {/*doktor-anaekran */}
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
                                <div
                                    className="dc-card"
                                    style={{ background: 'linear-gradient(135deg, #52c47f, #27ae60)' }}
                                    onClick={() => {
                                        setActiveTab('patient-history');
                                        setSearchTerm('');
                                        setSelectedPatient(null);
                                    }}
                                >
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

                    {/* doktor takvim */}
                    {activeTab === 'doctor-calendar' && (
                        <div style={{ marginTop: '20px' }}>
                            <button
                                onClick={() => setActiveTab('menu')}
                                style={{ marginBottom: '15px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px' }}
                            >
                                &larr; Geri Dön
                            </button>
                            <h3 style={{ color: '#27ae60', marginBottom: '20px' }}>Randevu Takvimim</h3>

                            <div style={{ height: '550px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                <Calendar
                                    localizer={localizer}
                                    events={appointments.map(app => ({
                                        id: app.id,
                                        title: `${app.patient?.name || 'Bilinmiyor'} ${app.patient?.surname || ''}`,
                                        start: new Date(app.appointmentDate),
                                        end: new Date(new Date(app.appointmentDate).getTime() + (app.duration || 30) * 60000),
                                        tooltipDetails: `Tedavi Notu: ${app.note || 'Girilmemiş'}\nSüre: ${app.duration || 30} Dakika`,
                                        originalData: app
                                    }))}
                                    startAccessor="start"
                                    endAccessor="end"
                                    tooltipAccessor="tooltipDetails"

                                    onSelectEvent={(event) => {
                                        const app = event.originalData;
                                        setEditingAppId(app.id);
                                        setEditDuration(app.duration || 30);
                                        setEditNote(app.note || '');

                                        //var olan randevu tarihini ve saatini parçalayıp state'e atıyoruz
                                        const appDateObj = new Date(app.appointmentDate);
                                        //türkiye saati farkını önlemek için manuel formatlama yaptık
                                        const yyyy = appDateObj.getFullYear();
                                        const mm = String(appDateObj.getMonth() + 1).padStart(2, '0');
                                        const dd = String(appDateObj.getDate()).padStart(2, '0');
                                        const hh = String(appDateObj.getHours()).padStart(2, '0');
                                        const min = String(appDateObj.getMinutes()).padStart(2, '0');

                                        setEditDate(`${yyyy}-${mm}-${dd}`);
                                        setEditTime(`${hh}:${min}`);

                                        setSelectedEventModal(app);
                                    }}

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
                                {/* randevu detayı*/}
                                {/* SEKRETER ONAY MODALI (POP-UP) */}
                                {selectedEventModal && activeTab === 'secretary-master-calendar' && (
                                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                                        <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '450px', boxShadow: '0 15px 30px rgba(0,0,0,0.2)' }}>
                                            <h3 style={{ color: '#8e44ad', marginTop: 0, borderBottom: '2px solid #e2edec', paddingBottom: '10px' }}>⚙️ Randevu Yönetimi</h3>

                                            <div style={{ margin: '15px 0', fontSize: '14px', color: '#2c3e50', background: '#f9fcfb', padding: '15px', borderRadius: '8px' }}>
                                                <div><strong>Doktor:</strong> Dr. {selectedEventModal.doctor?.name} {selectedEventModal.doctor?.surname}</div>
                                                <div><strong>Hasta:</strong> {selectedEventModal.patient?.name} {selectedEventModal.patient?.surname}</div>
                                                <div><strong>Mevcut Tarih:</strong> {new Date(selectedEventModal.appointmentDate).toLocaleString('tr-TR')}</div>
                                                <div style={{ marginTop: '10px' }}>
                                                    <strong>Durum: </strong>
                                                    <span style={{ padding: '3px 8px', borderRadius: '8px', color: 'white', backgroundColor: selectedEventModal.status === 'APPROVED' ? '#27ae60' : (selectedEventModal.status === 'REJECTED' ? '#e74c3c' : (selectedEventModal.status === 'RESCHEDULED_BY_CLINIC' ? '#3498db' : '#f39c12')) }}>
                        {selectedEventModal.status === 'APPROVED' ? 'Onaylı' : (selectedEventModal.status === 'REJECTED' ? 'İptal' : (selectedEventModal.status === 'RESCHEDULED_BY_CLINIC' ? 'Hastadan Onay Bekliyor' : 'Onay Bekliyor'))}
                    </span>
                                                </div>
                                            </div>

                                            {/* tarih-saat */}
                                            <div style={{ marginBottom: '15px' }}>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Yeni Tarih Seçin:</label>
                                                <input
                                                    type="date"
                                                    min={today}
                                                    value={editDate}
                                                    onChange={(e) => {
                                                        setEditDate(e.target.value);
                                                        setEditTime(''); // Tarih değiştiğinde saati sıfırla
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px' }}
                                                />

                                                {/* Sadece tarih seçildiğinde saat kutucukları göster */}
                                                {editDate && (
                                                    <div style={{ marginTop: '10px' }}>
                                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Uygun Saatler:</label>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '120px', overflowY: 'auto', padding: '5px 0' }}>
                                                            {timeSlots.map(time => (
                                                                <button
                                                                    key={time}
                                                                    onClick={() => setEditTime(time)}
                                                                    style={{
                                                                        padding: '8px 5px',
                                                                        borderRadius: '6px',
                                                                        border: editTime === time ? '2px solid #f39c12' : '1px solid #dce8e7',
                                                                        backgroundColor: editTime === time ? '#fdf2e9' : '#ffffff',
                                                                        color: editTime === time ? '#d35400' : '#2c3e50',
                                                                        fontWeight: editTime === time ? 'bold' : 'normal',
                                                                        cursor: 'pointer',
                                                                        fontSize: '13px',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    {time}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Süre (Dakika):</label>
                                                    <input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '20px' }}>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Doktora İletilecek Not:</label>
                                                <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="Örn: 20lik diş çekimi..."></textarea>
                                            </div>

                                            {/*erteleme buton */}
                                            <button
                                                onClick={async () => {
                                                    if (!editDate || !editTime) {
                                                        alert("Lütfen yeni bir tarih ve saat seçin!");
                                                        return;
                                                    }
                                                    try {
                                                        const newDateTime = `${editDate}T${editTime}:00`;
                                                        await updateAppointment(selectedEventModal.id, {
                                                            status: 'RESCHEDULED_BY_CLINIC',
                                                            appointmentDate: newDateTime,
                                                            note: editNote,
                                                            duration: Number(editDuration)
                                                        });

                                                        setAppointments(appointments.map(a => a.id === selectedEventModal.id ? { ...a, status: 'RESCHEDULED_BY_CLINIC', appointmentDate: newDateTime, note: editNote, duration: Number(editDuration) } : a));
                                                        setSelectedEventModal(null);
                                                        alert("Randevu ertelendi, hastadan onay bekleniyor.");
                                                    } catch (error) { alert("Erteleme başarısız!"); }
                                                }}
                                                style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                Tarihi Değiştir ve Hastaya Onaya Gönder
                                            </button>

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await updateAppointment(selectedEventModal.id, { status: 'APPROVED', note: editNote, duration: Number(editDuration) });
                                                            setAppointments(appointments.map(a => a.id === selectedEventModal.id ? { ...a, status: 'APPROVED', note: editNote, duration: Number(editDuration) } : a));
                                                            setSelectedEventModal(null);
                                                        } catch (error) { alert("Güncelleme başarısız!"); }
                                                    }}
                                                    style={{ flex: 1, padding: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    Onayla
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await updateAppointment(selectedEventModal.id, { status: 'REJECTED' });
                                                            setAppointments(appointments.map(a => a.id === selectedEventModal.id ? { ...a, status: 'REJECTED' } : a));
                                                            setSelectedEventModal(null);
                                                        } catch (error) { alert("İptal başarısız!"); }
                                                    }}
                                                    style={{ flex: 1, padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    İptal Et
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => setSelectedEventModal(null)}
                                                style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#ecf0f1', color: '#7f8c8d', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                                            >
                                                Kapat
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/*hasta geçmiş/arama */}
                    {activeTab === 'patient-history' && (
                        <div style={{ marginTop: '20px' }}>
                            <button
                                onClick={() => setActiveTab('menu')}
                                style={{ marginBottom: '15px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px' }}
                            >
                                &larr; Geri Dön
                            </button>
                            <h3 style={{ color: '#27ae60', marginBottom: '20px' }}>Hasta Geçmişi İnceleme</h3>

                            {/* arama ekranı */}
                            {!selectedPatient ? (
                                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                    <input
                                        type="text"
                                        placeholder="🔍 Hasta adı veya soyadı ile ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dce8e7', marginBottom: '20px', fontSize: '15px' }}
                                    />

                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {Array.from(new Map(appointments.filter(app => app.patient).map(app => [app.patient.id, app.patient])).values())
                                            .filter(p => `${p.name} ${p.surname}`.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(patient => (
                                                <div
                                                    key={patient.id}
                                                    onClick={() => setSelectedPatient(patient)}
                                                    style={{ padding: '15px', background: '#f8f9fa', border: '1px solid #e2edec', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                >
                                                    <strong>👤 {patient.name} {patient.surname}</strong>
                                                    <span style={{ color: '#27ae60', fontSize: '13px', fontWeight: 'bold' }}>Geçmişi Gör &rarr;</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ) : (
                                /* hasta seçildiyse geçmişi göster */
                                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2edec', paddingBottom: '10px' }}>
                                        <h4 style={{ color: '#2c3e50', margin: 0 }}>👤 {selectedPatient.name} {selectedPatient.surname} - Tedavi Geçmişi</h4>
                                        <button
                                            onClick={() => setSelectedPatient(null)}
                                            style={{ padding: '6px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            Başka Hasta Ara
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {appointments.filter(app => app.patient && app.patient.id === selectedPatient.id).map(app => (
                                            <div key={app.id} style={{ padding: '15px', borderLeft: '4px solid #27ae60', background: '#f9fcfb', borderRadius: '0 8px 8px 0' }}>
                                                <div style={{ marginBottom: '8px', color: '#555', fontSize: '13px' }}>
                                                    <strong>Tarih:</strong> {new Date(app.appointmentDate).toLocaleString('tr-TR')}
                                                </div>
                                                <div style={{ fontSize: '15px', color: '#333' }}>
                                                    <strong>Uygulanan İşlem / Not:</strong> {app.note || 'Not girilmemiş.'}
                                                </div>

                                                {/* not güncelleme butonu */}
                                                {editingAppId === app.id ? (
                                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                                        <input
                                                            type="text"
                                                            value={editNote}
                                                            onChange={(e) => setEditNote(e.target.value)}
                                                            placeholder="Tedavi detayını yazın..."
                                                            style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                                                        />
                                                        <button
                                                            style={{ padding: '8px 15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                                                            onClick={async () => {
                                                                try {
                                                                    await updateAppointment(app.id, { note: editNote });
                                                                    setAppointments(appointments.map(a => a.id === app.id ? { ...a, note: editNote } : a));
                                                                    setEditingAppId(null);
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
                                                        style={{ marginTop: '10px', padding: '6px 12px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px' }}
                                                        onClick={() => {
                                                            setEditingAppId(app.id);
                                                            setEditNote(app.note || '');
                                                        }}
                                                    >
                                                        Notu Güncelle
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* sekreter/admin ekranı*/}
            {user.role === 'ROLE_SECRETARY' && (
                <div>
                    {/*Sekreter menu*/}
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
                                    Liste Görünümü (Tüm Randevular)
                                </div>
                                <div
                                    className="dc-card"
                                    style={{ background: 'linear-gradient(135deg, #a569bd, #8e44ad)' }}
                                    onClick={() => setActiveTab('secretary-master-calendar')}
                                >
                                    <div className="dc-card-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 6h16" />
                                            <path d="M4 12h16" />
                                            <path d="M4 18h10" />
                                        </svg>
                                    </div>
                                    Klinik Takvimi
                                </div>
                            </div>
                        </>
                    )}

                    {/* liste görünüm */}
                    {activeTab === 'secretary-appointments' && (
                        <div>
                            <button
                                onClick={() => {
                                    setActiveTab('menu');
                                    setFilterPatient(''); // Menüye dönerken aramaları temizlesin
                                    setFilterDoctor('');
                                    setFilterDate('');
                                    setFilterNote('');
                                }}
                                style={{ marginBottom: '15px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px' }}
                            >
                                &larr; Geri Dön
                            </button>

                            <h3 style={{ color: '#8e44ad', marginBottom: '15px' }}>Klinik Randevu Listesi</h3>

                            {/* arama çubuğu */}
                            <div style={{ background: '#f4f6f6', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #dce8e7', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                <div style={{ flex: '1', minWidth: '150px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>Hasta Adı</label>
                                    <input type="text" placeholder="Hasta ara..." value={filterPatient} onChange={e => setFilterPatient(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdc3c7' }} />
                                </div>
                                <div style={{ flex: '1', minWidth: '150px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>Doktor Adı</label>
                                    <input type="text" placeholder="Doktor ara..." value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdc3c7' }} />
                                </div>
                                <div style={{ flex: '1', minWidth: '150px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>Tarih</label>
                                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdc3c7' }} />
                                </div>
                                <div style={{ flex: '1', minWidth: '150px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>Açıklama</label>
                                    <input type="text" placeholder="Açıklama ara..." value={filterNote} onChange={e => setFilterNote(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #bdc3c7' }} />
                                </div>
                                <button
                                    onClick={() => { setFilterPatient(''); setFilterDoctor(''); setFilterDate(''); setFilterNote(''); }}
                                    style={{ padding: '10px 15px', backgroundColor: '#7f8c8d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '39px' }}
                                >
                                    Temizle
                                </button>
                            </div>

                            {/* filterlenmiş randevular */}
                            {(() => {
                                //arama kutusuna göre filreleme
                                const filteredApps = appointments.filter(app => {
                                    const matchPatient = !filterPatient || `${app.patient?.name} ${app.patient?.surname}`.toLowerCase().includes(filterPatient.toLowerCase());
                                    const matchDoctor = !filterDoctor || `${app.doctor?.name} ${app.doctor?.surname}`.toLowerCase().includes(filterDoctor.toLowerCase());
                                    const matchNote = !filterNote || (app.note && app.note.toLowerCase().includes(filterNote.toLowerCase()));
                                    //tarih formatlama
                                    const appDateObj = new Date(app.appointmentDate);
                                    const yyyy = appDateObj.getFullYear();
                                    const mm = String(appDateObj.getMonth() + 1).padStart(2, '0');
                                    const dd = String(appDateObj.getDate()).padStart(2, '0');
                                    const appDateStr = `${yyyy}-${mm}-${dd}`;

                                    const matchDate = !filterDate || appDateStr === filterDate;


                                    return matchPatient && matchDoctor && matchDate && matchNote;
                                });

                                if (appointments.length === 0) {
                                    return <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '5px', color: '#7f8c8d' }}>Sistemde kayıtlı randevu bulunmamaktadır.</div>;
                                }

                                if (filteredApps.length === 0) {
                                    return <div style={{ padding: '20px', background: '#fdf2e9', borderRadius: '5px', color: '#e67e22', border: '1px dashed #e67e22' }}>⚠️ Arama kriterlerinize uygun randevu bulunamadı.</div>;
                                }

                                return (
                                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                                        {filteredApps.map(app => (
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
                                                            {app.note && `Not: ${app.note}`}
                                                        </div>
                                                    </div>
                                                    <div>
                                    <span style={{ padding: '6px 10px', borderRadius: '12px', color: 'white', fontSize: '13px', backgroundColor: app.status === 'APPROVED' ? '#27ae60' : (app.status === 'REJECTED' ? '#e74c3c' : (app.status === 'RESCHEDULED_BY_CLINIC' ? '#3498db' : '#f39c12')) }}>
                                        {app.status === 'APPROVED' ? 'Onaylandı' : (app.status === 'REJECTED' ? 'Reddedildi' : (app.status === 'RESCHEDULED_BY_CLINIC' ? 'Hastadan Onay Bekliyor' : 'Onay Bekliyor'))}
                                    </span>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                );
                            })()}
                        </div>
                    )}

                    {/*klinik takvim*/}
                    {activeTab === 'secretary-master-calendar' && (
                        <div style={{ marginTop: '20px' }}>
                            <button
                                onClick={() => setActiveTab('menu')}
                                style={{ marginBottom: '15px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px' }}
                            >
                                &larr; Geri Dön
                            </button>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ color: '#8e44ad', margin: 0 }}>Genel Klinik Takvimi</h3>
                                <div style={{ display: 'flex', gap: '15px', fontSize: '13px', fontWeight: 'bold' }}>
                                    <span style={{ color: '#f39c12' }}>Sizden Onay Bekleyenler</span>
                                    <span style={{ color: '#27ae60' }}>Onaylananlar</span>
                                    <span style ={{color: '#3498db'}}>Hastadan Onay Bekleyenler</span>
                                </div>
                            </div>

                            <div style={{ height: '600px', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                <Calendar
                                    localizer={localizer}
                                    events={appointments
                                        .filter(app => app.status !== 'REJECTED')
                                        .map(app => ({
                                        id: app.id,
                                        title: `Dr. ${app.doctor?.name} | H: ${app.patient?.name}`,
                                        start: new Date(app.appointmentDate),
                                        end: new Date(new Date(app.appointmentDate).getTime() + (app.duration || 30) * 60000),
                                        originalData: app
                                    }))}
                                    startAccessor="start"
                                    endAccessor="end"
                                    eventPropGetter={eventStyleGetter}
                                    onSelectEvent={(event) => {
                                        const app = event.originalData;
                                        setEditingAppId(app.id);
                                        setEditDuration(app.duration || 30);
                                        setEditNote(app.note || '');
                                        setSelectedEventModal(app);
                                    }}
                                    messages={{ next: "İleri", previous: "Geri", today: "Bugün", month: "Ay", week: "Hafta", day: "Gün" }}
                                />
                            </div>
                        </div>
                    )}

                    {/* SEKRETER ONAY MODALI (POP-UP) */}
                    {selectedEventModal && activeTab === 'secretary-master-calendar' && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                            <div style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '450px', boxShadow: '0 15px 30px rgba(0,0,0,0.2)' }}>
                                <h3 style={{ color: '#8e44ad', marginTop: 0, borderBottom: '2px solid #e2edec', paddingBottom: '10px' }}>⚙️ Randevu Yönetimi</h3>

                                <div style={{ margin: '15px 0', fontSize: '14px', color: '#2c3e50', background: '#f9fcfb', padding: '15px', borderRadius: '8px' }}>
                                    <div><strong>Doktor:</strong> Dr. {selectedEventModal.doctor?.name} {selectedEventModal.doctor?.surname}</div>
                                    <div><strong>Hasta:</strong> {selectedEventModal.patient?.name} {selectedEventModal.patient?.surname}</div>
                                    <div><strong>Mevcut Tarih:</strong> {new Date(selectedEventModal.appointmentDate).toLocaleString('tr-TR')}</div>
                                    <div style={{ marginTop: '10px' }}>
                                        <strong>Durum: </strong>
                                        <span style={{ padding: '3px 8px', borderRadius: '8px', color: 'white', backgroundColor: selectedEventModal.status === 'APPROVED' ? '#27ae60' : (selectedEventModal.status === 'REJECTED' ? '#e74c3c' : (selectedEventModal.status === 'RESCHEDULED_BY_CLINIC' ? '#3498db' : '#f39c12')) }}>
                                            {selectedEventModal.status === 'APPROVED' ? 'Onaylı' : (selectedEventModal.status === 'REJECTED' ? 'İptal' : (selectedEventModal.status === 'RESCHEDULED_BY_CLINIC' ? 'Hastadan Onay Bekliyor' : 'Onay Bekliyor'))}
                                        </span>
                                    </div>
                                </div>

                                {/* tarih - saat  */}
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Yeni Tarih Seçin:</label>
                                    <input
                                        type="date"
                                        min={today}
                                        value={editDate}
                                        onChange={(e) => {
                                            setEditDate(e.target.value);
                                            setEditTime('');
                                        }}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px' }}
                                    />

                                    {editDate && (
                                        <div style={{ marginTop: '10px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Uygun Saatler:</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '120px', overflowY: 'auto', padding: '5px 0' }}>
                                                {timeSlots.map(time => (
                                                    <button
                                                        key={time}
                                                        onClick={() => setEditTime(time)}
                                                        style={{
                                                            padding: '8px 5px',
                                                            borderRadius: '6px',
                                                            border: editTime === time ? '2px solid #f39c12' : '1px solid #dce8e7',
                                                            backgroundColor: editTime === time ? '#fdf2e9' : '#ffffff',
                                                            color: editTime === time ? '#d35400' : '#2c3e50',
                                                            fontWeight: editTime === time ? 'bold' : 'normal',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Süre (Dakika):</label>
                                        <input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>Doktora İletilecek Not:</label>
                                    <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="Örn: 20lik diş çekimi..."></textarea>
                                </div>

                                {/* erteleme buton */}
                                <button
                                    onClick={async () => {
                                        if (!editDate || !editTime) {
                                            alert("Lütfen yeni bir tarih ve saat seçin!");
                                            return;
                                        }
                                        try {
                                            const newDateTime = `${editDate}T${editTime}:00`;
                                            await updateAppointment(selectedEventModal.id, {
                                                status: 'RESCHEDULED_BY_CLINIC',
                                                appointmentDate: newDateTime,
                                                note: editNote,
                                                duration: Number(editDuration)
                                            });

                                            setAppointments(appointments.map(a => a.id === selectedEventModal.id ? { ...a, status: 'RESCHEDULED_BY_CLINIC', appointmentDate: newDateTime, note: editNote, duration: Number(editDuration) } : a));
                                            setSelectedEventModal(null);
                                            alert("Randevu ertelendi, hastadan onay bekleniyor.");
                                        } catch (error) { alert("Erteleme başarısız!"); }
                                    }}
                                    style={{ width: '100%', padding: '10px', marginBottom: '10px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Tarihi Değiştir ve Hastaya Onaya Gönder
                                </button>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await updateAppointment(selectedEventModal.id, { status: 'APPROVED', note: editNote, duration: Number(editDuration) });
                                                setAppointments(appointments.map(a => a.id === selectedEventModal.id ? { ...a, status: 'APPROVED', note: editNote, duration: Number(editDuration) } : a));
                                                setSelectedEventModal(null);
                                            } catch (error) { alert("Güncelleme başarısız!"); }
                                        }}
                                        style={{ flex: 1, padding: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Onayla
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await updateAppointment(selectedEventModal.id, { status: 'REJECTED' });
                                                setAppointments(appointments.map(a => a.id === selectedEventModal.id ? { ...a, status: 'REJECTED' } : a));
                                                setSelectedEventModal(null);
                                            } catch (error) { alert("İptal başarısız!"); }
                                        }}
                                        style={{ flex: 1, padding: '10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        İptal Et
                                    </button>
                                </div>
                                <button
                                    onClick={() => setSelectedEventModal(null)}
                                    style={{ width: '100%', padding: '10px', marginTop: '10px', background: '#ecf0f1', color: '#7f8c8d', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
}