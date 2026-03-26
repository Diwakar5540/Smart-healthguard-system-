import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Mail, Lock, Fingerprint, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, fingerprintLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = async () => {
    setLoading(true);
    try {
      await fingerprintLogin();
      navigate("/");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans">
      {/* Branding Side */}
      <div className="hidden md:flex flex-col flex-1 bg-medical-500 p-16 justify-between relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white border border-white/30">
            <ShieldCheck size={28} />
          </div>
          <span className="text-2xl font-black text-white tracking-tight uppercase">HealthGuard</span>
        </div>
        
        <div className="relative z-10 space-y-4">
          <h1 className="text-6xl font-black text-white leading-[0.9] tracking-tighter">Your Health, <br/> Your Shield.</h1>
          <p className="text-white/70 text-lg max-w-sm font-medium leading-relaxed italic">
            "Advanced rule-based intelligence securing your digital health journey with biometric precision."
          </p>
        </div>

        <div className="relative z-10 text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">
          Powered by Smart Health Guard © 2024
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full -mr-96 -mt-96 blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-40 -mb-40 blur-2xl pointer-events-none" />
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 md:bg-white">
        <div className="w-full max-w-md space-y-12">
          <header className="space-y-4 text-center md:text-left">
            <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">Sign In</h2>
            <p className="text-slate-400 font-medium text-sm">Welcome back to your healthcare cockpit.</p>
          </header>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-medical-500 transition-colors pointer-events-none">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-medical-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-medical-500 transition-colors pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-medical-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "AUTHENTICATE"} <ArrowRight size={18} />
            </button>
          </form>

          <footer className="text-center">
             <p className="text-sm font-medium text-slate-400">
               New here? <Link to="/register" className="text-medical-600 font-bold hover:underline">Secure an Invitation</Link>
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
