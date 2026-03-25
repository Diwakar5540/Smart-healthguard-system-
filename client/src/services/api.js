import axios from "axios";

const api = axios.create({
  baseURL: "/api", // Using Vite proxy
  withCredentials: true,
});

export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (email, password) => api.post("/auth/login", { email, password }),
  logout: () => api.get("/auth/logout"),
  getFingerprintOptions: () => api.get("/auth/enroll/options"),
  verifyFingerprintEnroll: (credentialId) => api.post("/auth/enroll/verify", { credentialId }),
  fingerprintLogin: (credentialId) => api.post("/auth/fingerprint-verify", { credentialId }),
};

export const userService = {
  getProfile: () => api.get("/user/profile"),
};

export const healthService = {
  checkVitamin: (symptoms) => api.post("/health/vitamin", { symptoms }),
  checkDisease: (symptoms, labValues) => api.post("/health/disease", { symptoms, labValues }),
};

export default api;
