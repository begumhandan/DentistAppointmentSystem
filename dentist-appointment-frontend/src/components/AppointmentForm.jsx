import { useState } from 'react';
import axios from 'axios';
import { User, Calendar, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function AppointmentForm({ onAppointmentAdded }) {
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: '',
    date: '',
    status: 'SCHEDULED',
    note: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Backend expecting standard Appointment fields (note might need to be added to backend, but we send it anyway)
      const payload = {
        ...formData,
          date: new Date(formData.date+':00').toISOString() // Ensure standard ISO format for Spring Boot LocalDateTime
        };

        await axios.post('http://localhost:8080/api/appointments', payload);
      setSuccess(true);
      setFormData({
        patientName: '',
        doctorName: '',
        date: '',
        status: 'SCHEDULED',
        note: ''
      });
      onAppointmentAdded();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Randevu oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
      {/* Decorative bg elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">New Appointment</h2>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-emerald-800">Success!</h4>
              <p className="text-xs text-emerald-600 mt-1">Appointment has been scheduled successfully.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-400" />
              Patient Name
            </label>
            <input
              type="text"
              name="patientName"
              required
              value={formData.patientName}
              onChange={handleChange}
              placeholder="e.g. Ahmet Yılmaz"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-400" />
              Doctor Name
            </label>
            <input
              type="text"
              name="doctorName"
              required
              value={formData.doctorName}
              onChange={handleChange}
              placeholder="e.g. Dr. Ayşe Kaya"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-400" />
              Date & Time
            </label>
            <input
              type="datetime-local"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm text-gray-700"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm text-gray-700 appearance-none"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-gray-400" />
              Note
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Optional notes regarding the appointment..."
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-sm placeholder:text-gray-400 resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scheduling...
              </>
            ) : (
              'Schedule Appointment'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
