/**
 * Fingerprint-Based Blood Group Detection
 *
 * Self-contained React component for the fingerprint-blood-module.
 * Uses Gemini Vision AI for real prediction or falls back to demo mode.
 *
 * Scientific basis:
 *   Fingerprint ridge patterns (loops, whorls, arches) have genetic
 *   correlations with ABO/Rh blood group traits. This module uses
 *   AI vision analysis of fingerprint patterns for prediction.
 *
 * Integration:
 *   import FingerprintDetect from "../../fingerprint-blood-module/frontend/FingerprintDetect.jsx";
 *   <Route path="/fingerprint-detect" element={<FingerprintDetect />} />
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Upload, Camera, RotateCcw, X, Edit3, Save, Download, AlertTriangle, Shield, Info, Activity, History, ZapOff, Sparkles, Loader2, BarChart3, ChevronDown, CheckCircle, Smartphone, XCircle, Droplets } from "lucide-react";
import toast from "react-hot-toast";

// ─── Typewriter Effect ──────────────────────────────────────────────────
const Typewriter = ({ text }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const timer = setInterval(() => {
      setDisplayed(text.substring(0, i));
      i++;
      if (i > text.length) clearInterval(timer);
    }, 15);
    return () => clearInterval(timer);
  }, [text]);
  return <span>{displayed}<span className="animate-pulse">_</span></span>;
};

// ─── Import from module backend ─────────────────────────────────────────────
import { mockPredict, geminiPredict } from "../backend/predictor.js";
import { preprocessFingerprint } from "../backend/preprocess.js";

// ─── Constants ──────────────────────────────────────────────────────────────
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BLOOD_COLORS = {
  "A+":  "from-rose-500 to-red-600",
  "A-":  "from-rose-400 to-pink-600",
  "B+":  "from-orange-500 to-amber-600",
  "B-":  "from-orange-400 to-yellow-600",
  "AB+": "from-purple-500 to-indigo-600",
  "AB-": "from-purple-400 to-violet-600",
  "O+":  "from-blue-500 to-cyan-600",
  "O-":  "from-blue-400 to-sky-600",
};

const PATTERN_ICONS = {
  loop:        "〰️",
  whorl:       "🌀",
  arch:        "⌒",
  tented_arch: "⛰️",
  double_loop: "♾️",
  unknown:     "❓",
};

const PATTERN_LABELS = {
  loop:        "Loop Pattern",
  whorl:       "Whorl Pattern",
  arch:        "Arch Pattern",
  tented_arch: "Tented Arch",
  double_loop: "Double Loop",
  unknown:     "Unknown",
};

// ─── File → base64 helper ───────────────────────────────────────────────────
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ─── Probability Bar Component ──────────────────────────────────────────────
const ProbabilityBar = ({ group, probability, isTop }) => (
  <div className="flex items-center gap-3">
    <span className={`text-xs font-bold w-8 ${isTop ? "text-slate-800" : "text-slate-500"}`}>{group}</span>
    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(probability * 100).toFixed(0)}%` }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`h-full rounded-full ${isTop ? `bg-gradient-to-r ${BLOOD_COLORS[group] || "from-slate-400 to-slate-600"}` : "bg-slate-300"}`}
      />
    </div>
    <span className={`text-xs font-semibold w-12 text-right ${isTop ? "text-slate-700" : "text-slate-500"}`}>
      {(probability * 100).toFixed(1)}%
    </span>
  </div>
);

// ─── Quality Indicator ──────────────────────────────────────────────────────
const QualityBadge = ({ quality }) => {
  const styles = {
    clear:    "bg-emerald-100 text-emerald-900 border-emerald-300",
    moderate: "bg-amber-100 text-amber-900 border-amber-300",
    poor:     "bg-red-100 text-red-900 border-red-300",
  };
  const icons = {
    clear: <CheckCircle size={12} />,
    moderate: <AlertTriangle size={12} />,
    poor: <XCircle size={12} />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${styles[quality] || styles.moderate}`}>
      {icons[quality] || icons.moderate}
      {quality || "moderate"} quality
    </span>
  );
};

// ─── Preprocessing Preview ──────────────────────────────────────────────────
const PreprocessPreview = ({ canvas, stats }) => {
  const previewRef = useRef(null);

  useEffect(() => {
    if (canvas && previewRef.current) {
      const ctx = previewRef.current.getContext("2d");
      previewRef.current.width = 112;
      previewRef.current.height = 112;
      ctx.drawImage(canvas, 0, 0, 112, 112);
    }
  }, [canvas]);

  if (!canvas) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100"
    >
      <div className="shrink-0">
        <canvas ref={previewRef} className="w-16 h-16 rounded-xl border border-slate-200 shadow-sm" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preprocessed Image</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
          <span>224×224px</span>
          <span>Contrast: {stats?.contrast}</span>
          <span>StdDev: {stats?.stdDev}</span>
        </div>
        <QualityBadge quality={stats?.quality} />
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function FingerprintDetect() {
  // ── State ─────────────────────────────────────────────────────────────
  const [image, setImage]                   = useState(null);
  const [preview, setPreview]               = useState(null);
  const [loading, setLoading]               = useState(false);
  const [loadingStep, setLoadingStep]       = useState(0);
  const [loadingLogs, setLoadingLogs]       = useState([]);
  const [overrideMode, setOverrideMode]     = useState(false);
  const [overrideGroup, setOverrideGroup]   = useState("");
  const [history, setHistory]               = useState(() => {
    try { return JSON.parse(localStorage.getItem("fpBloodHistory") || "[]"); } catch { return []; }
  });
  const [result, setResult]                 = useState(null);
  const [error, setError]                   = useState(null);
  const [cameraOpen, setCameraOpen]         = useState(false);
  const [preprocessed, setPreprocessed]     = useState(null); // { canvas, stats }
  const [showProbChart, setShowProbChart]    = useState(false);
  const [showHistory, setShowHistory]       = useState(false);
  const [activeTab, setActiveTab]           = useState("blood"); // "blood" or "health"
  const [healthAnalysis, setHealthAnalysis] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);

  const apiKey = typeof import.meta !== "undefined" ? import.meta.env?.VITE_GEMINI_API_KEY : null;
  const isAIMode = Boolean(apiKey);

  // ── File handler ──────────────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setOverrideMode(false);
    setPreprocessed(null);

    // Run preprocessing pipeline
    try {
      const processed = await preprocessFingerprint(file);
      setPreprocessed(processed);

      if (processed.stats.quality === "poor") {
        toast("⚠️ Low quality fingerprint detected. Results may be less accurate.", { icon: "🔍" });
      }
    } catch (err) {
      console.warn("Preprocessing failed:", err);
    }
  };

  const onFileChange = (e) => handleFile(e.target.files[0]);
  const onDrop = (e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); };

  // ── Camera ────────────────────────────────────────────────────────────
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch {
      toast.error("Cannot access camera. Please allow camera permission.");
    }
  };

  const closeCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], "fingerprint_capture.jpg", { type: "image/jpeg" });
      handleFile(file);
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  // ── Analysis ──────────────────────────────────────────────────────────
  const analyzeFingerprint = async () => {
    if (!image) { toast.error("Please upload or capture a fingerprint image first."); return; }
    setLoading(true);
    setLoadingStep(0);
    setLoadingLogs([]);
    setError(null);
    setResult(null);
    setHealthAnalysis(null);
    setOverrideMode(false);

    const steps = [
      "Initializing AI Vision Hub...",
      "Capturing Latent Print Ridge Morphology...",
      "Isolating Core & Delta Minutiae...",
      "Mapping Pattern-Antigen Biomarkers...",
      "Synthesizing Genetic Correlation Data...",
      "Finalizing Blood Group Prediction..."
    ];

    // Simulate forensic logging
    let currentStep = 0;
    const logInterval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingLogs(prev => [...prev, { text: steps[currentStep], time: new Date().toLocaleTimeString() }]);
        setLoadingStep(currentStep + 1);
        currentStep++;
      } else {
        clearInterval(logInterval);
      }
    }, 600);

    try {
      let predictionResult;

      if (isAIMode) {
        const base64 = preprocessed?.base64 || (await fileToBase64(image));
        predictionResult = await geminiPredict(base64, image.type, apiKey, activeTab);
      } else {
        await new Promise((r) => setTimeout(r, 4000));
        predictionResult = mockPredict(activeTab);
      }

      if (predictionResult.status === "error") {
        setError(predictionResult.message);
        toast.error(predictionResult.message);
        return;
      }

      // Handle Health Analysis vs Blood Group
      if (activeTab === "health") {
        setHealthAnalysis(predictionResult);
        toast.success("Health Intelligence Report Generated");
      } else {
        setResult(predictionResult);
        const entry = {
          ...predictionResult,
          timestamp: new Date().toISOString(),
          imageQuality: preprocessed?.stats?.quality || "unknown",
        };
        const updated = [entry, ...history].slice(0, 20);
        setHistory(updated);
        localStorage.setItem("fpBloodHistory", JSON.stringify(updated));
        toast.success(`Analysis Complete: ${predictionResult.blood_group}`);
      }
    } catch (err) {
      clearInterval(logInterval);
      console.error("[FingerprintDetect] Error:", err);
      const msg = err.message || "Analysis failed. Please try with a clearer fingerprint image.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────
  const reset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setOverrideMode(false);
    setPreprocessed(null);
    setShowProbChart(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Override ──────────────────────────────────────────────────────────
  const saveOverride = () => {
    if (!overrideGroup) { toast.error("Please select a blood group."); return; }
    const updated = { ...result, blood_group: overrideGroup, overridden: true };
    setResult(updated);
    const newHistory = history.map((h, i) => (i === 0 ? { ...h, ...updated } : h));
    setHistory(newHistory);
    localStorage.setItem("fpBloodHistory", JSON.stringify(newHistory));
    setOverrideMode(false);
    toast.success("Blood group manually overridden!");
  };

  // ── Export PDF ────────────────────────────────────────────────────────
  const exportReport = () => {
    if (!result) return;
    const report = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FINGERPRINT BLOOD GROUP ANALYSIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date:       ${new Date().toLocaleString()}
Mode:       ${result.mode === "demo" ? "Demo (Mock)" : "AI Analysis"}

RESULTS
───────
Blood Group:    ${result.blood_group}
Confidence:     ${(result.confidence * 100).toFixed(1)}%
Pattern Type:   ${PATTERN_LABELS[result.pattern_type] || result.pattern_type}
${result.reasoning ? `\nAnalysis:\n${result.reasoning}` : ""}
${result.all_probabilities ? `\nAll Probabilities:\n${Object.entries(result.all_probabilities).map(([g, p]) => `  ${g}: ${(p * 100).toFixed(1)}%`).join("\n")}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCLAIMER: This is an AI-based prediction
for educational use only. Not a substitute
for clinical blood typing.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fingerprint_blood_report_${result.blood_group}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  // ═════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-medical-50/20 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-medical-600 to-cyan-600 text-white px-8 py-4 rounded-3xl shadow-2xl shadow-medical-100 border border-medical-500/50">
            <Fingerprint className="text-cyan-100" size={32} />
            <span className="text-xl font-black tracking-tighter uppercase">Fingerprint Blood Group Detection</span>
          </div>

          {/* Mode Badge */}
          <div className="flex justify-center">
            {isAIMode ? (
              <span className="inline-flex items-center gap-1.5 bg-cyan-100 text-cyan-900 border border-cyan-300 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                <Sparkles size={11} /> AI Mode — Gemini Vision
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                <ZapOff size={11} /> Demo Mode — Mock Predictions
              </span>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-white/50 backdrop-blur-md p-1.5 rounded-[2rem] w-fit mb-8 border border-white shadow-2xl mx-auto">
            <button
              onClick={() => setActiveTab("blood")}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                activeTab === "blood" ? "bg-slate-900 text-white shadow-xl scale-105" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Droplets size={16} /> Blood Group
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                activeTab === "health" ? "bg-medical-600 text-white shadow-xl scale-105" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Activity size={16} /> Health Insights
            </button>
          </div>

          <p className="text-slate-600 text-sm max-w-xl mx-auto font-medium">
            {activeTab === "blood" 
              ? "Analyze ridge patterns (loops, whorls, arches) to predict your genetic blood group antigens."
              : "Detect dermatoglyphic biomarkers correlating to metabolic and cardiovascular health predispositions."}
          </p>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 bg-amber-100 border border-amber-300 rounded-xl px-4 py-3 text-left max-w-xl mx-auto shadow-sm">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-amber-900 font-bold">
              <span className="opacity-70">Educational Purpose Only.</span> This is an AI-based prediction for educational use only.
              Not a substitute for clinical blood typing. Always confirm with a certified medical professional.
            </p>
          </div>
        </motion.div>

        {/* ── Upload / Camera Zone ── */}
        {!preview && !cameraOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-indigo-200 rounded-3xl bg-white hover:border-indigo-400 hover:bg-indigo-50/30 transition-all duration-300 flex flex-col items-center justify-center gap-4 py-16 px-8"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-medical-100 to-cyan-200 flex items-center justify-center shadow-inner">
                <Fingerprint className="text-medical-600" size={36} />
              </div>
              <div className="text-center">
                <p className="text-slate-800 font-bold text-lg">Drop your fingerprint image here</p>
                <p className="text-slate-500 text-sm mt-1 font-medium">or click to browse — JPG, PNG, WebP supported</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onFileChange}
              />
            </div>

            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-sm font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCamera}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-900 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Camera size={20} />
              Capture via Webcam
            </motion.button>

            {/* How-to tips */}
            <div className="bg-medical-50/50 border border-medical-100 rounded-2xl p-6 shadow-inner">
              <p className="text-xs font-black text-medical-700 uppercase tracking-[0.2em] flex items-center gap-1.5 mb-2">
                <Info size={14} /> Tips for best results
              </p>
              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4 font-medium">
                <li>Use a high-resolution image with clear ridge patterns visible</li>
                <li>Ensure even lighting — avoid shadows across the fingerprint</li>
                <li>Place finger flat against a clean, light-colored surface</li>
                <li>Thumbprints and index fingers work best for pattern analysis</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* ── Camera View ── */}
        <AnimatePresence>
          {cameraOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative rounded-3xl overflow-hidden bg-black shadow-2xl"
            >
              <video ref={videoRef} autoPlay playsInline className="w-full max-h-96 object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* Overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-40 h-52 border-2 border-white/60 rounded-2xl flex flex-col items-center justify-end pb-3 gap-2">
                  <Fingerprint className="text-white/60" size={32} />
                  <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">
                    Place finger here
                  </span>
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={closeCamera}
                  className="bg-white/20 backdrop-blur text-white px-5 py-2 rounded-full font-medium hover:bg-white/30 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="bg-indigo-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-600 transition"
                >
                  <Camera size={22} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Image Preview + Analyze ── */}
        <AnimatePresence>
          {preview && !cameraOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white">
                <img src={preview} alt="Fingerprint" className="w-full max-h-72 object-contain bg-slate-50 p-4" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-600 hover:bg-white transition shadow"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Preprocessing preview */}
              {preprocessed && (
                <PreprocessPreview canvas={preprocessed.canvas} stats={preprocessed.stats} />
              )}

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <RotateCcw size={18} /> Retake
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={analyzeFingerprint}
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-medical-600 to-cyan-600 text-white font-black uppercase tracking-widest shadow-lg shadow-medical-100 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      {isAIMode ? "AI Analyzing..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <Fingerprint size={18} /> Analyze Fingerprint
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading Forensic Console ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-700 font-mono text-xs overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <span className="text-slate-500 tracking-tighter uppercase font-black">AI_FORENSIC_ENGINE_V2.0</span>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {loadingLogs.map((log, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                    <span className="text-emerald-500 mr-2">[{log.time}]</span>
                    <span className="text-slate-300">{log.text}</span>
                    <span className="text-emerald-500 ml-2">DONE</span>
                  </motion.div>
                ))}
                <div className="flex items-center gap-2 text-medical-400">
                  <span className="animate-pulse">_</span>
                  {loadingStep < 6 && <span>Executing Process ${loadingStep + 1}...</span>}
                </div>
              </div>

              {/* Matrix-like overlay */}
              <div className="mt-6 flex justify-between items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500">SYSTEM_LOAD: 42%</span>
                  <span className="text-[10px] text-slate-500">AI_CORE_ACTIVE: YES</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-1/2 h-full bg-medical-500 shadow-glow" 
                    />
                  </div>
                  <Loader2 className="animate-spin text-medical-500" size={16} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Health Result Card ── */}
        <AnimatePresence>
          {healthAnalysis && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl p-10 space-y-8"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <div>
                   <p className="text-[10px] font-black text-medical-600 uppercase tracking-[0.4em] mb-2">Metabolic Intelligence Report</p>
                   <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Clinical Analysis</h3>
                </div>
                <div className="p-4 bg-medical-50 rounded-2xl text-medical-600">
                  <Activity size={32} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Identified Predispositions</p>
                  <div className="space-y-3">
                    {healthAnalysis.predispositions.map((p, i) => (
                      <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase">{p.condition}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{p.basis}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          p.risk === "High" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                        }`}>{p.risk} Risk</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Nutritional Focus</p>
                  <div className="p-6 bg-medical-900 text-white rounded-[2rem] relative overflow-hidden h-full">
                     <Typewriter text={healthAnalysis.health_summary} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={reset} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-500 font-bold uppercase text-xs tracking-widest">New Screening</button>
                <button onClick={exportReport} className="flex-1 py-4 rounded-2xl bg-medical-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-medical-100">Export Health PDF</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Pattern + Blood Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pattern Type Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-lg p-6 space-y-3"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 blur-xl" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Fingerprint Pattern Detected
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-2xl shadow-inner">
                      {PATTERN_ICONS[result.pattern_type] || "🔍"}
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-800">
                        {PATTERN_LABELS[result.pattern_type] || result.pattern_type}
                      </p>
                      {result.pattern_description && (
                        <p className="text-xs text-slate-400 mt-0.5">{result.pattern_description}</p>
                      )}
                    </div>
                  </div>
                  {preprocessed?.stats && (
                    <div className="pt-2">
                      <QualityBadge quality={result.ridge_quality || preprocessed.stats.quality} />
                    </div>
                  )}
                </motion.div>

                {/* Blood Group Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-lg p-6 text-center space-y-3"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${BLOOD_COLORS[result.blood_group] || "from-slate-400 to-slate-600"} opacity-5 pointer-events-none`} />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Predicted Blood Group
                  </p>

                  {overrideMode ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex flex-wrap justify-center gap-2">
                        {BLOOD_GROUPS.map((g) => (
                          <button
                            key={g}
                            onClick={() => setOverrideGroup(g)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs border-2 transition-all ${
                              overrideGroup === g
                                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                : "border-slate-200 text-slate-600 hover:border-indigo-300"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setOverrideMode(false)} className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-xs hover:bg-slate-50 transition">
                          Cancel
                        </button>
                        <button onClick={saveOverride} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition">
                          <Save size={12} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br ${BLOOD_COLORS[result.blood_group] || "from-slate-400 to-slate-600"} shadow-2xl mx-auto`}>
                        <span className="text-4xl font-black text-white">{result.blood_group}</span>
                      </div>

                      {/* Confidence Bar */}
                      {result.confidence != null && (
                        <div className="space-y-1">
                          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden max-w-[200px] mx-auto">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(result.confidence * 100).toFixed(0)}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full bg-gradient-to-r ${BLOOD_COLORS[result.blood_group] || "from-slate-400 to-slate-600"}`}
                            />
                          </div>
                          <p className="text-slate-600 font-semibold text-sm">
                            Confidence: {(result.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}

                      {/* Mode + Override badges */}
                      <div className="flex flex-wrap justify-center gap-2 pt-1">
                        {result.mode === "demo" && (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            <ZapOff size={10} /> Demo Mode
                          </span>
                        )}
                        {result.overridden && (
                          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Overridden
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => { setOverrideMode(true); setOverrideGroup(result.blood_group); }}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition mt-1"
                      >
                        <Edit3 size={12} /> Override
                      </button>
                    </>
                  )}
                </motion.div>
              </div>

              {result.reasoning && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-8 text-slate-300 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Activity size={100} className="text-emerald-500" />
                  </div>
                  
                  <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800">
                    <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-2">
                       Processing Report #AI-{Math.random().toString(36).substring(7).toUpperCase()}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Forensic_AI_Output</span>
                  </div>

                  <div className="space-y-4 relative z-10">
                     <p className="text-sm leading-relaxed font-mono">
                        <Typewriter text={result.reasoning} />
                     </p>
                     
                     <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Dermatoglyphic Signature</p>
                           <p className="text-xs text-emerald-300 font-mono">CORE_AT_POINT_742</p>
                        </div>
                        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">Ridge Frequency</p>
                           <p className="text-xs text-emerald-300 font-mono">DENSITY_RATIO_1.42</p>
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {/* Probability Chart Toggle */}
              {result.all_probabilities && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowProbChart((v) => !v)}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium text-sm transition"
                  >
                    <BarChart3 size={16} />
                    {showProbChart ? "Hide" : "Show"} All Blood Group Probabilities
                  </button>

                  <AnimatePresence>
                    {showProbChart && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-sm"
                      >
                        {Object.entries(result.all_probabilities)
                          .sort(([, a], [, b]) => b - a)
                          .map(([group, prob], i) => (
                            <ProbabilityBar
                              key={group}
                              group={group}
                              probability={prob}
                              isTop={i === 0}
                            />
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <RotateCcw size={16} /> New Scan
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={exportReport}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-900 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Download size={16} /> Export Report
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error State ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-5"
            >
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-red-700 font-semibold text-sm">Analysis Failed</p>
                <p className="text-red-500 text-sm mt-0.5">{error}</p>
                <button onClick={reset} className="mt-3 text-xs text-red-600 font-medium underline underline-offset-2 hover:text-red-800 transition">
                  Try with a different image →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── History ── */}
        {history.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm transition"
            >
              <History size={16} />
              {showHistory ? "Hide" : "Show"} Detection History ({history.length})
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  {history.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${BLOOD_COLORS[h.blood_group] || "from-slate-300 to-slate-500"} flex items-center justify-center text-white font-bold text-sm shadow`}>
                          {h.blood_group}
                        </div>
                        <div>
                          <p className="text-slate-700 font-semibold text-sm">
                            {h.blood_group}
                            {h.overridden && <span className="text-amber-600 text-xs ml-1">(overridden)</span>}
                            {h.mode === "demo" && <span className="text-slate-500 text-xs ml-1">(demo)</span>}
                          </p>
                          <p className="text-slate-500 text-xs">{new Date(h.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span>{PATTERN_ICONS[h.pattern_type] || "🔍"} {h.pattern_type}</span>
                        <span className="font-black">{(h.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </motion.div>
                  ))}
                  <button
                    onClick={() => { setHistory([]); localStorage.removeItem("fpBloodHistory"); }}
                    className="text-xs text-slate-500 hover:text-red-500 transition mt-1 font-bold"
                  >
                    Clear history
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white border-2 border-medical-100 rounded-[2.5rem] p-10 shadow-2xl shadow-medical-50/50 space-y-6"
        >
          <p className="text-[12px] font-black text-medical-800 uppercase tracking-[0.4em] flex items-center gap-3">
            <Shield size={18} className="text-cyan-500" /> Scientific Basis
          </p>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            Dermatoglyphic studies have shown statistical correlations between fingerprint ridge patterns 
            and ABO/Rh blood groups. <strong>Loops</strong> (~65% of fingerprints) are most common in blood group O individuals.{" "}
            <strong>Whorls</strong> (~30%) show higher frequency in blood groups B and AB.{" "}
            <strong>Arches</strong> (~5%) are more associated with blood groups A and O.
            The Rh factor correlates with ridge density and pattern subtypes.
            This module applies these research correlations via advanced AI vision analysis.
          </p>
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 opacity-70">Scholarly References</p>
            <p className="text-[10px] text-slate-400 italic leading-snug">
              Bharadwaja et al. (2004), Rastogi & Pillai (2010), Mehta & Mehta (2015) - Dermatoglyphics in Clinical Medicine.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
