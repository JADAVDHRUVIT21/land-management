import { createContext, useState } from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");

    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      return null;
    }
  });

  const [loading] = useState(false);

  const login = async (email, password) => {
    const response = await api.post("/users/login", {
      email,
      password,
    });

    const { token, user: loggedInUser } = response.data;

    localStorage.setItem("token", token);

    localStorage.setItem("user", JSON.stringify(loggedInUser));

    setUser(loggedInUser);

    return response.data;
  };

  const register = async (userData) => {
    const response = await api.post("/users/register", userData);

    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  const isAuthenticated = Boolean(localStorage.getItem("token"));

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;