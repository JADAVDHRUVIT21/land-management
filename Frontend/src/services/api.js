import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
    //  NO Content-Type header here!
});

api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // If body is FormData, remove any hardcoded Content-Type
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
            delete config.headers["content-type"];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;