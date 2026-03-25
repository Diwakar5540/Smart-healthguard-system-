import { createContext, useContext, useState, useEffect } from "react";
import { authService, userService } from "../services/api.js";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data } = await userService.getProfile();
      setUser(data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await authService.login(email, password);
      setUser(data.user);
      toast.success(data.message);
      return data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      toast.success("Logged out");
    } catch (err) {
      console.error(err);
    }
  };

  // Modern Biometric Logic Helper
  const enrollFingerprint = async () => {
    try {
      // 1. Get options from server
      const { data: options } = await authService.getFingerprintOptions();
      
      // 2. Browser WebAuthn prompt (simplified for MVP/Demonstration)
      // In a real WebAuthn, we use navigator.credentials.create(options)
      // Since navigator.credentials.create is complex to mock, we demonstrate the flow:
      
      const credentialId = "biometric-" + Math.random().toString(36).substring(7); // Realistic mockup
      
      // 3. Verify on server
      await authService.verifyFingerprintEnroll(credentialId);
      
      // Update local user state
      setUser(prev => ({ ...prev, fingerprintEnabled: true }));
      toast.success("Fingerprint enrolled successfully!");
    } catch (err) {
      toast.error("Fingerprint enrollment failed.");
      console.error(err);
    }
  };

  const fingerprintLogin = async () => {
    try {
      // 1. Check if browser supports WebAuthn
      // 2. Trigger biometric login
      const credentialId = "biometric-mock-id"; // In real: navigator.credentials.get()
      
      const { data } = await authService.fingerprintLogin(credentialId);
      setUser(data.user);
      toast.success("Welcome back!");
      return data;
    } catch (err) {
      toast.error("Biometric login failed.");
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkUser, enrollFingerprint, fingerprintLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
