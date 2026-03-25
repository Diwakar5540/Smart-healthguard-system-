import { useState } from "react";
import { healthService } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ShieldCheck, Info, Sparkles, Loader2, AlertCircle, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import VitaminDeficiencyAnalyzer from "../components/VitaminDeficiencyAnalyzer.jsx";
import { Camera } from "lucide-react";

const VITAMIN_SYMPTOMS = [
  "Fatigue", "Hair Loss", "Brittle Nails", "Sore Mouth", 
  "Cracked Lips", "Night Blindness", "Dry Skin", 
  "Bleeding Gums", "Slow Wound Healing", "Muscle Weakness", 
  "Bone Pain", "Tingling Hands", "Memory Issues"
];

const ResultCard = ({ result }) => {
  const isHigh = result.severity === "high";
  const isMod = result.severity === "moderate";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mt-8 p-8 rounded-3xl border-2 transition-all shadow-2xl overflow-hidden relative ${
        isHigh ? "bg-red-50 border-red-200" :
        isMod ? "bg-amber-50 border-amber-200" :
        "bg-green-50 border-green-200"
      }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 ${
        isHigh ? "bg-red-500" : isMod ? "bg-amber-500" : "bg-green-500"
      }`} />

      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
          isHigh ? "bg-red-500 text-white" :
          isMod ? "bg-amber-500 text-white" :
          "bg-green-500 text-white"
        }`}>
          <ShieldCheck size={40} />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
              {result.deficiency}
            </h3>
            <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border-2 ${
              isHigh ? "bg-red-100 text-red-600 border-red-200" :
              isMod ? "bg-amber-100 text-amber-600 border-amber-200" :
              "bg-green-100 text-green-600 border-green-200"
            }`}>
              {result.confidence} Confidence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Info size={14} /> Recommendation
              </p>
              <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 pl-4 border-medical-200">
                "{result.recommendation}"
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} /> Severity Status
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold capitalize ${
                    isHigh ? "text-red-600" : isMod ? "text-amber-600" : "text-green-600"
                }`}>
                  {result.severity} risk detected
                </span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                   <div 
                    className={`h-full transition-all duration-1000 ${isHigh ? "w-full bg-red-500" : isMod ? "w-1/2 bg-amber-500" : "w-1/4 bg-green-500"}`} 
                   />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function VitaminChecker() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeMode, setActiveMode] = useState("questionnaire"); // "questionnaire" or "vision"
  const { checkUser } = useAuth(); // Refresh profile after check

  const toggleSymptom = (s) => {
    setSelectedSymptoms(prev => 
      prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) {
      toast.error("Please select at least one symptom.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data } = await healthService.checkVitamin(selectedSymptoms);
      setResult(data);
      checkUser(); // Update dashboard
      toast.success("Detection complete!");
    } catch (err) {
      toast.error("An error occurred during detection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <header className="mb-12 text-center md:text-left flex flex-col md:flex-row items-center md:items-end gap-6">
        <div className="w-16 h-16 rounded-3xl bg-medical-500 flex items-center justify-center text-white shadow-xl shadow-medical-100 shrink-0">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Vitamin Deficiency Checker</h1>
          <p className="text-slate-500 font-medium max-w-lg">
            Choose between physical symptom analysis or AI-powered body vision scanning.
          </p>
        </div>
      </header>

      {/* Mode Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-12 border border-slate-200 shadow-sm mx-auto md:mx-0">
        <button
          onClick={() => setActiveMode("questionnaire")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            activeMode === "questionnaire" 
              ? "bg-white text-medical-600 shadow-md" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ShieldCheck size={18} /> Symptoms Check
        </button>
        <button
          onClick={() => setActiveMode("vision")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            activeMode === "vision" 
              ? "bg-white text-medical-600 shadow-md" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Camera size={18} /> AI Vision Scan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
        {activeMode === "questionnaire" ? (
          <>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                 <AlertCircle size={20} className="text-medical-500" /> Select your symptoms
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
                {VITAMIN_SYMPTOMS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className={`
                      p-4 rounded-2xl border-2 text-sm font-bold transition-all duration-300 flex items-center justify-between group
                      ${selectedSymptoms.includes(s) 
                        ? "bg-medical-500 border-medical-500 text-white shadow-xl shadow-medical-100 scale-[1.02]" 
                        : "bg-white border-slate-100 text-slate-500 hover:border-medical-200 hover:text-medical-600 hover:bg-medical-50"}
                    `}
                  >
                    {s}
                    {selectedSymptoms.includes(s) && <Sparkles size={14} className="animate-pulse" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-8">
                <div className="flex items-center gap-3 text-slate-400">
                  <Heart size={18} />
                  <p className="text-xs font-medium uppercase tracking-widest">
                    {selectedSymptoms.length} symptoms selected
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-10 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} /> ANALYZING...
                    </>
                  ) : (
                    "Run Lab Diagnostic"
                  )}
                </button>
              </div>
            </form>

            <AnimatePresence>
              {result && <ResultCard result={result} />}
            </AnimatePresence>
          </>
        ) : (
          <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm">
             <VitaminDeficiencyAnalyzer />
          </div>
        )}
      </div>
    </div>
  );
}
