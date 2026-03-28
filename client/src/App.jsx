import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import Navbar from "./components/layout/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import VitaminChecker from "./pages/VitaminChecker.jsx";
import DiseaseDetector from "./pages/DiseaseDetector.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import FingerprintLookup from "./pages/FingerprintLookup.jsx";
import BloodGroupDetector from "./pages/BloodGroupDetector.jsx";
import FingerprintDetect from "../../fingerprint-blood-module/frontend/FingerprintDetect.jsx";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical-500" />
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/vitamin" element={
            <ProtectedRoute>
              <MainLayout><VitaminChecker /></MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/disease" element={
            <ProtectedRoute>
              <MainLayout><DiseaseDetector /></MainLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/fingerprint-lookup" element={
            <ProtectedRoute>
              <MainLayout><FingerprintLookup /></MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/blood-group" element={
            <ProtectedRoute>
              <MainLayout><BloodGroupDetector /></MainLayout>
            </ProtectedRoute>
          } />

          <Route path="/fingerprint-detect" element={
            <ProtectedRoute>
              <MainLayout><FingerprintDetect /></MainLayout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
