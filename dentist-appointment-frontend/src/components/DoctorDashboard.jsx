import React from 'react';
import { Calendar } from 'react-big-calendar';

export default function DoctorDashboard(props) {
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
                    {/* doktor takvim */}
                    {activeTab === 'doctor-calendar' && (
                        <div className="calendar-container-centered">
                            <div style={{ marginTop: '20px' }}>
                                <div className="dc-panel-header">
                                    <h3 style={{ color: '#123b3a' }}>Randevu Takvimim</h3>

                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>

                                        <button
                                            onClick={() => {
                                                setActiveTab('patient-history');
                                                setSearchTerm('');
                                                setSelectedPatient(null);
                                                setEditingAppId(null); // Hasta geçmişine geçerken açık kalan not düzenleme state'ini sıfırla
                                            }}
                                            className="dc-action-btn"
                                            style={{ background: 'linear-gradient(135deg, #2a9d8f, #21867a)' }}
                                        >
                                            Hasta Geçmişi İncele
                                        </button>
                                    </div>
                                </div>

                                <div className="dc-panel" style={{ height: '600px' }}>
                                    <Calendar
                                        localizer={localizer}
                                        events={appointments.map(app => ({
                                            id: app.id,
                                            // Başlıkta sadece hastanın adı görünecek
                                            title: `Hasta: ${app.patient?.name || 'Bilinmiyor'} ${app.patient?.surname || ''}${app.note ? ` | Not: ${app.note}` : ''}`,
                                            start: new Date(app.appointmentDate),
                                            end: new Date(new Date(app.appointmentDate).getTime() + (app.duration || 30) * 60000),
                                            originalData: app
                                        }))}
                                        startAccessor="start"
                                        endAccessor="end"
                                        // Sekreterdeki şık renk/stil fonksiyonunu buraya da bağladık
                                        eventPropGetter={eventStyleGetter}
                                        onSelectEvent={(event) => {
                                            const app = event.originalData;
                                            setEditingAppId(app.id);
                                            setEditDuration(app.duration || 30);
                                            setEditNote(app.note || '');
                                            setSelectedEventModal(app); // Doktor ekranında modal açılması için eklendi
                                        }}
                                        messages={{
                                            next: "»",
                                            previous: "«",
                                            today: "Bugün",
                                            month: "Ay",
                                            week: "Hafta",
                                            day: "Gün",
                                            agenda: "Ajanda",
                                            noEventsInRange: "Bu aralıkta randevu bulunmamaktadır."
                                        }}
                                    />
                                </div>
                            </div>

                            {/* DOKTOR İÇİN DETAY MODALI */}
                            {selectedEventModal && activeTab === 'doctor-calendar' && (
                                <div className="dc-modal-overlay">
                                    <div className="dc-modal-box">
                                        <h3 className="dc-modal-title">Randevu Detayları</h3>
                                        <div className="dc-modal-info">
                                            <div><strong>Hasta:</strong> {selectedEventModal.patient?.name} {selectedEventModal.patient?.surname}</div>
                                            <div><strong>Tarih:</strong> {new Date(selectedEventModal.appointmentDate).toLocaleString('tr-TR')}</div>
                                            <div style={{ marginTop: '10px' }}>
                                                <strong>Durum: </strong>
                                                <span className="dc-badge" style={{ backgroundColor: selectedEventModal.status === 'APPROVED' ? '#2a9d8f' : '#e2a63e' }}>
                                                    {selectedEventModal.status === 'APPROVED' ? 'Onaylı' : 'Bekliyor'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#2c4a49' }}>Not (Tedavi Detayı):</label>
                                            <textarea value={editNote} onChange={(e) => setEditNote(e.target.value)} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '9px', border: '1.5px solid #dce8e7', boxSizing: 'border-box' }}></textarea>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await updateAppointment(selectedEventModal.id, { note: editNote });
                                                        setAppointments(appointments.map(a =>
                                                            a.id === selectedEventModal.id ? { ...a, note: editNote } : a
                                                        ));
                                                        setSelectedEventModal(null);
                                                        alert("Not başarıyla güncellendi.");
                                                    } catch (error) {
                                                        alert("Güncelleme başarısız!");
                                                    }
                                                }}
                                                style={{ flex: 1, padding: '11px', background: '#2a9d8f', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                Notu Kaydet
                                            </button>
                                            <button
                                                onClick={() => setSelectedEventModal(null)}
                                                style={{ flex: 1, padding: '11px', background: '#eef3f2', color: '#6c8a89', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                Kapat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                            onClick={() => {
                                                setSelectedPatient(null);
                                                setEditingAppId(null); // Başka hasta ararken düzenleme state'ini sıfırla
                                            }}
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
    );
}
