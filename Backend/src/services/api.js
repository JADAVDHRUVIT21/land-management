import axios from "axios";

const api = axios.create({
    baseURL: "https://land-management-zj14.onrender.com/",
    // ⚠️ NO headers here. NO Content-Type. Let the browser set it.
});

api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // If body is FormData, DELETE any Content-Type
        // so the browser can set multipart/form-data + boundary
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;