import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/users`;

export const getDoctors = async () => {
    // tokenı local storage kısmından aldım şimdilik!(düzenlenebilir)
    const userStr = localStorage.getItem('user');
    if (!userStr) return [];
    const user = JSON.parse(userStr);

    try {
        // tokenle backende GET isteği att
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: `Bearer ${user.token}`
            }
        });

        // rolü doktor olanları çektik
        return response.data.filter(u => u.role === 'ROLE_DOCTOR');
    } catch (error) {
        console.error("Doktorlar çekilirken hata oluştu:", error);
        return [];
    }
};