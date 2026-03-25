import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Upload, Loader2, ShieldAlert, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

/**
 * FEATURE: Multi-Image Vitamin Deficiency Analyzer (FREE GOOGLE GEMINI VERSION)
 * 
 * SETUP:
 * 1. GET FREE KEY: Visit https://aistudio.google.com/
 * 2. .ENV: VITE_GEMINI_API_KEY=your_free_key_here
 * 3. Render: <VitaminDeficiencyAnalyzer />
 */

const SYMPTOM_VITAMIN_MAP = {
  "skin_pale": ["B12", "Iron", "Folate"],
  "skin_dry_scaly": ["Vitamin A", "Vitamin B3", "Vitamin E"],
  "nails_brittle": ["Biotin", "Iron", "Zinc"],
  "nails_spoon_shaped": ["Iron"],
  "hair_loss": ["Vitamin D", "Iron", "Biotin", "Zinc"],
  "eyes_night_blind": ["Vitamin A"],
  "tongue_smooth_red": ["Vitamin B12", "Vitamin B3", "Iron"],
  "gums_bleeding": ["Vitamin C"],
  "skin_slow_healing": ["Vitamin C", "Zinc"],
  "lips_cracked_corners": ["Vitamin B2", "Vitamin B3", "Iron"]
};

const VITAMIN_INFO = {
  "A": { name: "Vitamin A", foods: ["Carrots", "Spinach", "Liver", "Sweet Potatoes"], severity: "medium" },
  "B1": { name: "Vitamin B1 (Thiamine)", foods: ["Whole grains", "Pork", "Seeds", "Legumes"], severity: "low" },
  "B2": { name: "Vitamin B2 (Riboflavin)", foods: ["Eggs", "Dairy", "Leafy Greens", "Almonds"], severity: "low" },
  "B3": { name: "Vitamin B3 (Niacin)", foods: ["Chicken", "Tuna", "Peanuts", "Mushrooms"], severity: "medium" },
  "B6": { name: "Vitamin B6", foods: ["Chickpeas", "Salmon", "Bananas", "Potatoes"], severity: "low" },
  "B9": { name: "Vitamin B9 (Folate)", foods: ["Dark leafy greens", "Beans", "Citrus fruits"], severity: "medium" },
  "B12": { name: "Vitamin B12", foods: ["Meat", "Fish", "Eggs", "Fortified cereals"], severity: "high" },
  "C": { name: "Vitamin C", foods: ["Citrus", "Bell Peppers", "Strawberries", "Broccoli"], severity: "low" },
  "D": { name: "Vitamin D", foods: ["Sun exposure", "Fatty fish", "Egg yolks", "Supplements"], severity: "high" },
  "E": { name: "Vitamin E", foods: ["Almonds", "Sunflower seeds", "Spinach", "Avocado"], severity: "low" },
  "K": { name: "Vitamin K", foods: ["Kale", "Broccoli", "Cabbage", "Prunes"], severity: "medium" },
  "Iron": { name: "Iron", foods: ["Red meat", "Spinach", "Lentils", "Quinoa"], severity: "high" },
  "Zinc": { name: "Zinc", foods: ["Oysters", "Beef", "Pumpkin seeds", "Cashews"], severity: "medium" },
  "Biotin": { name: "Biotin", foods: ["Eggs", "Sweet Potatoes", "Seeds", "Nuts"], severity: "low" },
  "Magnesium": { name: "Magnesium", foods: ["Dark chocolate", "Avocados", "Nuts", "Seeds"], severity: "medium" },
  "Folate": { name: "Folate", foods: ["Leafy greens", "Citrus", "Liver", "Peanuts"], severity: "medium" }
};

export default function VitaminDeficiencyAnalyzer() {
  const [images, setImages] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 6) {
      setError("Maximum 6 images allowed.");
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, {
          file,
          preview: URL.createObjectURL(file),
          base64: reader.result.split(',')[1],
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const runAnalysis = async () => {
    if (images.length === 0) return;
    setAnalyzing(true);
    setError(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      // 1. DYNAMIC DISCOVERY: Ask Google what models are allowed for this key
      console.log("Discovering available models...");
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const modelsData = await modelsResponse.json();
      
      if (modelsData.error) throw new Error(modelsData.error.message);

      // 2. FIND A VISION MODEL (Gemini 1.5 Flash or Pro)
      const availableModels = modelsData.models.map(m => m.name.split('/').pop());
      console.log("Available models for your key:", availableModels);

      const modelToUse = availableModels.find(m => m.includes('1.5-flash')) || 
                        availableModels.find(m => m.includes('1.5-pro')) || 
                        availableModels.find(m => m.includes('pro-vision')) ||
                        availableModels[0];

      if (!modelToUse) throw new Error("No compatible AI models found for this key.");
      console.log(`🚀 Using discovered model: ${modelToUse}`);

      // 3. RUN ANALYSIS with Strict JSON Mode enabled
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Analyze these body images for signs of vitamin or mineral deficiencies. Respond with a JSON object. Required keys: observations (array), overall_deficiencies (array), confidence (string), severity (string), recommendation (string), disclaimer (string). Observations items need image_index, body_part, symptoms_detected, suspected_deficiencies." },
              ...images.map(img => ({
                inline_data: {
                  mime_type: img.type,
                  data: img.base64
                }
              }))
            ]
          }],
          generationConfig: {
            response_mime_type: "application/json",
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(`Gemini API Error: ${data.error.message}`);

      if (!data.candidates || !data.candidates[0].content) {
        if (data.promptFeedback?.blockReason) {
          throw new Error(`Image blocked by AI Safety: ${data.promptFeedback.blockReason}`);
        }
        throw new Error("AI refused to analyze this image. Try another photo.");
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      const aiResult = JSON.parse(textResponse);
      
      const rawDeficiencies = Array.isArray(aiResult.overall_deficiencies) 
        ? aiResult.overall_deficiencies 
        : (aiResult.overall_deficiencies ? [aiResult.overall_deficiencies] : []);

      const enrichedDeficiencies = rawDeficiencies.map(key => {
        const info = VITAMIN_INFO[key] || { name: key, foods: ["Check with a doctor"], severity: "low" };
        return { ...info, key };
      });

      setResults({ ...aiResult, enrichedDeficiencies });
    } catch (err) {
      console.error("Diagnostic Failure:", err);
      setError(`Diagnostic Error: ${err.message}. Check your API key status & internet.`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="vitamin-analyzer-addon max-w-5xl mx-auto p-4 space-y-8 font-sans">
      <header className="space-y-2">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
          <Camera className="text-medical-500" /> Multi-Image AI Analyzer
        </h2>
        <p className="text-slate-500 font-medium tracking-tight">Free AI Screening Powered by Google Gemini 1.5 Flash.</p>
      </header>

      {/* Upload Zone */}
      <div 
        onClick={() => fileInputRef.current.click()}
        className="upload-zone group border-4 border-dashed border-slate-100 bg-slate-50 hover:border-medical-500 hover:bg-white p-12 rounded-[2rem] transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-4"
      >
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:text-medical-500 shadow-sm border border-slate-100 transition-all">
          <Upload size={32} />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-bold text-slate-700">Scan Symptoms</p>
          <p className="text-sm text-slate-400 font-medium italic">Upload Skin, Nails, Tongue, Eyes, or Hair</p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          multiple 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="preview-grid grid grid-cols-3 md:grid-cols-6 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="preview-thumb relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-md group">
              <img src={img.preview} alt="body part" className="w-full h-full object-cover" />
              <button 
                onClick={(e) => { e.stopPropagation(); setImages(images.filter((_, i) => i !== idx)); }}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              > × </button>
            </div>
          ))}
        </div>
      )}

      {/* Analyze Button */}
      {images.length > 0 && !results && (
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="analyze-btn w-full py-5 bg-slate-900 border-2 border-black hover:bg-black text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {analyzing ? <Loader2 className="animate-spin text-medical-200" /> : <ImageIcon />} 
          {analyzing ? "AI Analysis in Progress..." : "Run Free AI Deficiency Screening"}
        </button>
      )}

      {error && (
        <div className="space-y-4">
          <p className="error-msg p-4 bg-red-50 text-red-600 rounded-xl font-bold uppercase text-[10px] tracking-widest text-center border border-red-100 italic">
            {error.includes("high demand") 
              ? "🕒 Google's FREE AI servers are currently busy. This is normal for the free tier." 
              : error}
          </p>
          {error.includes("high demand") && (
            <button
              onClick={runAnalysis}
              className="w-full py-4 bg-medical-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-medical-600 transition-all flex items-center justify-center gap-2"
            >
              <Loader2 className={analyzing ? "animate-spin" : ""} size={16} /> 
              Retry Analysis Now
            </button>
          )}
        </div>
      )}

      {/* Results Panel */}
      {results && (
        <div className="results-panel space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-6">
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <Info className="text-medical-500" /> Image Observations
               </h3>
               <div className="space-y-4">
                 {results.observations.map((obs, idx) => (
                   <div key={idx} className="observation-card p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-start gap-4 hover:border-medical-200 transition-all">
                     <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 font-bold">
                        {obs.image_index + 1}
                     </div>
                     <div className="space-y-2">
                        <p className="text-xs font-black uppercase text-medical-600 tracking-widest leading-none">{obs.body_part || "Analysis"}</p>
                        <ul className="text-sm font-medium text-slate-600 list-disc pl-4">
                          {Array.isArray(obs.symptoms_detected) 
                            ? obs.symptoms_detected.map((s, i) => <li key={i}>{s}</li>)
                            : <li className="list-none">{obs.symptoms_detected || "No visible symptoms detected"}</li>
                          }
                        </ul>
                     </div>
                   </div>
                 ))}
               </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <AlertTriangle className="text-accent-amber" /> Potential Deficiencies
              </h3>
              <div className="deficiency-summary grid grid-cols-1 gap-4">
                {results.enrichedDeficiencies.map((vit, idx) => (
                  <div key={idx} className={`vitamin-card p-6 rounded-3xl border-2 flex items-center justify-between group transition-all ${
                    vit.severity === 'high' ? 'severity-high bg-red-50 border-red-200 text-red-700 shadow-lg shadow-red-100/20' :
                    vit.severity === 'medium' ? 'severity-medium bg-amber-50 border-amber-200 text-amber-700 shadow-lg shadow-amber-100/20' :
                    'severity-low bg-green-50 border-green-200 text-green-700 shadow-lg shadow-green-100/20'
                  }`}>
                    <div className="space-y-1">
                      <p className="text-2xl font-black leading-none uppercase tracking-tighter">{vit.name}</p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 leading-relaxed">
                         Foods: {vit.foods.slice(0, 3).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <ShieldAlert size={28} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="recommendation-box p-8 bg-slate-900 text-white rounded-[2.5rem] relative overflow-hidden shadow-2xl">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-medical-400 leading-none mb-4">Clinical Recommendation</p>
                <p className="text-lg font-medium leading-relaxed italic border-l-4 pl-6 border-medical-500">
                  "{results.recommendation}"
                </p>
              </div>
              <div className="text-center px-12 border-l border-white/10 hidden md:block">
                 <p className="text-5xl font-black mb-1 text-medical-400 capitalize">{results.confidence}</p>
                 <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">AI Confidence</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          </div>

          <p className="disclaimer text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center py-4 border-t border-slate-100 max-w-2xl mx-auto leading-relaxed">
             {results.disclaimer}
          </p>

          <button onClick={() => {setResults(null); setImages([]);}} className="w-full text-xs font-black text-slate-400 hover:text-medical-600 transition-colors py-4 uppercase tracking-[0.3em] font-sans">
             Start New Analysis
          </button>
        </div>
      )}
    </div>
  );
}
