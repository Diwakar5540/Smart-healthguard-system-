import { useAuth } from "../context/AuthContext.jsx";
import { Activity, ShieldCheck, Heart, User, Fingerprint, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const MetricCard = ({ icon: Icon, label, value, colorClass, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 rounded-full opacity-10 ${colorClass}`} />
    <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-white shadow-lg ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div className="flex flex-col">
      <span className="text-slate-400 text-sm font-medium mb-1">{label}</span>
      <span className="text-2xl font-bold text-slate-800">{value}</span>
    </div>
    <div className="mt-4 flex items-center text-[11px] font-bold text-slate-400 tracking-wider">
      <Activity size={12} className="mr-1" /> LAST UPDATED: TODAY
    </div>
  </motion.div>
);

export default function Dashboard() {
  const { user, enrollFingerprint } = useAuth();
  
  const recentRecords = user?.healthRecords || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <section className="bg-gradient-to-br from-medical-600 to-medical-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-medical-200">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-lg">
            <h1 className="text-3xl font-extrabold mb-3 leading-tight">Your Health, Guided by Data.</h1>
            <p className="text-medical-50 text-base opacity-90 leading-relaxed">
              Scan your symptoms, track your vitals, and stay ahead of your wellness with Smart Health Guard.
            </p>
            {!user?.fingerprintEnabled && (
              <button
                onClick={enrollFingerprint}
                className="mt-6 flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-2.5 rounded-xl text-sm font-bold border border-white/30 transition-all active:scale-95"
              >
                <Fingerprint size={18} /> ENABLE BIOMETRIC AUTH
              </button>
            )}
          </div>
          <motion.div 
            animate={{ scale: [1, 1.05, 1], rotate: [0, 2, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="hidden lg:flex p-6 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/90 flex items-center justify-center text-medical-600 shadow-xl">
              <ShieldCheck size={32} />
            </div>
            <div className="text-right">
              <p className="text-sm font-bold uppercase tracking-wider opacity-70">Security Status</p>
              <p className="text-xl font-bold">LOCKED & SECURE</p>
            </div>
          </motion.div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-medical-400/20 rounded-full -ml-32 -mb-32 blur-2xl pointer-events-none" />
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={Activity} label="Blood Group" value={user?.bloodGroup || "O+"} colorClass="bg-medical-500" delay={0.1} />
        <MetricCard icon={ShieldCheck} label="Health Status" value="Good" colorClass="bg-accent-green" delay={0.2} />
        <MetricCard icon={Heart} label="Last Checkup" value="May 20, 2024" colorClass="bg-accent-teal" delay={0.3} />
        <MetricCard icon={User} label="Profile Complete" value="85%" colorClass="bg-accent-amber" delay={0.4} />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Health Records */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800">Recent Health Records</h3>
            <Link to="/vitamin" className="px-5 py-2 bg-medical-100 text-medical-700 text-xs font-bold rounded-lg hover:bg-medical-200 transition-all flex items-center gap-2">
              <Plus size={14} /> NEW RECORD
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentRecords.length > 0 ? recentRecords.map((record, idx) => (
              <div key={idx} className="group p-4 rounded-xl border border-slate-100 hover:border-medical-200 hover:bg-medical-50/30 transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    record.type === "vitamin" ? "bg-medical-100 text-medical-600" : "bg-red-100 text-red-600"
                  }`}>
                    {record.type === "vitamin" ? <ShieldCheck size={20} /> : <Activity size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 capitalize leading-tight">{record.type} Check</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{new Date(record.createdAt).toLocaleDateString()} at {new Date(record.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full border ${
                    record.result.severity === "high" ? "bg-red-100 text-red-700 border-red-200" :
                    record.result.severity === "moderate" ? "bg-amber-100 text-amber-700 border-amber-200" :
                    "bg-green-100 text-green-700 border-green-200"
                  }`}>
                    {record.result.severity}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-20 opacity-50 flex flex-col items-center">
                <Activity size={48} className="text-slate-200 mb-4" />
                <p className="text-sm font-medium italic">No health records available yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions / Tips */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6 font-sans">Health Tips</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-accent-teal/5 border border-accent-teal/10">
              <p className="text-xs font-bold text-accent-teal mb-2 uppercase tracking-widest">Hydration Tip</p>
              <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"Drinking 2.5L of water daily helps in flushing toxins and keeps skin healthy."</p>
            </div>
            <div className="p-4 rounded-xl bg-medical-50 border border-medical-100">
              <p className="text-xs font-bold text-medical-600 mb-2 uppercase tracking-widest">Vitamin D</p>
              <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"15 mins of morning sun exposure can significantly boost your Vitamin D levels."</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
