import { useState, useEffect } from 'react';
import axios from 'axios';
import AppointmentList from './components/AppointmentList';
import AppointmentForm from './components/AppointmentForm';
import { Calendar } from 'lucide-react';

function App() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleAppointmentAdded = () => {
    fetchAppointments();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <header className="bg-white/70 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SmileCare Dental</h1>
              <p className="text-sm text-gray-500 font-medium">Appointment Management System</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Section - Takes 4 columns on large screens */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <AppointmentForm onAppointmentAdded={handleAppointmentAdded} />
          </div>

          {/* List Section - Takes 8 columns on large screens */}
          <div className="lg:col-span-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Upcoming Appointments</h2>
                <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-sm font-semibold">
                  {appointments.length} Total
                </span>
              </div>
              <AppointmentList appointments={appointments} loading={loading} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
