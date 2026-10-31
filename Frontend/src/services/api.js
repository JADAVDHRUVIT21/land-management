import axios from "axios";
    // baseURL: "https://land-management-zj14.onrender.com/api",

const api = axios.create({
    baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Let the browser set the correct Content-Type for FormData
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;