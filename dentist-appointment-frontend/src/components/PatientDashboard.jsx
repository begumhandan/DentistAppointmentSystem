import React from 'react';
import { Calendar } from 'react-big-calendar';

export default function PatientDashboard(props) {
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
                                        onChange={(e) => {
                                            setSelectedDoctor(e.target.value);
                                            setSelectedTime(''); // Doktor değiştiğinde çakışmayı önlemek için saati sıfırla
                                        }}
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
                                        onChange={(e) => {
                                            setSelectedDay(e.target.value); // Yeni tarihi kaydet
                                            setSelectedTime(''); // Günü değiştirdiği an, seçili saati temizlesin
                                        }}
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
                                    disabled={isSubmitting}
                                    style={{
                                        opacity: isSubmitting ? 0.6 : 1,
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isSubmitting ? 'Oluşturuluyor...' : 'Randevuyu Onayla'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
    );
}
