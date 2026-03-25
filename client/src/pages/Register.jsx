import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/api.js";
import { Mail, Lock, User, Activity, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.register(formData);
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      <div className="hidden lg:flex flex-col flex-1 bg-slate-900 border-r border-slate-800 p-20 justify-center items-start text-white relative h-screen">
        <div className="space-y-6 max-w-lg">
          <div className="w-14 h-14 rounded-3xl bg-medical-500 flex items-center justify-center text-white shadow-xl shadow-medical-200/20 mb-8">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-5xl font-black leading-tight tracking-tight uppercase">Join the <span className="text-medical-500">Shield</span> Network.</h1>
          <p className="text-slate-400 text-lg font-medium leading-relaxed italic border-l-4 pl-6 border-medical-500">
            "We integrate biometric precision with rule-based medical intelligence to safeguard your digital health profile."
          </p>
          <div className="grid grid-cols-2 gap-8 pt-10">
            <div>
              <p className="text-2xl font-black text-white">99.8%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Accuracy Logic</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">256bit</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">E2E Protection</p>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-20 opacity-10 flex items-center gap-12 text-sm font-black uppercase tracking-[0.4em] pointer-events-none">
          <span>VITAMIN</span>
          <span>DISEASE</span>
          <span>BIOMETRIC</span>
          <span>RECORDS</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-10">
          <header className="space-y-4 text-center md:text-left">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">Get Started</h2>
            <p className="text-slate-400 font-medium text-sm">Secure your digital health guard account today.</p>
          </header>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-medical-500 transition-colors pointer-events-none">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-slate-50 focus:border-medical-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium shadow-sm focus:shadow-xl focus:shadow-medical-50"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-medical-500 transition-colors pointer-events-none">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-slate-50 focus:border-medical-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium shadow-sm focus:shadow-xl focus:shadow-medical-50"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-medical-500 transition-colors pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-slate-50 focus:border-medical-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium shadow-sm focus:shadow-xl focus:shadow-medical-50"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-medical-500 hover:bg-medical-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-medical-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "CREATE ACCOUNT"} <ArrowRight size={18} />
            </button>
          </form>

          <footer className="text-center text-sm font-medium text-slate-400">
             Already protected? <Link to="/login" className="text-medical-600 font-bold hover:underline">Sign In Instead</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
