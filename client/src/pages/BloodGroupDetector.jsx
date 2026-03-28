import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, RotateCcw, CheckCircle, XCircle, AlertTriangle, Droplets, History, X, Edit3, Save } from "lucide-react";
import toast from "react-hot-toast";

// ─── Blood Group Truth Table ───────────────────────────────────────────────
const determineBloodGroup = (antiA, antiB, antiD) => {
  if (antiA && !antiB && antiD)  return "A+";
  if (antiA && !antiB && !antiD) return "A-";
  if (!antiA && antiB && antiD)  return "B+";
  if (!antiA && antiB && !antiD) return "B-";
  if (antiA && antiB && antiD)   return "AB+";
  if (antiA && antiB && !antiD)  return "AB-";
  if (!antiA && !antiB && antiD) return "O+";
  return "O-";
};

// ─── Well Result Pill ─────────────────────────────────────────────────────
const WellResult = ({ label, clumping, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm"
  >
    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
    {loading ? (
      <div className="w-8 h-8 rounded-full border-2 border-medical-400 border-t-transparent animate-spin" />
    ) : clumping === null ? (
      <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-dashed border-slate-300" />
    ) : clumping ? (
      <div className="flex flex-col items-center gap-1">
        <CheckCircle className="text-red-500" size={32} />
        <span className="text-xs font-semibold text-red-600">Clumping</span>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-1">
        <XCircle className="text-emerald-500" size={32} />
        <span className="text-xs font-semibold text-emerald-600">No Clumping</span>
      </div>
    )}
  </motion.div>
);

// ─── Blood Group Badge ────────────────────────────────────────────────────
const BLOOD_COLORS = {
  "A+": "from-rose-500 to-red-600",
  "A-": "from-rose-400 to-pink-600",
  "B+": "from-orange-500 to-amber-600",
  "B-": "from-orange-400 to-yellow-600",
  "AB+": "from-purple-500 to-indigo-600",
  "AB-": "from-purple-400 to-violet-600",
  "O+": "from-blue-500 to-cyan-600",
  "O-": "from-blue-400 to-sky-600",
};

// ─── Convert File to base64 ──────────────────────────────────────────────
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function BloodGroupDetector() {
  const [image, setImage]           = useState(null);
  const [preview, setPreview]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);  // { anti_a, anti_b, anti_d, blood_group, confidence }
  const [error, setError]           = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [history, setHistory]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("bloodGroupHistory") || "[]"); } catch { return []; }
  });
  const [showHistory, setShowHistory]   = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideGroup, setOverrideGroup] = useState("");

  const fileInputRef  = useRef(null);
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const streamRef     = useRef(null);

  // ── Image upload handler ──────────────────────────────────────────────
  const handleFile = (file) => {
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
  };

  const onFileChange = (e) => handleFile(e.target.files[0]);
  const onDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Camera ────────────────────────────────────────────────────────────
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch {
      toast.error("Cannot access camera. Please allow camera permission.");
    }
  };

  const closeCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], "captured.jpg", { type: "image/jpeg" });
      handleFile(file);
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  // ── Gemini Vision AI analysis ─────────────────────────────────────────
  const analyzeImage = async () => {
    if (!image) { toast.error("Please upload or capture an image first."); return; }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error("Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.");
      setError("Missing VITE_GEMINI_API_KEY. Get a free key at https://aistudio.google.com/ and add it to your client .env file.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setOverrideMode(false);

    try {
      // 1. Convert image to base64
      const base64Data = await fileToBase64(image);

      // 2. Discover available Gemini models
      console.log("Discovering available Gemini models...");
      const modelsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );
      const modelsData = await modelsResponse.json();
      if (modelsData.error) throw new Error(modelsData.error.message);

      const availableModels = modelsData.models.map((m) => m.name.split("/").pop());
      console.log("Available models:", availableModels);

      const modelToUse =
        availableModels.find((m) => m.includes("1.5-flash")) ||
        availableModels.find((m) => m.includes("1.5-pro")) ||
        availableModels.find((m) => m.includes("pro-vision")) ||
        availableModels[0];

      if (!modelToUse) throw new Error("No compatible vision model found for your API key.");
      console.log(`🚀 Using model: ${modelToUse}`);

      // 3. Call Gemini Vision API with structured prompt
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a medical laboratory image analysis AI. Analyze this blood typing / blood grouping test card image.

A blood typing test card has 3 wells/regions:
- Anti-A well: contains Anti-A serum
- Anti-B well: contains Anti-B serum  
- Anti-D well: contains Anti-D (Rh) serum

For each well, determine if there is AGGLUTINATION (clumping) or NO agglutination (smooth):
- Agglutination = the blood has clumped together, forming visible granules or clots (the antigen is PRESENT)
- No agglutination = the mixture remains smooth and uniform (the antigen is ABSENT)

Blood group determination rules:
- A+: Anti-A clumps, Anti-B smooth, Anti-D clumps
- A-: Anti-A clumps, Anti-B smooth, Anti-D smooth
- B+: Anti-A smooth, Anti-B clumps, Anti-D clumps
- B-: Anti-A smooth, Anti-B clumps, Anti-D smooth
- AB+: Anti-A clumps, Anti-B clumps, Anti-D clumps
- AB-: Anti-A clumps, Anti-B clumps, Anti-D smooth
- O+: Anti-A smooth, Anti-B smooth, Anti-D clumps
- O-: Anti-A smooth, Anti-B smooth, Anti-D smooth

IMPORTANT: Carefully analyze EACH well independently. Look at the actual texture and appearance of each well area. Clumped blood appears grainy, irregular, spotted or has visible aggregates. Smooth blood appears as a uniform, homogeneous red liquid.

Respond with ONLY a JSON object with these exact keys:
{
  "anti_a": true or false (true = agglutination/clumping detected),
  "anti_b": true or false (true = agglutination/clumping detected),
  "anti_d": true or false (true = agglutination/clumping detected),
  "blood_group": "the determined blood group like A+, B-, O+, AB+ etc",
  "confidence": a number between 0.0 and 1.0 representing your confidence,
  "reasoning": "brief explanation of what you observed in each well"
}`
                  },
                  {
                    inline_data: {
                      mime_type: image.type,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
            ],
          }),
        }
      );

      const data = await response.json();

      if (data.error) throw new Error(`Gemini API Error: ${data.error.message}`);

      if (!data.candidates || !data.candidates[0]?.content) {
        if (data.promptFeedback?.blockReason) {
          throw new Error(`Image blocked by AI Safety: ${data.promptFeedback.blockReason}`);
        }
        throw new Error("AI could not analyze this image. Please try a clearer photo of a blood test card.");
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      console.log("Gemini raw response:", textResponse);
      const aiResult = JSON.parse(textResponse);

      // Validate and normalize the response
      const anti_a = Boolean(aiResult.anti_a);
      const anti_b = Boolean(aiResult.anti_b);
      const anti_d = Boolean(aiResult.anti_d);

      // Re-derive blood group from the well results to ensure consistency
      const blood_group = determineBloodGroup(anti_a, anti_b, anti_d);
      const confidence = typeof aiResult.confidence === "number"
        ? Math.min(1, Math.max(0, aiResult.confidence))
        : 0.75;

      const finalResult = {
        anti_a,
        anti_b,
        anti_d,
        blood_group,
        confidence,
        reasoning: aiResult.reasoning || "",
        note: "Powered by Google Gemini Vision AI",
      };

      setResult(finalResult);
      const entry = { ...finalResult, timestamp: new Date().toISOString() };
      const updated = [entry, ...history].slice(0, 10);
      setHistory(updated);
      localStorage.setItem("bloodGroupHistory", JSON.stringify(updated));
      toast.success(`Blood group detected: ${blood_group}`);
    } catch (err) {
      console.error("[BloodGroup] Gemini Analysis Error:", err);
      const msg = err.message || "Analysis failed. Please try a clearer image.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setOverrideMode(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveOverride = () => {
    if (!overrideGroup) { toast.error("Please select a blood group."); return; }
    const updated = { ...result, blood_group: overrideGroup, overridden: true };
    setResult(updated);
    const newHistory = history.map((h, i) => i === 0 ? { ...h, ...updated } : h);
    setHistory(newHistory);
    localStorage.setItem("bloodGroupHistory", JSON.stringify(newHistory));
    setOverrideMode(false);
    toast.success("Blood group manually updated!");
  };

  const allGroups = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-red-200">
            <Droplets size={24} />
            <span className="text-lg font-bold tracking-wide">Blood Group Detection</span>
          </div>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Upload a blood typing test card image. Our AI analyzes Anti-A, Anti-B, and Anti-D wells to predict your blood group.
          </p>
          {/* Disclaimer */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left max-w-xl mx-auto">
            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-amber-700">
              <strong>Educational Purpose Only.</strong> This tool is not a substitute for laboratory testing. Always confirm blood type with a certified medical professional.
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
              className="cursor-pointer border-2 border-dashed border-red-200 rounded-3xl bg-white hover:border-red-400 hover:bg-red-50/50 transition-all duration-300 flex flex-col items-center justify-center gap-4 py-16 px-8"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-100 to-rose-200 flex items-center justify-center shadow-inner">
                <Upload className="text-red-500" size={36} />
              </div>
              <div className="text-center">
                <p className="text-slate-700 font-semibold text-lg">Drop your test card image here</p>
                <p className="text-slate-400 text-sm mt-1">or click to browse — JPG, PNG, WebP supported</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} />
            </div>

            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-slate-400 text-sm font-medium">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={openCamera}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-slate-700 to-slate-900 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Camera size={20} />
              Open Camera
            </motion.button>
          </motion.div>
        )}

        {/* ── Camera View ── */}
        <AnimatePresence>
          {cameraOpen && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="relative rounded-3xl overflow-hidden bg-black shadow-2xl"
            >
              <video ref={videoRef} autoPlay playsInline className="w-full max-h-96 object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {/* Overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/60 rounded-xl w-3/4 h-2/3 flex items-end justify-around pb-4">
                  {["Anti-A","Anti-B","Anti-D"].map(l => (
                    <span key={l} className="text-white text-xs font-bold bg-black/40 px-2 py-1 rounded-lg">{l}</span>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button onClick={closeCamera}
                  className="bg-white/20 backdrop-blur text-white px-5 py-2 rounded-full font-medium hover:bg-white/30 transition">
                  Cancel
                </button>
                <button onClick={capturePhoto}
                  className="bg-red-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition">
                  <Camera size={22} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Image Preview + Analyze ── */}
        <AnimatePresence>
          {preview && !cameraOpen && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white">
                <img src={preview} alt="Test card" className="w-full max-h-72 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                {/* Well labels overlay */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-around pb-4">
                  {["Anti-A", "Anti-B", "Anti-D"].map((l) => (
                    <span key={l} className="text-white text-xs font-bold bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                      {l}
                    </span>
                  ))}
                </div>
                <button onClick={reset}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-slate-600 hover:bg-white transition shadow">
                  <X size={16} />
                </button>
              </div>

              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={reset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <RotateCcw size={18} /> Retake
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={analyzeImage}
                  disabled={loading}
                  className="flex-2 flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-lg shadow-red-200 hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Analyzing with AI...</>
                  ) : (
                    <><Droplets size={18} /> Detect Blood Group</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Well Results ── */}
        <AnimatePresence>
          {(loading || result) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Well cards */}
              <div className="grid grid-cols-3 gap-4">
                <WellResult label="Anti-A" clumping={result?.anti_a ?? null} loading={loading} />
                <WellResult label="Anti-B" clumping={result?.anti_b ?? null} loading={loading} />
                <WellResult label="Anti-D" clumping={result?.anti_d ?? null} loading={loading} />
              </div>

              {/* Blood Group Result */}
              {result && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-xl p-8 text-center space-y-4"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${BLOOD_COLORS[result.blood_group] || "from-slate-400 to-slate-600"} opacity-5 pointer-events-none`} />
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Predicted Blood Group</p>

                  {overrideMode ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex flex-wrap justify-center gap-2">
                        {allGroups.map(g => (
                          <button key={g} onClick={() => setOverrideGroup(g)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm border-2 transition-all ${overrideGroup === g ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-600 hover:border-red-300"}`}>
                            {g}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setOverrideMode(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50 transition">Cancel</button>
                        <button onClick={saveOverride} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">
                          <Save size={14} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br ${BLOOD_COLORS[result.blood_group] || "from-slate-400 to-slate-600"} shadow-2xl mx-auto`}>
                        <span className="text-5xl font-black text-white">{result.blood_group}</span>
                      </div>
                      {result.confidence != null && (
                        <div className="space-y-1">
                          <p className="text-slate-400 text-xs">Confidence</p>
                          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden max-w-xs mx-auto">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(result.confidence * 100).toFixed(0)}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full bg-gradient-to-r ${BLOOD_COLORS[result.blood_group] || "from-slate-400 to-slate-600"}`}
                            />
                          </div>
                          <p className="text-slate-600 font-semibold text-sm">{(result.confidence * 100).toFixed(0)}% confidence</p>
                        </div>
                      )}
                      {result.reasoning && (
                        <p className="text-slate-400 text-xs italic max-w-md mx-auto mt-2">{result.reasoning}</p>
                      )}
                      {result.overridden && (
                        <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">Manually Overridden</span>
                      )}
                      <button onClick={() => { setOverrideMode(true); setOverrideGroup(result.blood_group); }}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition mt-2 mx-auto">
                        <Edit3 size={12} /> Override prediction
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error State ── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
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
            <button onClick={() => setShowHistory(v => !v)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm transition">
              <History size={16} />
              {showHistory ? "Hide" : "Show"} Detection History ({history.length})
            </button>

            <AnimatePresence>
              {showHistory && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-2"
                >
                  {history.map((h, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${BLOOD_COLORS[h.blood_group] || "from-slate-300 to-slate-500"} flex items-center justify-center text-white font-bold text-sm shadow`}>
                          {h.blood_group}
                        </div>
                        <div>
                          <p className="text-slate-700 font-semibold text-sm">{h.blood_group} {h.overridden ? <span className="text-amber-500 text-xs">(overridden)</span> : ""}</p>
                          <p className="text-slate-400 text-xs">{new Date(h.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span className={h.anti_a ? "text-red-500 font-semibold" : "text-emerald-500 font-semibold"}>A:{h.anti_a ? "+" : "−"}</span>
                        <span className={h.anti_b ? "text-red-500 font-semibold" : "text-emerald-500 font-semibold"}>B:{h.anti_b ? "+" : "−"}</span>
                        <span className={h.anti_d ? "text-red-500 font-semibold" : "text-emerald-500 font-semibold"}>D:{h.anti_d ? "+" : "−"}</span>
                        {h.confidence != null && <span className="text-slate-400">{(h.confidence * 100).toFixed(0)}%</span>}
                      </div>
                    </motion.div>
                  ))}
                  <button onClick={() => { setHistory([]); localStorage.removeItem("bloodGroupHistory"); }}
                    className="text-xs text-slate-400 hover:text-red-500 transition mt-1">
                    Clear history
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
