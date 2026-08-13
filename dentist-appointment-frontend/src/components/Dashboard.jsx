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
// Giriş yapan kişiye göre ilk açılacak ekranı belirledik.
    const [activeTab, setActiveTab] = useState(
        user.role === 'ROLE_DOCTOR' ? 'doctor-calendar' :
            user.role === 'ROLE_SECRETARY' ? 'secretary-master-calendar' :
                'menu'
    );
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
    const [showToast, setShowToast] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

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
                    } else if (user.role === 'ROLE_SECRETARY') {
                        // sekreter herkesin randevusunu görür.
                        setAppointments(allAppointments);

                        // onay bekleyenleri (PENDING) say ve bildirimi aç
                        const pendingApps = allAppointments.filter(app => app.status === 'PENDING' || app.status === 'RESCHEDULED_BY_CLINIC');
                        if (pendingApps.length > 0) {
                            setPendingCount(pendingApps.length);
                            setShowToast(true); // Bildirimi göster

                            //10 sn
                            setTimeout(() => {
                                setShowToast(false);
                            }, 10000);
                        }
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
        let backgroundColor = '#e2a63e'; // PENDING (Onay Bekliyor - Amber)

        if (event.originalData.status === 'APPROVED') {
            backgroundColor = '#2a9d8f'; // APPROVED (Onaylandı - Teal)
        } else if (event.originalData.status === 'REJECTED') {
            backgroundColor = '#d1665c'; // REJECTED (İptal - Kırmızı)
        }else if (event.originalData.status === 'RESCHEDULED_BY_CLINIC') {
            backgroundColor = '#4a90c4'; // MAVİ (Hastadan onay bekleyen)
        }
        return {
            style: {
                backgroundColor,
                borderRadius: '6px',
                opacity: 0.95,
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
                    color: #123b3a;
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

                .dc-welcome-banner {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 22px 24px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, #f2faf8, #e8f6f3);
                    border: 1.5px solid #dcefeb;
                    margin-bottom: 26px;
                }
                .dc-welcome-icon {
                    width: 54px;
                    height: 54px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #2a9d8f, #21867a);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    box-shadow: 0 8px 18px rgba(42, 157, 143, 0.3);
                }
                .dc-welcome-title {
                    margin: 0 0 4px;
                    font-size: 19px;
                    font-weight: 700;
                    color: #123b3a;
                }
                .dc-welcome-subtitle {
                    margin: 0;
                    font-size: 13.5px;
                    color: #5b7574;
                }

                .dc-card-big {
                    padding: 28px 26px;
                    min-width: 240px;
                }
                .dc-card-title {
                    font-size: 17px;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                .dc-card-desc {
                    font-size: 13px;
                    font-weight: 400;
                    opacity: 0.92;
                    line-height: 1.5;
                    margin-bottom: 18px;
                }
                .dc-card-arrow {
                    font-size: 12.5px;
                    font-weight: 700;
                    opacity: 0.95;
                }

                .dc-info-strip {
                    display: flex;
                    gap: 14px;
                    flex-wrap: wrap;
                    margin-top: 22px;
                }
                .dc-info-tile {
                    flex: 1;
                    min-width: 220px;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                    border-radius: 12px;
                    background: #fbfdfd;
                    border: 1.5px solid #eef3f2;
                }
                .dc-info-tile-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .dc-info-tile-title {
                    font-size: 13px;
                    font-weight: 700;
                    color: #123b3a;
                    margin-bottom: 2px;
                }
                .dc-info-tile-text {
                    font-size: 12px;
                    color: #6c8a89;
                    line-height: 1.4;
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

                .dc-panel {
                    background: #ffffff;
                    padding: 20px;
                    border-radius: 14px;
                    border: 1.5px solid #eef3f2;
                    box-shadow: 0 4px 14px rgba(20, 90, 90, 0.05);
                }
                .dc-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .dc-panel-header h3 {
                    margin: 0;
                    font-size: 17px;
                    font-weight: 700;
                }
                .dc-action-btn {
                    padding: 10px 16px;
                    cursor: pointer;
                    color: white;
                    border: none;
                    border-radius: 9px;
                    font-weight: 600;
                    font-size: 13.5px;
                    box-shadow: 0 8px 16px rgba(20, 90, 90, 0.15);
                    transition: transform 0.15s ease;
                }
                .dc-action-btn:hover { transform: translateY(-1px); }

                .dc-list-item {
                    padding: 16px 18px;
                    border: 1.5px solid #eef3f2;
                    border-radius: 12px;
                    margin-bottom: 14px;
                    background: #fdfefe;
                    box-shadow: 0 2px 8px rgba(20, 90, 90, 0.04);
                }
                .dc-list-item strong { color: #123b3a; }
                .dc-badge {
                    padding: 5px 12px;
                    border-radius: 999px;
                    color: white;
                    font-size: 12.5px;
                    font-weight: 700;
                    letter-spacing: 0.2px;
                }
                .dc-empty-state {
                    padding: 20px;
                    background: #f7fafa;
                    border-radius: 10px;
                    color: #7d9998;
                    border: 1px dashed #d9e6e5;
                }

                .dc-search-input {
                    width: 100%;
                    padding: 12px 14px;
                    border-radius: 10px;
                    border: 1.5px solid #dce8e7;
                    font-size: 14.5px;
                    box-sizing: border-box;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .dc-search-input:focus {
                    outline: none;
                    border-color: #2a9d8f;
                    box-shadow: 0 0 0 4px rgba(42, 157, 143, 0.12);
                }

                .dc-patient-row {
                    padding: 14px 16px;
                    background: #f9fcfb;
                    border: 1.5px solid #e2edec;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background 0.15s ease, border-color 0.15s ease;
                }
                .dc-patient-row:hover {
                    background: #eef7f6;
                    border-color: #bfe0db;
                }

                .dc-history-entry {
                    padding: 16px;
                    border-left: 4px solid #2a9d8f;
                    background: #f9fcfb;
                    border-radius: 0 10px 10px 0;
                }

                .dc-slot-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }
                .dc-slot-btn {
                    padding: 10px;
                    border-radius: 8px;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .dc-steps {
                    display: flex;
                    align-items: center;
                    margin-bottom: 22px;
                    max-width: 420px;
                }
                .dc-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                }
                .dc-step span {
                    font-size: 11.5px;
                    font-weight: 600;
                    color: #9db3b2;
                }
                .dc-step.active span, .dc-step.done span {
                    color: #21867a;
                }
                .dc-step-circle {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 700;
                    background: #eef3f2;
                    color: #9db3b2;
                    border: 2px solid #eef3f2;
                    transition: all 0.2s ease;
                }
                .dc-step.active .dc-step-circle {
                    background: #ffffff;
                    color: #21867a;
                    border-color: #2a9d8f;
                }
                .dc-step.done .dc-step-circle {
                    background: #2a9d8f;
                    color: #ffffff;
                    border-color: #2a9d8f;
                }
                .dc-step-line {
                    flex: 1;
                    height: 2px;
                    background: #eef3f2;
                    margin: 0 8px 20px;
                }
                .dc-step-line.done {
                    background: #2a9d8f;
                }

                .dc-form-box-wide {
                    max-width: 460px;
                }

                .dc-slot-legend {
                    display: flex;
                    gap: 12px;
                }
                .dc-slot-legend span {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11px;
                    color: #6c8a89;
                    font-weight: 500;
                }
                .dc-slot-legend i {
                    width: 10px;
                    height: 10px;
                    border-radius: 3px;
                    display: inline-block;
                }

                .dc-summary-box {
                    background: #f2faf8;
                    border: 1.5px solid #cfe9e3;
                    border-radius: 12px;
                    padding: 16px 18px;
                }
                .dc-summary-title {
                    font-size: 12.5px;
                    font-weight: 700;
                    color: #21867a;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.4px;
                }
                .dc-summary-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 0;
                    font-size: 13.5px;
                }
                .dc-summary-row span {
                    color: #5b7574;
                }
                .dc-summary-row strong {
                    color: #123b3a;
                }

                .dc-filter-bar {
                    background: #f7fafa;
                    padding: 16px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    border: 1.5px solid #e2edec;
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    align-items: flex-end;
                }
                .dc-filter-field { flex: 1; min-width: 150px; }
                .dc-filter-field label {
                    display: block;
                    font-size: 12px;
                    font-weight: 700;
                    color: #2c4a49;
                    margin-bottom: 5px;
                }
                .dc-filter-field input {
                    width: 100%;
                    padding: 10px;
                    border-radius: 7px;
                    border: 1.5px solid #dce8e7;
                    box-sizing: border-box;
                }
                .dc-filter-clear {
                    padding: 10px 16px;
                    background: #7d9998;
                    color: white;
                    border: none;
                    border-radius: 7px;
                    cursor: pointer;
                    font-weight: 600;
                    height: 40px;
                }

                .dc-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(18, 59, 58, 0.55);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 16px;
                    box-sizing: border-box;
                }
                .dc-modal-box {
                    background: white;
                    padding: 28px;
                    border-radius: 16px;
                    width: 100%;
                    max-width: 450px;
                    box-shadow: 0 20px 45px rgba(0,0,0,0.25);
                }
                .dc-modal-title {
                    margin-top: 0;
                    color: #21867a;
                    border-bottom: 2px solid #e2edec;
                    padding-bottom: 12px;
                    font-size: 17px;
                }
                .dc-modal-info {
                    margin: 15px 0;
                    font-size: 14px;
                    color: #2c4a49;
                    background: #f9fcfb;
                    padding: 15px;
                    border-radius: 10px;
                    line-height: 1.7;
                }
                .dc-modal-primary-btn {
                    width: 100%;
                    padding: 12px;
                    margin-bottom: 10px;
                    color: white;
                    border: none;
                    border-radius: 9px;
                    cursor: pointer;
                    font-weight: 700;
                }
                .dc-modal-close-btn {
                    width: 100%;
                    padding: 10px;
                    margin-top: 10px;
                    background: #eef3f2;
                    color: #6c8a89;
                    border: none;
                    border-radius: 9px;
                    cursor: pointer;
                    font-weight: 600;
                }

                .dc-toast {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    background: #ffffff;
                    border: 1.5px solid #e2edec;
                    box-shadow: 0 15px 35px rgba(20, 90, 90, 0.18);
                    padding: 16px 20px;
                    border-radius: 12px;
                    z-index: 9999;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    max-width: 350px;
                    animation: dc-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes dc-slide-in {
                    from { transform: translateX(30px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>

            {/*hasta ekranı*/}
            {user.role === 'ROLE_PATIENT' && (
                <div>
                    {/* hasta icin ertelemenme bildirimi */}
                    {appointments.filter(app => app.status === 'RESCHEDULED_BY_CLINIC').map(rescheduledApp => (
                        <div key={rescheduledApp.id} className="dc-modal-overlay">
                            <div className="dc-modal-box" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '38px', marginBottom: '10px' }}>⚠️</div>
                                <h3 style={{ color: '#c17a1f', marginTop: 0 }}>Randevu Saatiniz Değiştirildi</h3>
                                <p style={{ color: '#3c5352', fontSize: '15px', lineHeight: '1.5' }}>
                                    Klinik tarafından <strong>Dr. {rescheduledApp.doctor?.name} {rescheduledApp.doctor?.surname}</strong> ile olan randevunuz yeni bir saate alındı.
                                </p>
                                <div style={{ margin: '20px 0', padding: '15px', background: '#fdf2e2', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', color: '#c17a1f' }}>
                                    Yeni Tarih: <br/>{new Date(rescheduledApp.appointmentDate).toLocaleString('tr-TR')}
                                </div>
                                <p style={{ color: '#6c8a89', fontSize: '13px', marginBottom: '20px' }}>Bu yeni saati onaylıyor musunuz?</p>

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
                                        style={{ flex: 1, padding: '12px', background: '#2a9d8f', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: 'bold' }}
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
                                        style={{ flex: 1, padding: '12px', background: '#d1665c', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: 'bold' }}
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
                            <div className="dc-welcome-banner">
                                <div className="dc-welcome-icon">
                                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M12 3c-2.2 0-3.5 1.3-4.8 1.3-1.5 0-2.7-1-2.7 1.7 0 3.4 1 6.8 1.6 9.1.4 1.6.8 3.4 2 3.4 1.5 0 1.4-3.2 1.9-5 .3-1 .5-1.8 1.4-1.8s1.1.8 1.4 1.8c.5 1.8.4 5 1.9 5 1.2 0 1.6-1.8 2-3.4.6-2.3 1.6-5.7 1.6-9.1 0-2.7-1.2-1.7-2.7-1.7C15.5 4.3 14.2 3 12 3z"
                                            fill="#ffffff"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="dc-welcome-title">Hoş Geldiniz{user?.name ? `, ${user.name}` : ''}</h2>
                                    <p className="dc-welcome-subtitle">Diş sağlığınızla ilgili işlemlerinizi buradan kolayca yönetebilirsiniz.</p>
                                </div>
                            </div>

                            <h3 className="dc-section-title">
                                <span className="dc-section-dot" style={{ background: '#2a9d8f' }} />
                                Hasta İşlemleri
                            </h3>
                            <div className="dc-card-grid">
                                <div
                                    className="dc-card dc-card-big"
                                    style={{ background: 'linear-gradient(135deg, #2a9d8f, #21867a)' }}
                                    onClick={() => setActiveTab('new-appointment')}
                                >
                                    <div className="dc-card-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                            <line x1="12" y1="14" x2="12" y2="18" />
                                            <line x1="10" y1="16" x2="14" y2="16" />
                                        </svg>
                                    </div>
                                    <div className="dc-card-title">Yeni Randevu Al</div>
                                    <div className="dc-card-desc">Uygun doktor ve saati seçerek birkaç adımda randevunuzu oluşturun.</div>
                                    <div className="dc-card-arrow">Devam Et &rarr;</div>
                                </div>

                                <div
                                    className="dc-card dc-card-big"
                                    style={{ background: 'linear-gradient(135deg, #3fb6a8, #2a9d8f)' }}
                                    onClick={() => setActiveTab('my-appointments')}
                                >
                                    <div className="dc-card-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="9" />
                                            <polyline points="12 7 12 12 15 14" />
                                        </svg>
                                    </div>
                                    <div className="dc-card-title">Randevularım</div>
                                    <div className="dc-card-desc">Geçmiş ve bekleyen randevularınızın durumunu görüntüleyin.</div>
                                    <div className="dc-card-arrow">Görüntüle &rarr;</div>
                                </div>
                            </div>

                            <div className="dc-info-strip">
                                <div className="dc-info-tile">
                                    <div className="dc-info-tile-icon" style={{ background: '#e8f6f3', color: '#21867a' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="9" />
                                            <polyline points="12 7 12 12 15 14" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="dc-info-tile-title">Çalışma Saatleri</div>
                                        <div className="dc-info-tile-text">Hafta içi 09:00 - 18:00</div>
                                    </div>
                                </div>
                                <div className="dc-info-tile">
                                    <div className="dc-info-tile-icon" style={{ background: '#fdf2e2', color: '#c17a1f' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="dc-info-tile-title">Hatırlatmalar</div>
                                        <div className="dc-info-tile-text">Randevu değişikliklerinden anında haberdar olun</div>
                                    </div>
                                </div>
                                <div className="dc-info-tile">
                                    <div className="dc-info-tile-icon" style={{ background: '#eef0fb', color: '#5f4483' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="dc-info-tile-title">Uzman Kadro</div>
                                        <div className="dc-info-tile-text">Alanında deneyimli doktorlarımızla hizmetinizdeyiz</div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* kullanıcının randevuları*/}
                    {activeTab === 'my-appointments' && (
                        <div>
                            <button
                                className="dc-back-btn"
                                onClick={() => setActiveTab('menu')}
                            >
                                &larr; Geri Dön
                            </button>

                            <h3 className="dc-form-title">Geçmiş Randevularım</h3>

                            {appointments.length === 0 ? (
                                <div className="dc-empty-state">
                                    Henüz alınmış bir randevunuz bulunmamaktadır.
                                </div>
                            ) : (
                                <ul style={{ listStyleType: 'none', padding: 0 }}>
                                    {[...appointments].sort((a, b) => {
                                        const getWeight = (status) => (status === 'PENDING' || status === 'RESCHEDULED_BY_CLINIC') ? 1 : (status === 'APPROVED' ? 2 : 3);

                                        //  Önce duruma göre sırala (Onay bekleyenler en üste)
                                        if (getWeight(a.status) !== getWeight(b.status)) {
                                            return getWeight(a.status) - getWeight(b.status);
                                        }

                                        //  Durumları aynıysa, en yakın tarihten en uzak tarihe (kronolojik) sırala
                                        return new Date(a.appointmentDate) - new Date(b.appointmentDate);
                                    }).map(app => (
                                        <li key={app.id} className="dc-list-item">
                                            <div style={{ fontSize: '15.5px', marginBottom: '8px' }}>
                                                <strong>Doktor:</strong> Dr. {app.doctor?.name} {app.doctor?.surname}
                                            </div>
                                            <div style={{ fontSize: '14px', marginBottom: '8px', color: '#5b7574' }}>
                                                <strong>Tarih:</strong> {new Date(app.appointmentDate).toLocaleString('tr-TR')}
                                            </div>
                                            <div style={{ fontSize: '14px' }}>
                                                <strong>Durum:</strong>
                                                <span className="dc-badge" style={{
                                                    marginLeft: '10px',
                                                    backgroundColor: app.status === 'APPROVED' ? '#2a9d8f' : (app.status === 'REJECTED' ? '#d1665c' : '#e2a63e')
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
                        <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
                            <button
                                className="dc-back-btn"
                                onClick={() => setActiveTab('menu')}
                            >
                                &larr; Geri Dön
                            </button>

                            <h3 className="dc-form-title">Yeni Randevu Oluştur</h3>
                            <p className="dc-form-subtitle">Lütfen doktor ve uygun tarih seçin</p>

                            {/* adım göstergesi */}
                            <div className="dc-steps">
                                <div className={`dc-step ${selectedDoctor ? 'done' : 'active'}`}>
                                    <div className="dc-step-circle">{selectedDoctor ? '✓' : '1'}</div>
                                    <span>Doktor</span>
                                </div>
                                <div className={`dc-step-line ${selectedDoctor ? 'done' : ''}`} />
                                <div className={`dc-step ${selectedDay ? 'done' : (selectedDoctor ? 'active' : '')}`}>
                                    <div className="dc-step-circle">{selectedDay ? '✓' : '2'}</div>
                                    <span>Tarih</span>
                                </div>
                                <div className={`dc-step-line ${selectedDay ? 'done' : ''}`} />
                                <div className={`dc-step ${selectedTime ? 'done' : (selectedDay ? 'active' : '')}`}>
                                    <div className="dc-step-circle">{selectedTime ? '✓' : '3'}</div>
                                    <span>Saat</span>
                                </div>
                            </div>

                            <div className="dc-form-box dc-form-box-wide">
                                <div className="dc-form-field">
                                    <label>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2a9d8f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: '-2px' }}>
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                        Doktor Seçin
                                    </label>
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
                                    <label>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2a9d8f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: '-2px' }}>
                                            <rect x="3" y="4" width="18" height="18" rx="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        Tarih Seçin
                                    </label>
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <label style={{ margin: 0 }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2a9d8f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: '-2px' }}>
                                                    <circle cx="12" cy="12" r="9" />
                                                    <polyline points="12 7 12 12 15 14" />
                                                </svg>
                                                Uygun Saatler
                                            </label>
                                            <div className="dc-slot-legend">
                                                <span><i style={{ background: '#ffffff', border: '1px solid #dce8e7' }} />Boş</span>
                                                <span><i style={{ background: '#e8f6f3', border: '1px solid #2a9d8f' }} />Seçili</span>
                                                <span><i style={{ background: '#f2f4f4', border: '1px solid #e2e6e5' }} />Dolu</span>
                                            </div>
                                        </div>
                                        <div className="dc-slot-grid">
                                            {timeSlots.map(time => {
                                                const isBooked = bookedSlots.includes(time); // Saat dolu mu kontrolü

                                                return (
                                                    <button
                                                        key={time}
                                                        disabled={isBooked} // Doluysa butonu tıklanamaz yap
                                                        onClick={() => setSelectedTime(time)}
                                                        className="dc-slot-btn"
                                                        style={{
                                                            border: selectedTime === time ? '2px solid #2a9d8f' : '1px solid #dce8e7',

                                                            // Doluysa gri, seçiliyse yeşil, boşsa beyaz:
                                                            backgroundColor: isBooked ? '#f2f4f4' : (selectedTime === time ? '#e8f6f3' : '#ffffff'),
                                                            color: isBooked ? '#bcc9c8' : (selectedTime === time ? '#21867a' : '#2c4a49'),

                                                            fontWeight: selectedTime === time ? 'bold' : 'normal',
                                                            cursor: isBooked ? 'not-allowed' : 'pointer', // Doluysa imleç yasak işareti olur
                                                            textDecoration: isBooked ? 'line-through' : 'none', // Doluysa üstünü çiz
                                                        }}
                                                    >
                                                        {time}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* seçim özeti */}
                                {(selectedDoctor || selectedDay || selectedTime) && (
                                    <div className="dc-summary-box">
                                        <div className="dc-summary-title">Randevu Özeti</div>
                                        <div className="dc-summary-row">
                                            <span>Doktor</span>
                                            <strong>{selectedDoctor ? (() => {
                                                const d = doctors.find(doc => String(doc.id) === String(selectedDoctor));
                                                return d ? `Dr. ${d.name} ${d.surname}` : '—';
                                            })() : '—'}</strong>
                                        </div>
                                        <div className="dc-summary-row">
                                            <span>Tarih</span>
                                            <strong>{selectedDay || '—'}</strong>
                                        </div>
                                        <div className="dc-summary-row">
                                            <span>Saat</span>
                                            <strong>{selectedTime || '—'}</strong>
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
                    {/* doktor takvim */}
                    {activeTab === 'doctor-calendar' && (
                        <div style={{ marginTop: '20px' }}>
                            <div className="dc-panel-header">
                                <h3 style={{ color: '#123b3a' }}>Randevu Takvimim</h3>
                                <button
                                    onClick={() => {
                                        setActiveTab('patient-history');
                                        setSearchTerm('');
                                        setSelectedPatient(null);
                                    }}
                                    className="dc-action-btn"
                                    style={{ background: 'linear-gradient(135deg, #2a9d8f, #21867a)' }}
                                >
                                    Hasta Geçmişi İncele
                                </button>
                            </div>

                            <div className="dc-panel" style={{ height: '550px' }}>
                                <Calendar
                                    localizer={localizer}
                                    events={appointments.map(app => ({
                                        id: app.id,
                                        title: `${app.patient?.name || 'Bilinmiyor'} ${app.patient?.surname || ''}`,
                                        start: new Date(app.appointmentDate),
                                        end: new Date(new Date(app.appointmentDate).getTime() + (app.duration || 30) * 60000),
                                        tooltipDetails: `Süre: ${app.duration || 30} Dakika`,
                                        originalData: app
                                    }))}
                                    startAccessor="start"
                                    endAccessor="end"
                                    tooltipAccessor="tooltipDetails"
                                    eventPropGetter={(event) => {
                                        return { style: { backgroundColor: '#bfe0db', border: 'none', borderRadius: '6px', color: '#123b3a', display: 'block', padding: '0', boxShadow: 'none' } };
                                    }}
                                    components={{
                                        event: ({ event }) => (
                                            <div style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    Hasta : {event.title}
                                                </div>
                                                {event.originalData.note && (
                                                    <div style={{ fontSize: '12px', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.85 }}>{event.originalData.note}</div>
                                                )}
                                            </div>
                                        )
                                    }}
                                    onSelectEvent={(event) => {
                                        const app = event.originalData;
                                        setEditingAppId(app.id);
                                        setEditDuration(app.duration || 30);
                                        setEditNote(app.note || '');
                                        setSelectedEventModal(app);
                                    }}
                                    messages={{ next: "»", previous: "«", today: "Bugün", month: "Ay", week: "Hafta", day: "Gün", agenda: "Ajanda", noEventsInRange: "Bu aralıkta randevu bulunmamaktadır." }}
                                />
                            </div>
                        </div>
                    )}

                    {/*hasta geçmiş/arama */}
                    {activeTab === 'patient-history' && (
                        <div style={{ marginTop: '20px' }}>
                            <button
                                className="dc-back-btn"
                                onClick={() => setActiveTab('doctor-calendar')}
                            >
                                &larr; Takvime Dön
                            </button>
                            <h3 className="dc-form-title" style={{ marginBottom: '20px' }}>Hasta Geçmişi İnceleme</h3>

                            {/* arama ekranı */}
                            {!selectedPatient ? (
                                <div className="dc-panel">
                                    <input
                                        type="text"
                                        placeholder="🔍 Hasta adı veya soyadı ile ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="dc-search-input"
                                        style={{ marginBottom: '20px' }}
                                    />

                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {Array.from(new Map(appointments.filter(app => app.patient).map(app => [app.patient.id, app.patient])).values())
                                            .filter(p => `${p.name} ${p.surname}`.toLowerCase().includes(searchTerm.toLowerCase()))
                                            .map(patient => (
                                                <div
                                                    key={patient.id}
                                                    onClick={() => setSelectedPatient(patient)}
                                                    className="dc-patient-row"
                                                >
                                                    <strong>{patient.name} {patient.surname}</strong>
                                                    <span style={{ color: '#21867a', fontSize: '13px', fontWeight: 'bold' }}>Geçmişi Gör &rarr;</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            ) : (
                                /* hasta seçildiyse geçmişi göster */
                                <div className="dc-panel">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #e2edec', paddingBottom: '10px' }}>
                                        <h4 style={{ color: '#123b3a', margin: 0 }}>{selectedPatient.name} {selectedPatient.surname} - Tedavi Geçmişi</h4>
                                        <button
                                            onClick={() => setSelectedPatient(null)}
                                            style={{ padding: '7px 14px', background: '#d1665c', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                        >
                                            Başka Hasta Ara
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {appointments
                                            .filter(app => app.patient && app.patient.id === selectedPatient.id)
                                            .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
                                            .map(app => (
                                                <div key={app.id} className="dc-history-entry">
                                                    <div style={{ marginBottom: '8px', color: '#5b7574', fontSize: '13px' }}>
                                                        <strong>Tarih:</strong> {new Date(app.appointmentDate).toLocaleString('tr-TR')}
                                                    </div>
                                                    <div style={{ fontSize: '15px', color: '#123b3a' }}>
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
                                                                style={{ flex: 1, padding: '9px', borderRadius: '7px', border: '1.5px solid #dce8e7' }}
                                                            />
                                                            <button
                                                                style={{ padding: '9px 16px', background: '#2a9d8f', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: 600 }}
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
                                                                style={{ padding: '9px 16px', background: '#9db3b2', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: 600 }}
                                                                onClick={() => setEditingAppId(null)}
                                                            >
                                                                İptal
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            style={{ marginTop: '10px', padding: '7px 14px', background: '#21867a', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
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
                    {/*klinik takvim (ANA EKRAN) */}
                    {activeTab === 'secretary-master-calendar' && (
                        <div style={{ marginTop: '20px' }}>
                            <div className="dc-panel-header">
                                <h3 style={{ color: '#123b3a' }}>Genel Klinik Takvimi</h3>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', gap: '15px', fontSize: '12.5px', fontWeight: 700 }}>
                                        <span style={{ color: '#c17a1f' }}>● Sizden Onay Bekleyenler</span>
                                        <span style={{ color: '#2a9d8f' }}>● Onaylananlar</span>
                                        <span style={{ color: '#4a90c4' }}>● Hastadan Onay Bekleyenler</span>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('secretary-appointments')}
                                        className="dc-action-btn"
                                        style={{ background: 'linear-gradient(135deg, #7c5ba6, #5f4483)' }}
                                    >
                                        Hastaların Listesi
                                    </button>
                                </div>
                            </div>

                            <div className="dc-panel" style={{ height: '600px' }}>
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
                                    messages={{ next: "»", previous: "«", today: "Bugün", month: "Ay", week: "Hafta", day: "Gün" }}
                                />
                            </div>
                        </div>
                    )}

                    {/* liste görünüm */}
                    {activeTab === 'secretary-appointments' && (
                        <div>
                            <button
                                className="dc-back-btn"
                                onClick={() => {
                                    setActiveTab('secretary-master-calendar');
                                    setFilterPatient('');
                                    setFilterDoctor('');
                                    setFilterDate('');
                                    setFilterNote('');
                                }}
                            >
                                &larr; Takvime Dön
                            </button>

                            <h3 className="dc-form-title" style={{ marginBottom: '15px' }}>Klinik Randevu Listesi</h3>

                            {/* arama çubuğu */}
                            <div className="dc-filter-bar">
                                <div className="dc-filter-field">
                                    <label>Hasta Adı</label>
                                    <input type="text" placeholder="Hasta ara..." value={filterPatient} onChange={e => setFilterPatient(e.target.value)} />
                                </div>
                                <div className="dc-filter-field">
                                    <label>Doktor Adı</label>
                                    <input type="text" placeholder="Doktor ara..." value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)} />
                                </div>
                                <div className="dc-filter-field">
                                    <label>Tarih</label>
                                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                                </div>
                                <div className="dc-filter-field">
                                    <label>Açıklama</label>
                                    <input type="text" placeholder="Açıklama ara..." value={filterNote} onChange={e => setFilterNote(e.target.value)} />
                                </div>
                                <button
                                    onClick={() => { setFilterPatient(''); setFilterDoctor(''); setFilterDate(''); setFilterNote(''); }}
                                    className="dc-filter-clear"
                                >
                                    Temizle
                                </button>
                            </div>

                            {/* filterlenmiş randevular */}
                            {(() => {
                                // Arama kutusuna göre filtreleme VE sıralama işlemi
                                const filteredApps = appointments.filter(app => {
                                    const matchPatient = !filterPatient || `${app.patient?.name} ${app.patient?.surname}`.toLowerCase().includes(filterPatient.toLowerCase());
                                    const matchDoctor = !filterDoctor || `${app.doctor?.name} ${app.doctor?.surname}`.toLowerCase().includes(filterDoctor.toLowerCase());
                                    const matchNote = !filterNote || (app.note && app.note.toLowerCase().includes(filterNote.toLowerCase()));

                                    const appDateObj = new Date(app.appointmentDate);
                                    const yyyy = appDateObj.getFullYear();
                                    const mm = String(appDateObj.getMonth() + 1).padStart(2, '0');
                                    const dd = String(appDateObj.getDate()).padStart(2, '0');
                                    const appDateStr = `${yyyy}-${mm}-${dd}`;

                                    const matchDate = !filterDate || appDateStr === filterDate;
                                    return matchPatient && matchDoctor && matchDate && matchNote;
                                }).sort((a, b) => {
                                    const getWeight = (status) => (status === 'PENDING' || status === 'RESCHEDULED_BY_CLINIC') ? 1 : (status === 'APPROVED' ? 2 : 3);

                                    //  Önce duruma göre sırala (Onay bekleyenler en üste)
                                    if (getWeight(a.status) !== getWeight(b.status)) {
                                        return getWeight(a.status) - getWeight(b.status);
                                    }

                                    //  Durumları aynıysa, en yakın tarihten en uzak tarihe (kronolojik) sırala
                                    return new Date(a.appointmentDate) - new Date(b.appointmentDate);
                                })

                                if (appointments.length === 0) {
                                    return <div className="dc-empty-state">Sistemde kayıtlı randevu bulunmamaktadır.</div>;
                                }

                                if (filteredApps.length === 0) {
                                    return <div style={{ padding: '20px', background: '#fdf2e2', borderRadius: '10px', color: '#c17a1f', border: '1px dashed #e6bd7a' }}>⚠️ Arama kriterlerinize uygun randevu bulunamadı.</div>;
                                }

                                return (
                                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                                        {filteredApps.map(app => (
                                            <li key={app.id} className="dc-list-item">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '15.5px', marginBottom: '8px' }}>
                                                            <strong>Hasta:</strong> {app.patient?.name} {app.patient?.surname} <br/>
                                                            <strong>Doktor:</strong> Dr. {app.doctor?.name} {app.doctor?.surname}
                                                        </div>
                                                        <div style={{ fontSize: '14px', marginBottom: '8px', color: '#5b7574' }}>
                                                            <strong>Tarih:</strong> {new Date(app.appointmentDate).toLocaleString('tr-TR')}
                                                            {app.duration && <span style={{ marginLeft: '10px' }}>{app.duration} Dk</span>}
                                                        </div>
                                                        <div style={{ fontSize: '14px', color: '#3c5352', fontStyle: 'italic', marginBottom: '10px' }}>
                                                            {app.note && `Not: ${app.note}`}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                        <span className="dc-badge" style={{ backgroundColor: app.status === 'APPROVED' ? '#2a9d8f' : (app.status === 'REJECTED' ? '#d1665c' : (app.status === 'RESCHEDULED_BY_CLINIC' ? '#4a90c4' : '#e2a63e')) }}>
                                                            {app.status === 'APPROVED' ? 'Onaylandı' : (app.status === 'REJECTED' ? 'Reddedildi' : (app.status === 'RESCHEDULED_BY_CLINIC' ? 'Hastadan Onay Bekliyor' : 'Onay Bekliyor'))}
                                                        </span>

                                                        {app.status === 'PENDING' && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingAppId(app.id);
                                                                    setEditDuration(app.duration || 30);
                                                                    setEditNote(app.note || '');

                                                                    const appDateObj = new Date(app.appointmentDate);
                                                                    const yyyy = appDateObj.getFullYear();
                                                                    const mm = String(appDateObj.getMonth() + 1).padStart(2, '0');
                                                                    const dd = String(appDateObj.getDate()).padStart(2, '0');
                                                                    const hh = String(appDateObj.getHours()).padStart(2, '0');
                                                                    const min = String(appDateObj.getMinutes()).padStart(2, '0');

                                                                    setEditDate(`${yyyy}-${mm}-${dd}`);
                                                                    setEditTime(`${hh}:${min}`);

                                                                    setSelectedEventModal(app);
                                                                }}
                                                                style={{ padding: '7px 14px', background: '#4a90c4', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                                                            >
                                                                Düzenle
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>

                                );
                            })()}
                        </div>
                    )}

                    {/* SEKRETER ONAY MODALI (POP-UP) */}
                    {selectedEventModal && (activeTab === 'secretary-master-calendar' || activeTab === 'secretary-appointments') && (
                        <div className="dc-modal-overlay">
                            <div className="dc-modal-box">
                                <h3 className="dc-modal-title">⚙️ Randevu Yönetimi</h3>

                                <div className="dc-modal-info">
                                    <div><strong>Doktor:</strong> Dr. {selectedEventModal.doctor?.name} {selectedEventModal.doctor?.surname}</div>
                                    <div><strong>Hasta:</strong> {selectedEventModal.patient?.name} {selectedEventModal.patient?.surname}</div>
                                    <div><strong>Mevcut Tarih:</strong> {new Date(selectedEventModal.appointmentDate).toLocaleString('tr-TR')}</div>
                                    <div style={{ marginTop: '10px' }}>
                                        <strong>Durum: </strong>
                                        <span className="dc-badge" style={{ backgroundColor: selectedEventModal.status === 'APPROVED' ? '#2a9d8f' : (selectedEventModal.status === 'REJECTED' ? '#d1665c' : (selectedEventModal.status === 'RESCHEDULED_BY_CLINIC' ? '#4a90c4' : '#e2a63e')) }}>
                                            {selectedEventModal.status === 'APPROVED' ? 'Onaylı' : (selectedEventModal.status === 'REJECTED' ? 'İptal' : (selectedEventModal.status === 'RESCHEDULED_BY_CLINIC' ? 'Hastadan Onay Bekliyor' : 'Onay Bekliyor'))}
                                        </span>
                                    </div>
                                </div>

                                {/* tarih - saat  */}
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#2c4a49' }}>Yeni Tarih Seçin:</label>
                                    <input
                                        type="date"
                                        min={today}
                                        value={editDate}
                                        onChange={(e) => {
                                            setEditDate(e.target.value);
                                            setEditTime('');
                                        }}
                                        style={{ width: '100%', padding: '10px', borderRadius: '9px', border: '1.5px solid #dce8e7', marginBottom: '10px', boxSizing: 'border-box' }}
                                    />

                                    {editDate && (
                                        <div style={{ marginTop: '10px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#2c4a49' }}>Uygun Saatler:</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', maxHeight: '120px', overflowY: 'auto', padding: '5px 0' }}>
                                                {timeSlots.map(time => (
                                                    <button
                                                        key={time}
                                                        onClick={() => setEditTime(time)}
                                                        style={{
                                                            padding: '8px 5px',
                                                            borderRadius: '7px',
                                                            border: editTime === time ? '2px solid #e2a63e' : '1px solid #dce8e7',
                                                            backgroundColor: editTime === time ? '#fdf2e2' : '#ffffff',
                                                            color: editTime === time ? '#c17a1f' : '#2c4a49',
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
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#2c4a49' }}>Süre (Dakika):</label>
                                        <input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '9px', border: '1.5px solid #dce8e7', boxSizing: 'border-box' }} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#2c4a49' }}>Doktora İletilecek Not:</label>
                                    <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows="2" style={{ width: '100%', padding: '10px', borderRadius: '9px', border: '1.5px solid #dce8e7', boxSizing: 'border-box', fontFamily: 'inherit' }} placeholder="Örn: 20lik diş çekimi..."></textarea>
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

                                            // State'i anında güncelle
                                            setAppointments(appointments.map(a =>
                                                a.id === selectedEventModal.id
                                                    ? { ...a, status: 'RESCHEDULED_BY_CLINIC', appointmentDate: newDateTime, note: editNote, duration: Number(editDuration) }
                                                    : a
                                            ));

                                            setSelectedEventModal(null);
                                            alert("Randevu ertelendi, hastadan onay bekleniyor.");
                                        } catch (error) {
                                            alert("Erteleme başarısız!");
                                        }

                                    }}
                                    className="dc-modal-primary-btn"
                                    style={{ background: '#e2a63e' }}
                                >
                                    Tarihi Değiştir ve Hastaya Onaya Gönder
                                </button>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await updateAppointment(selectedEventModal.id, {
                                                    status: 'APPROVED',
                                                    note: editNote,
                                                    duration: Number(editDuration)
                                                });

                                                //  State'i anında güncelle (Optimistic / Local Update)
                                                setAppointments(appointments.map(a =>
                                                    a.id === selectedEventModal.id
                                                        ? { ...a, status: 'APPROVED', note: editNote, duration: Number(editDuration) }
                                                        : a
                                                ));

                                                //modalı güvenle kapatma  hafızayı temizle
                                                setSelectedEventModal(null);
                                            } catch (error) {
                                                alert("Güncelleme başarısız!");
                                            }

                                        }}
                                        style={{ flex: 1, padding: '11px', background: '#2a9d8f', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Onayla
                                    </button>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await updateAppointment(selectedEventModal.id, { status: 'REJECTED' });

                                                // State'i anında güncelle
                                                setAppointments(appointments.map(a =>
                                                    a.id === selectedEventModal.id ? { ...a, status: 'REJECTED' } : a
                                                ));

                                                setSelectedEventModal(null);
                                            } catch (error) {
                                                alert("İptal başarısız!");
                                            }

                                        }}
                                        style={{ flex: 1, padding: '11px', background: '#d1665c', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        İptal Et
                                    </button>
                                </div>
                                <button
                                    onClick={() => setSelectedEventModal(null)}
                                    className="dc-modal-close-btn"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    )}

                    {showToast && user.role === 'ROLE_SECRETARY' && (
                        <div className="dc-toast">
                            <div style={{ backgroundColor: '#fdf2e2', color: '#c17a1f', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, fontSize: '18px' }}>•</div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 5px 0', color: '#123b3a', fontSize: '14px', fontWeight: '600' }}>Onay Bekleyen Randevular</h4>
                                <p style={{ margin: 0, color: '#6c8a89', fontSize: '13px', lineHeight: '1.4' }}>Sistemde işlem yapmanızı bekleyen <strong>{pendingCount} adet</strong> yeni randevu talebi bulunuyor.</p>
                            </div>
                            <button onClick={() => setShowToast(false)} style={{ background: 'transparent', border: 'none', color: '#9db3b2', cursor: 'pointer', padding: '0', fontSize: '18px', lineHeight: '1', display: 'flex', alignItems: 'center' }}>&times;</button>
                        </div>
                    )}

                </div>
            )}

        </div>
    );
}