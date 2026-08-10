import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, User, CheckCircle2, XCircle, CalendarClock, Text, Trash2 } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'SCHEDULED':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = () => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1.5"/>;
      case 'CANCELLED':
        return <XCircle className="w-3.5 h-3.5 mr-1.5"/>;
      case 'SCHEDULED':
      default:
        return <CalendarClock className="w-3.5 h-3.5 mr-1.5"/>;
    }
  };

  return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {getStatusIcon()}
        {status || 'SCHEDULED'}
    </span>
  );
};


const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8080/api/appointments')
        .then((response) => {
          setAppointments(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Veriler çekilirken hata:", error);
          setLoading(false);
        });
  }, []);

  // Silme
  const handleDelete = async (id) => {
    if (!window.confirm("Bu randevuyu silmek istediğinize emin misiniz?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/appointments/${id}`);
      setAppointments((prevApts) => prevApts.filter(apt => apt.id !== id));
    } catch (error) {
      console.error("Hata:", error);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;

  if (appointments.length === 0) {
    return (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <CalendarClock className="w-6 h-6 text-gray-400"/>
          </div>
          <h3 className="text-sm font-medium text-gray-900">Randevu bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">Yeni bir randevu oluşturarak başlayın.</p>
        </div>
    );
  }

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {appointments.map((apt) => {
          const dateObj = new Date(apt.date);
          const formattedDate = dateObj.toLocaleDateString('tr-TR', {
            weekday: 'short', month: 'short', day: 'numeric'
          });
          const formattedTime = dateObj.toLocaleTimeString('tr-TR', {
            hour: '2-digit', minute: '2-digit'
          });

          return (
              <div key={apt.id} className="bg-white rounded-2xl p-5 border border-gray-100 card-hover relative overflow-hidden group shadow-sm hover:shadow-md transition-all">

                <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-blue-50 to-teal-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <StatusBadge status={apt.status}/>

                    <div className="flex flex-col items-end text-right">
                      <div className="flex items-center text-gray-900 font-semibold">
                        <Clock className="w-4 h-4 mr-1 text-blue-500"/>
                        {formattedTime}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{formattedDate}</div>
                    </div>
                  </div>

                  <div className="space-y-3 mt-4">
                    {/* Hasta Bilgisi */}
                    <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100/50">
                      <div className="p-1.5 bg-white rounded-md shadow-sm">
                        <User className="w-4 h-4 text-gray-600"/>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Hasta</p>
                        <p className="text-sm font-semibold text-gray-900">{apt.patientName}</p>
                      </div>
                    </div>

                    {/* Doktor */}
                    <div className="flex items-center gap-3 px-2.5">
                      <div className="p-1.5 bg-blue-50 rounded-md text-blue-600">
                        <User className="w-4 h-4"/>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Doktor</p>
                        <p className="text-sm font-medium text-gray-800">{apt.doctorName}</p>
                      </div>
                    </div>

                    {/* Açıklama */}
                    <div className="flex items-center gap-3 px-2.5">
                      <div className="p-1.5 bg-blue-50 rounded-md text-blue-600">
                        <Text className="w-4 h-4"/>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Açıklama</p>
                        <p className="text-sm font-medium text-gray-800">{apt.note || '-'}</p>
                      </div>
                    </div>

                    {/* Silme*/}
                    <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
                      <button
                          onClick={() => handleDelete(apt.id)}
                          className="p-1.5 bg-red-50 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors flex items-center gap-1"
                          title="Randevuyu Sil"
                      >
                        <Trash2 size={16}/>
                        <span className="text-xs font-medium">Sil</span>
                      </button>
                    </div>

                  </div>
                </div>
              </div>
          );
        })}
      </div>
  );
};

export default AppointmentList;