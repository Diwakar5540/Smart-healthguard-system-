import { useState } from "react";
import { healthService } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Activity, Thermometer, Droplets, Calendar, AlertTriangle, ShieldAlert, Loader2, Heart, Scale } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import BloodTestDiseaseDetector from "../components/BloodTestDiseaseDetector.jsx";
import { ClipboardList } from "lucide-react";

const DISEASE_SYMPTOMS = [
  "Rash", "Headache", "Joint Pain", "Abdominal Pain", 
  "Constipation", "Diarrhea", "Nausea", "Vomiting", "Weakness"
];

const ResultCard = ({ result }) => {
  const isHigh = result.severity === "high";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-12 p-8 rounded-3xl border-2 transition-all shadow-2xl relative overflow-hidden ${
        isHigh ? "bg-red-50 border-red-200 shadow-red-100" : "bg-teal-50 border-teal-200 shadow-teal-100"
      }`}
    >
      <div className={`absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-10 ${
        isHigh ? "bg-red-500" : "bg-teal-500"
      }`} />

      <div className="relative z-10 flex flex-col md:flex-row gap-10">
        <div className={`w-28 h-28 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl transform rotate-3 ${
          isHigh ? "bg-red-600 text-white" : "bg-teal-600 text-white"
        }`}>
          {isHigh ? <ShieldAlert size={56} /> : <Activity size={56} />}
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1 leading-none">Detection Result</p>
              <h3 className="text-4xl font-extrabold text-slate-800 tracking-tighter capitalize">
                {result.disease}
              </h3>
            </div>
            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 font-black text-sm uppercase tracking-widest ${
              isHigh ? "bg-red-100 text-red-600 border-red-200 shadow-lg shadow-red-50" : "bg-teal-100 text-teal-600 border-teal-200 shadow-lg shadow-teal-50"
            }`}>
              {result.probability} PROBABILITY
            </div>
          </div>

          <div className="bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-white/50 space-y-4">
             <div className="flex items-start gap-3">
               <AlertTriangle size={18} className={isHigh ? "text-red-500" : "text-teal-500"} />
               <p className="text-sm font-bold text-slate-700 leading-relaxed italic border-l-2 pl-3 border-slate-200">
                 "{result.recommendation}"
               </p>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none border-t border-slate-200/50 pt-4">
               {result.disclaimer}
             </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function DiseaseDetector() {
  const [symptoms, setSymptoms] = useState([]);
  const [labValues, setLabValues] = useState({
    fever: "",
    platelets: "",
    feverDuration: "",
    widalTest: false
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeMode, setActiveMode] = useState("checklist"); // "checklist" or "blood-test"
  const { checkUser } = useAuth();

  const toggleSymptom = (s) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLabValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!labValues.fever) {
      toast.error("Fever temperature is required.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data } = await healthService.checkDisease(symptoms, labValues);
      setResult(data);
      checkUser();
      toast.success("Disease detection complete!");
    } catch (err) {
      toast.error("Internal service error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <header className="mb-12 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-6 border-4 border-white shadow-xl">
           <AlertTriangle size={32} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-3">Disease Detection Lab</h1>
        <p className="text-slate-500 font-medium text-center max-w-lg leading-relaxed">
          Integrated screening for vector-borne and water-borne diseases using clinical symptoms and laboratory parameters.
        </p>
      </header>

      {/* Mode Switcher */}
      <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-3xl w-fit mb-12 border border-slate-200 shadow-xl mx-auto">
        <button
          onClick={() => setActiveMode("checklist")}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
            activeMode === "checklist" 
              ? "bg-slate-900 text-white shadow-2xl scale-105" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Activity size={18} /> Symptoms Checklist
        </button>
        <button
          onClick={() => setActiveMode("blood-test")}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
            activeMode === "blood-test" 
              ? "bg-slate-900 text-white shadow-2xl scale-105" 
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ClipboardList size={18} /> Blood Report Analysis
        </button>
      </div>

      {activeMode === "checklist" ? (
        <>
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200 p-8 lg:p-12 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* Section 1: Clinical Symptoms */}
              <section className="space-y-8">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 border-b border-slate-50 pb-4 leading-none">
                  <Heart size={20} className="text-red-500" /> Clinical Presentation
                </h3>
                
                <div className="flex flex-wrap gap-3">
                  {DISEASE_SYMPTOMS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSymptom(s)}
                      className={`
                        px-5 py-3 rounded-2xl text-[13px] font-bold transition-all duration-300 border-2
                        ${symptoms.includes(s) 
                          ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200 scale-105" 
                          : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 hover:border-slate-200 hover:text-slate-700"}
                      `}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>

              {/* Section 2: Lab Parameters */}
              <section className="space-y-8">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 border-b border-slate-50 pb-4 leading-none">
                  <Scale size={20} className="text-medical-500" /> Lab Parameters
                </h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-medical-500 transition-colors pointer-events-none">
                        <Thermometer size={18} />
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        name="fever"
                        value={labValues.fever}
                        onChange={handleInputChange}
                        placeholder="Temperature (°C)"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-medical-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                      />
                    </div>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-medical-500 transition-colors pointer-events-none">
                        <Droplets size={18} />
                      </span>
                      <input
                        type="number"
                        name="platelets"
                        value={labValues.platelets}
                        onChange={handleInputChange}
                        placeholder="Platelet Count"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-medical-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                      />
                    </div>
                  </div>

                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-medical-500 transition-colors pointer-events-none">
                      <Calendar size={18} />
                    </span>
                    <input
                      type="number"
                      name="feverDuration"
                      value={labValues.feverDuration}
                      onChange={handleInputChange}
                      placeholder="Fever Duration (Days)"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-medical-500 focus:bg-white outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium"
                    />
                  </div>

                  <label className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer group hover:bg-slate-100 transition-colors">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        name="widalTest"
                        checked={labValues.widalTest}
                        onChange={handleInputChange}
                        className="w-5 h-5 rounded border-slate-300 text-medical-600 focus:ring-medical-500 border-none bg-white shadow-sm"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 leading-none mb-1">Widal Test Result</p>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Typhoid Specific Diagnostic</p>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            <div className="flex flex-col items-center pt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-80 py-5 bg-gradient-to-r from-slate-900 to-black hover:scale-[1.02] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-300 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : "GET DIAGNOSIS REPORT"}
              </button>
              <p className="mt-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center">
                * This tool provides assisted screening and not medical advice *
              </p>
            </div>
          </form>

          <AnimatePresence>
            {result && <ResultCard result={result} />}
          </AnimatePresence>
        </>
      ) : (
        <div className="bg-white/50 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl overflow-hidden">
          <BloodTestDiseaseDetector />
        </div>
      )}
    </div>
  );
}
