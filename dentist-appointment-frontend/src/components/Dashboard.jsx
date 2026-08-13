import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';
import SecretaryDashboard from './SecretaryDashboard';
import './styles.css';
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setSelectedEventModal(null);
        setEditingAppId(null);
        setEditingAppId(null);
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
        setSelectedEventModal(null);
        setEditingAppId(null);
        if (activeTab === 'new-appointment' && selectedDoctor && selectedDay) {
            const fetchBookedSlots = async () => {
                try {
                    const allApps = await getAppointments();

                    const booked = allApps
                        .filter(app => {
                            // iptal edilen (REJECTED) randevular saati meşgul etmez
                            if (app.status === 'REJECTED') return false;

                            //sadece seçili günün randevularına bak
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
        // 1. Önce boş alan kontrolü yapıyoruz (Hiçbir şey seçmeden butona basılırsa)
        if (!selectedDoctor || !selectedDay || !selectedTime) {
            alert("Lütfen doktor, tarih ve saat seçiminizi tamamlayınız!");
            return;
        }

        // tarih formatını ve geçmiş tarih olup olmadığını kontrol ediyoruz
        const selectedDateObj = new Date(selectedDay);
        const todayObj = new Date();
        todayObj.setHours(0, 0, 0, 0); // Sadece günleri kıyaslamak için saatleri sıfırla
        selectedDateObj.setHours(0, 0, 0, 0);

        // Eğer tarih geçersizse veya bugünden küçükse durdur
        if (isNaN(selectedDateObj.getTime()) || selectedDateObj < todayObj) {
            alert("Lütfen geçerli veya gelecekteki bir tarih giriniz!");
            return;
        }

        // Çift tıklama (Spam) koruması
        if (isSubmitting) {
            return;
        }

        // Çakışma Kontrolü: Seçilen saat doktor için dolu listesindeyse kaydı engelle
        if (bookedSlots.includes(selectedTime)) {
            alert("Seçtiğiniz saat bu doktor için doludur. Lütfen başka bir saat seçiniz.");
            setSelectedTime(''); // Zamanı sıfırla
            return;
        }

        // 4. Backend İsteği
        try {
            setIsSubmitting(true); // Butonu kilitle

            // Seçilen gün ve saati backend'in istediği LocalDateTime formatına birleştiriyoruz.
            const finalDateTime = `${selectedDay}T${selectedTime}:00`;

            await createAppointment(user.id, selectedDoctor, finalDateTime);

            // Başarılı kayıt sonrası temizlik ve yönlendirme
            alert("Randevunuz başarıyla oluşturuldu!");
            setSelectedDoctor('');
            setSelectedDay('');
            setSelectedTime('');
            setActiveTab('menu');

        } catch (error) {
            console.error("Randevu kaydedilemedi:", error);
            alert("Randevu alınırken bir hata oluştu.");
        } finally {
            setIsSubmitting(false); // İşlem bitince (başarılı veya başarısız) kilidi aç
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

    
    const dashboardProps = {
        user,
        activeTab, setActiveTab,
        appointments, setAppointments,
        doctors,
        selectedDoctor, setSelectedDoctor,
        selectedDay, setSelectedDay,
        selectedTime, setSelectedTime,
        searchTerm, setSearchTerm,
        selectedPatient, setSelectedPatient,
        selectedEventModal, setSelectedEventModal,
        editDate, setEditDate,
        editTime, setEditTime,
        filterPatient, setFilterPatient,
        filterDoctor, setFilterDoctor,
        filterDate, setFilterDate,
        filterNote, setFilterNote,
        bookedSlots,
        showToast, setShowToast,
        pendingCount,
        isSubmitting,
        editingAppId, setEditingAppId,
        editDuration, setEditDuration,
        editNote, setEditNote,
        today, timeSlots,
        handleSaveAppointment,
        updateAppointment,
        eventStyleGetter,
        localizer
    };
return (

        <div className="dc-dashboard">

            

                        {user.role === 'ROLE_PATIENT' && <PatientDashboard {...dashboardProps} />}
            {user.role === 'ROLE_DOCTOR' && <DoctorDashboard {...dashboardProps} />}
            {user.role === 'ROLE_SECRETARY' && <SecretaryDashboard {...dashboardProps} />}
        </div>
    );
}
