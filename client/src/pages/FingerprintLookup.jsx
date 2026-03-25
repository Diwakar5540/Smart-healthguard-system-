import React, { useState } from 'react';
import { lookupBloodGroup } from '../services/fingerprintApi';
import FingerprintScanner from '../components/FingerprintScanner';
import { ShieldCheck, Info, Loader2, RefreshCcw, User, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BLOOD_COLOR_MAP = {
  'O+':  'bg-green-100 text-green-700 border-green-200',
  'O-':  'bg-red-100 text-red-700 border-red-200',
  'A+':  'bg-blue-100 text-blue-700 border-blue-200',
  'A-':  'bg-blue-50 text-blue-600 border-blue-100',
  'B+':  'bg-purple-100 text-purple-700 border-purple-200',
  'B-':  'bg-purple-50 text-purple-600 border-purple-100',
  'AB+': 'bg-amber-100 text-amber-700 border-amber-200',
  'AB-': 'bg-amber-50 text-amber-600 border-amber-100',
  'Not set': 'bg-slate-100 text-slate-500 border-slate-200'
};

export default function FingerprintLookup() {
  const [scanResult, setScanResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleScanComplete = async (fingerprintId) => {
    if (!fingerprintId) return;
    setIsLoading(true);
    setLookupError(null);
    try {
      const data = await lookupBloodGroup(fingerprintId);
      setScanResult(data);
    } catch (err) {
      setLookupError(err.response?.data?.error || "Health record lookup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAll = () => {
    setScanResult(null);
    setLookupError(null);
    setResetKey(prev => prev + 1);
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <header className="mb-12 text-center">
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Blood Group Lookup</h1>
        <p className="text-slate-500 font-medium">Scan your fingerprint to instantly retrieve your medical identity.</p>
      </header>

      <AnimatePresence>
        {lookupError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center justify-between"
          >
            <p className="text-sm font-bold uppercase tracking-widest">{lookupError}</p>
            <button onClick={() => setLookupError(null)} className="text-xs font-black">DISMISS</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden p-8 md:p-12">
        {!scanResult && !isLoading && (
          <FingerprintScanner 
            key={resetKey}
            onScanComplete={handleScanComplete} 
            onError={(msg) => setLookupError(msg)} 
          />
        )}

        {isLoading && (
          <div className="py-20 flex flex-col items-center space-y-4">
            <Loader2 className="animate-spin text-medical-500" size={48} />
            <p className="text-sm font-extrabold text-slate-400 uppercase tracking-[0.2em]">Querying Database...</p>
          </div>
        )}

        {scanResult && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            <div className="text-center space-y-2">
              <div className="w-20 h-20 rounded-3xl bg-medical-50 text-medical-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-medical-100 border-2 border-medical-100">
                <User size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 uppercase leading-none">{scanResult.name}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Profile Identified</p>
            </div>

            <div className={`p-8 rounded-[2rem] border-2 text-center space-y-2 ${BLOOD_COLOR_MAP[scanResult.bloodGroup] || BLOOD_COLOR_MAP['Not set']}`}>
              <Activity size={32} className="mx-auto opacity-50 mb-2" />
              <p className="text-xs font-black uppercase tracking-[0.3em] opacity-70">Blood Group</p>
              <h4 className="text-6xl font-black leading-none">{scanResult.bloodGroup}</h4>
            </div>

            <div className="flex flex-col items-center space-y-6">
              <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest max-w-xs leading-relaxed">
                Registered since: {new Date(scanResult.registeredSince).toLocaleDateString()}
                <br /><br />
                <span className="opacity-60 italic">"This is an identity-based lookup. Always confirm with a certified medical professional."</span>
              </p>

              <button
                onClick={resetAll}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
              >
                <RefreshCcw size={16} /> Scan Again
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
