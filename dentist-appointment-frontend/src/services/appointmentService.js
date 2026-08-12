import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/appointments`;

// randevu oluşturma(post)
export const createAppointment = async (patientId, doctorId, appointmentDate) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);

    const response = await axios.post(API_URL, {
        patientId: patientId,
        doctorId: doctorId,
        appointmentDate: appointmentDate
    }, {
        headers: {
            Authorization: `Bearer ${user.token}`
        }
    });

    return response.data;
};

// randevuları getir(get)
export const getAppointments = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return [];

    const user = JSON.parse(userStr);

    try {
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: `Bearer ${user.token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error("Randevular çekilirken hata oluştu:", error);
        return [];
    }
};
//randevu güncelleme
export const updateAppointment = async (id, updateData) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr);

    const response = await axios.put(`${API_URL}/${id}`, updateData, {
        headers: {
            Authorization: `Bearer ${user.token}`
        }
    });

    return response.data;
};