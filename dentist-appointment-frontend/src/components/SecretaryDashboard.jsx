import React from 'react';
import { Calendar } from 'react-big-calendar';

export default function SecretaryDashboard(props) {
    const {
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
    } = props;

    return (
        <div>
                <div>
                    {/*klinik takvim (ANA EKRAN) */}
                    {activeTab === 'secretary-master-calendar' && (
                        <div className="calendar-container-centered">
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
                                <h3 className="dc-modal-title">Randevu Yönetimi</h3>

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
                                            setEditDate(e.target.value); //yeni tarihi kaydet
                                            setEditTime(''); // tarih değiştiği an eski saati sıfırlasın
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
                                        // 1. Boş alan kontrolü
                                        if (!editDate || !editTime) {
                                            alert("Lütfen yeni bir tarih ve saat seçin!");
                                            return;
                                        }

                                        // 2. Elle girilen geçmiş tarih kontrolü
                                        const selectedDateObj = new Date(editDate);
                                        const todayObj = new Date();
                                        todayObj.setHours(0, 0, 0, 0); // Saatleri sıfırla, sadece günü kıyasla
                                        selectedDateObj.setHours(0, 0, 0, 0);

                                        if (isNaN(selectedDateObj.getTime()) || selectedDateObj < todayObj) {
                                            alert("Lütfen geçerli veya gelecekteki bir tarih giriniz!");
                                            return;
                                        }

                                        // 3. Backend'e kaydetme işlemi
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
        </div>
    );
}
