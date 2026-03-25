import React, { useState } from 'react';
import { Fingerprint, CheckCircle2, XCircle, Loader2, Activity } from 'lucide-react';

export default function FingerprintScanner({ onScanComplete, onError }) {
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [scanTimer, setScanTimer] = useState(null);

  const startScan = () => {
    if (status === 'success') return;
    setStatus('scanning');
    setProgress(0);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setStatus('success');
          onScanComplete('demo-fingerprint-id-123'); // Professional simulated ID
          return 100;
        }
        return prev + 2;
      });
    }, 40);
    setScanTimer(timer);
  };

  const cancelScan = () => {
    if (status === 'success') return;
    clearInterval(scanTimer);
    setStatus('idle');
    setProgress(0);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-10 select-none">
      <div className="relative group cursor-pointer active:scale-95 transition-transform duration-200">
        {/* Progress Ring */}
        <svg className="w-32 h-32 transform -rotate-90 pointer-events-none">
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="64"
            cy="64"
            r="60"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={377}
            strokeDashoffset={377 - (377 * progress) / 100}
            className="text-medical-500 transition-all duration-100 ease-out"
          />
        </svg>

        {/* Scanner Body */}
        <div 
          onMouseDown={startScan}
          onMouseUp={cancelScan}
          onMouseLeave={cancelScan}
          onTouchStart={startScan}
          onTouchEnd={cancelScan}
          className={`
            absolute inset-4 rounded-full flex items-center justify-center border-2 transition-all duration-500 overflow-hidden
            ${status === 'idle' ? 'border-slate-100 bg-slate-50 text-slate-400' : ''}
            ${status === 'scanning' ? 'border-medical-200 bg-medical-50 text-medical-500 shadow-xl shadow-medical-100' : ''}
            ${status === 'success' ? 'border-green-200 bg-green-50 text-green-600 shadow-xl shadow-green-100' : ''}
          `}
        >
          {status === 'success' ? (
            <CheckCircle2 size={48} className="animate-in zoom-in duration-300" />
          ) : (
            <div className="relative">
              <Fingerprint size={48} strokeWidth={1} className={status === 'scanning' ? 'opacity-100' : 'opacity-40'} />
              {status === 'scanning' && (
                <div 
                  className="absolute top-0 left-0 w-full h-1 bg-medical-500 shadow-glow animate-laser-scan"
                  style={{ transform: `translateY(${progress * 0.48}px)` }}
                />
              )}
            </div>
          )}
        </div>

        {/* Pulse Ripple Effect */}
        {status === 'scanning' && (
          <div className="absolute inset-0 rounded-full animate-ping bg-medical-500/10 pointer-events-none" />
        )}
      </div>

      <div className="text-center space-y-4">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
            {status === 'idle' && "Press & Hold to Scan"}
            {status === 'scanning' && "Capturing Latent Prints..."}
            {status === 'success' && "Identity Verified"}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
            {status === 'idle' && "Place finger on the sensor mark above to begin verification"}
            {status === 'scanning' && `Biometric Analysis: ${progress}%`}
            {status === 'success' && "Encrypted medical data retrieved"}
          </p>
        </div>

        {status === 'scanning' && (
          <div className="w-48 h-1 bg-slate-100 rounded-full mx-auto overflow-hidden">
             <div className="h-full bg-medical-500 transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center justify-center gap-2 text-green-600 animate-pulse">
            <CheckCircle2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Database Match Found</span>
          </div>
        )}
      </div>
    </div>
  );
}
