import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;

// giriş yap
export const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    if (response.data.token) {
        // Token'ı ve kullanıcı bilgilerini tarayıcıya kaydediyoruz
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};
//kayıt ol
export const register = async (name, surname, username, password, role) => {
    const response = await axios.post(`${API_URL}/register`, {
        name,
        surname,
        username,
        password,
        role
    });
    return response.data;
};

//çıkış
export const logout = () => {
    localStorage.removeItem('user');
};

// giriş yapmış kullanıcıyı okuma
export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};