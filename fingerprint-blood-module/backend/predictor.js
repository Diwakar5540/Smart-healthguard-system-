/**
 * Fingerprint-Based Health & Blood Group Predictor
 *
 * This module provides:
 *   1. MOCK MODE  – returns random results for demo purposes
 *   2. AI MODE    – uses Google Gemini Vision API via fetch (zero-dependency)
 */

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ─── 1. MOCK PREDICTOR ─────────────────────────────────────────────────────
export const mockPredict = (mode = "blood") => {
  if (mode === "health") {
    return {
      status: "success",
      mode: "demo",
      predispositions: [
        { condition: "Type 2 Diabetes Risk", risk: "Moderate", basis: "Increased ulnar loop frequency on digits 1 and 4." },
        { condition: "Hypertension Tendency", risk: "Low", basis: "Normal ridge count distribution." },
        { condition: "Metabolic Efficiency", risk: "High", basis: "Clear ridge bifurcation patterns." }
      ],
      health_summary: "DEMO MODE: Dermatoglyphic patterns suggest a efficient metabolic baseline. Ridge density indicates good hydration levels.",
      ridge_quality: "clear"
    };
  }

  const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);
  const groups = shuffle(BLOOD_GROUPS);
  const pattern = ["loop", "whorl", "arch", "double_loop"][Math.floor(Math.random() * 4)];
  
  return {
    status: "success",
    blood_group: groups[0],
    confidence: 0.6 + Math.random() * 0.35,
    pattern_type: pattern,
    mode: "demo",
    reasoning: `DEMO MODE: Analysis of ridge morphology suggests a ${pattern} pattern. Statistical correlation indicates ${groups[0]} as the likely blood group.`,
    all_probabilities: groups.reduce((acc, g, i) => ({ ...acc, [g]: i === 0 ? 0.6 : (0.4 / (BLOOD_GROUPS.length - 1)) }), {}),
    ridge_quality: "clear"
  };
};

// ─── 2. GEMINI VISION AI PREDICTOR (Zero-Dependency Fetch) ──────────────────
export const geminiPredict = async (base64Image, mimeType, apiKey, mode = "blood") => {
  const groceriesKey = typeof import.meta !== "undefined" ? import.meta.env?.VITE_GROQ_API_KEY : null;
  const isBlood = mode === "blood";
  const uniqueId = `FORENSIC-ID-${Math.random().toString(36).substring(2, 12).toUpperCase()}-${Date.now()}`;
  const promptText = isBlood 
    ? `You are an elite forensic biometric analyst. [Session: ${uniqueId}]
       TASK: Perform a fresh, independent morphological analysis of this fingerprint ridge flow.
       1. Avoid all default biases (e.g., do not default to O+ unless clearly indicated by the pattern).
       2. RECONSTRUCT: Map the core and delta points.
       3. CORRELATE: Use dermatoglyphic logic to determine ABO group and Rh factor.
       Respond ONLY with this JSON structure:
       {"blood_group": "A+|A-|B+|B-|AB+|AB-|O+|O-", "confidence": 0.85, "pattern_type": "loop|whorl|arch|double_loop", "reasoning": "A unique, 2-sentence technical forensic breakdown of THIS image.", "all_probabilities": {"A+": 0.x, "..."}, "status": "success"}`
    : `You are a clinical geneticist. [Session: ${uniqueId}]
       Analyze this fingerprint for metabolic and cardiovascular biomarkers.
       Respond ONLY with JSON: {"predispositions": [{"condition": "...", "risk": "Low|Mod|High", "basis": "..."}], "health_summary": "...", "status": "success"}`;

  let lastError = "Discovery failed";

  // ──── 1. TRY GEMINI (Discovery + Call) ───────────────────────────────────
  if (apiKey) {
    let discoveredModel = "gemini-1.5-flash"; 
    let apiVersion = "v1beta";
    
    for (const ver of ["v1beta", "v1"]) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/${ver}/models?key=${apiKey}`);
        const data = await res.json();
        if (data.models) {
          const best = data.models.find(m => m.supportedGenerationMethods.includes("generateContent") && (m.name.includes("flash") || m.name.includes("vision")));
          if (best) { discoveredModel = best.name.split("/").pop(); apiVersion = ver; break; }
        }
      } catch (e) { console.warn(`[AI] ${ver} discovery failed.`, e); }
    }

    try {
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${discoveredModel}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: mimeType, data: base64Image } }] }],
          generation_config: { temperature: 0.9 }
        })
      });
      const data = await response.json();
      if (!data.error) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return JSON.parse(text.replace(/```json|```/g, "").trim());
      }
      lastError = data.error?.message || "Empty response";
    } catch (err) { lastError = err.message; }
  }

  // ──── 2. FALLBACK TO GROQ VISION ──────────────────────────────────────────
  if (groceriesKey) {
    try {
      console.log("[AI] Falling back to Groq Llama Vision...");
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groceriesKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.2-11b-vision-preview",
          messages: [
            { role: "user", content: [
              { type: "text", text: promptText },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
            ]}
          ],
          response_format: { type: "json_object" }
        })
      });
      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (err) { lastError = `Groq failed: ${err.message}`; }
  }

  throw new Error(`AI Analysis Failed (Gemini & Groq). Error: ${lastError}`);
};
