import React, { useState } from 'react';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  ClipboardList, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  ChevronRight,
  Loader2,
  Stethoscope,
  Info,
  ShieldCheck,
  Heart
} from 'lucide-react';

const DISEASE_REFERENCE = {
  dengue: "Platelet count below 100000 (warning) and below 50000 (critical), WBC below 4000 (leukopenia), elevated hematocrit above 45% (hemoconcentration), positive NS1 antigen or Dengue IgM, elevated SGOT/SGPT above 2x normal.",
  typhoid: "WBC low or normal 3000–10000, ESR elevated above 30, CRP elevated above 20, Widal O-antigen titer 1:160 or above significant, Widal H-antigen titer 1:160 or above significant, relative bradycardia pattern."
};

const SECTIONS = [
  {
    id: 'cbc',
    title: 'Complete Blood Count (CBC)',
    icon: Droplets,
    fields: [
      { id: 'wbc', label: 'WBC (White Blood Cell Count)', range: '4000–11000', unit: '/µL' },
      { id: 'rbc', label: 'RBC (Red Blood Cell Count)', range: '4.5–5.5', unit: 'million/µL' },
      { id: 'hemoglobin', label: 'Hemoglobin', range: '12–17.5', unit: 'g/dL' },
      { id: 'hematocrit', label: 'Hematocrit (PCV)', range: '38.3–48.6', unit: '%' },
      { id: 'platelets', label: 'Platelet Count', range: '150000–400000', unit: '/µL' },
      { id: 'mcv', label: 'MCV', range: '80–100', unit: 'fL' },
      { id: 'mch', label: 'MCH', range: '27–33', unit: 'pg' },
      { id: 'mchc', label: 'MCHC', range: '32–36', unit: 'g/dL' },
    ]
  },
  {
    id: 'differential',
    title: 'Differential Count',
    icon: Activity,
    fields: [
      { id: 'neutrophils', label: 'Neutrophils %', range: '50–70', unit: '%' },
      { id: 'lymphocytes', label: 'Lymphocytes %', range: '20–40', unit: '%' },
      { id: 'monocytes', label: 'Monocytes %', range: '2–8', unit: '%' },
      { id: 'eosinophils', label: 'Eosinophils %', range: '1–4', unit: '%' },
    ]
  },
  {
    id: 'inflammatory',
    title: 'Inflammatory Markers',
    icon: Thermometer,
    fields: [
      { id: 'esr', label: 'ESR', range: '0–20', unit: 'mm/hr' },
      { id: 'crp', label: 'CRP', range: '<10', unit: 'mg/L' },
    ]
  },
  {
    id: 'serology',
    title: 'Serology / Infection Tests',
    icon: ShieldAlert,
    fields: [
      { id: 'widalO', label: 'Widal Test (O antigen)', range: '<1:80', placeholder: 'e.g. 1:160' },
      { id: 'widalH', label: 'Widal Test (H antigen)', range: '<1:80', placeholder: 'e.g. 1:40' },
      { id: 'ns1', label: 'NS1 Antigen', type: 'select', options: ['Not Done', 'Positive', 'Negative'] },
      { id: 'dengueIgM', label: 'Dengue IgM', type: 'select', options: ['Not Done', 'Positive', 'Negative'] },
      { id: 'dengueIgG', label: 'Dengue IgG', type: 'select', options: ['Not Done', 'Positive', 'Negative'] },
    ]
  },
  {
    id: 'liver',
    title: 'Liver Function',
    icon: Stethoscope,
    fields: [
      { id: 'sgot', label: 'SGOT/AST', range: '10–40', unit: 'U/L' },
      { id: 'sgpt', label: 'SGPT/ALT', range: '7–56', unit: 'U/L' },
    ]
  }
];

export default function BloodTestDiseaseDetector() {
  const [formData, setFormData] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const runAnalysis = async () => {
    const filledFields = Object.entries(formData).filter(([_, v]) => v && v !== 'Not Done');
    if (filledFields.length === 0) {
      setError("Please fill in at least one test value from your report.");
      return;
    }

    setAnalyzing(true);
    setError(null);

    // Build user message
    const reportSummary = filledFields.map(([id, val]) => {
      const field = SECTIONS.flatMap(s => s.fields).find(f => f.id === id);
      return `- ${field.label}: ${val} ${field.unit || ''} (Normal: ${field.range || 'N/A'})`;
    }).join('\n');

    const userMessage = `Blood Test Report Values:\n${reportSummary}\n\nBased on these values, analyze for Dengue and Typhoid.`;

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) throw new Error("Groq API Key missing in environment.");

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            { 
              role: "system", 
              content: "Act as a clinical diagnostic AI trained on hematology and infectious disease data. Analyze the provided blood test values for patterns consistent with Dengue fever or Typhoid fever. Using this clinical knowledge:\n\n" + 
                      "Dengue: " + DISEASE_REFERENCE.dengue + "\n" +
                      "Typhoid: " + DISEASE_REFERENCE.typhoid + "\n\n" +
                      "Respond ONLY with a valid JSON object in this exact format:\n" +
                      "{\n  \"diagnosis\": \"Dengue | Typhoid | Both | Neither | Inconclusive\",\n  \"confidence\": \"low | medium | high\",\n  \"severity\": \"mild | moderate | severe\",\n  \"dengue_indicators\": [\"list of values that suggest Dengue\"],\n  \"typhoid_indicators\": [\"list of values that suggest Typhoid\"],\n  \"abnormal_values\": [\n    {\n      \"parameter\": \"string\",\n      \"value\": \"string\",\n      \"normal_range\": \"string\",\n      \"status\": \"string\",\n      \"implication\": \"string\"\n    }\n  ],\n  \"recommendation\": \"string\",\n  \"urgency\": \"routine | urgent | emergency\",\n  \"disclaimer\": \"string\"\n}"
            },
            { role: "user", content: userMessage }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(`${data.error.code}: ${data.error.message}`);

      const aiResponse = JSON.parse(data.choices[0].message.content);
      setResults(aiResponse);
    } catch (err) {
      console.error(err);
      setError(`Analysis Error: ${err.message}. Ensure VITE_CLAUDE_API_KEY is configured.`);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="blood-test-addon max-w-6xl mx-auto p-4 font-sans select-none">
      <style>{`
        .blood-test-addon { --medical: #3b82f6; --danger: #ef4444; }
        .form-section { background: white; border-radius: 2rem; border: 1px solid #e2e8f0; padding: 2rem; margin-bottom: 2rem; }
        .section-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; }
        .field-label { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
        .field-input { width: 100%; border-radius: 1rem; border: 2px solid #f1f5f9; padding: 0.75rem 1rem; font-weight: 700; transition: all 0.2s; outline: none; }
        .field-input:focus { border-color: var(--medical); background: white; }
        .field-unit { font-size: 10px; font-weight: 800; color: #cbd5e1; }
        .field-range { font-size: 10px; font-weight: 600; color: #94a3b8; margin-top: 0.25rem; font-style: italic; }
        .analyze-btn { width: 100%; padding: 1.5rem; background: #0f172a; color: white; border-radius: 2rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .analyze-btn:hover { background: #000; transform: scale(1.01); }
        .analyze-btn:active { transform: scale(0.98); }
        .results-panel { animate-in: slide-in-from-bottom; }
        .diagnosis-badge { padding: 3rem; border-radius: 3rem; text-align: center; border: 4px solid; margin-bottom: 2rem; }
        .diagnosis-dengue { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
        .diagnosis-typhoid { background: #fffbeb; border-color: #fef3c7; color: #b45309; }
        .diagnosis-both { background: #7f1d1d; border-color: #991b1b; color: white; }
        .diagnosis-neither { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
        .urgency-badge { border-radius: 1rem; font-weight: 900; font-size: 11px; padding: 0.5rem 1rem; text-transform: uppercase; }
        .urgency-routine { background: #dcfce7; color: #166534; }
        .urgency-urgent { background: #fef3c7; color: #92400e; }
        .urgency-emergency { background: #fee2e2; color: #991b1b; animation: pulse 1s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <header className="mb-10 text-center md:text-left">
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase">Blood Test Disease Detector</h2>
        <div className="flex flex-col md:flex-row items-center gap-4 mt-4">
           <p className="px-4 py-2 bg-slate-100 rounded-2xl text-xs font-bold text-slate-500 flex items-center gap-2">
             <Info size={14} /> Fill in only the values available in your report
           </p>
           <p className="px-4 py-2 bg-blue-100 rounded-2xl text-xs font-bold text-blue-600 flex items-center gap-2">
             <ShieldCheck size={14} /> AI Clinical Analysis Mode
           </p>
        </div>
      </header>

      {!results ? (
        <div className="test-form">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
            {SECTIONS.map((section) => (
              <div key={section.id} className="form-section group">
                <h3 className="section-title">
                  <div className="p-2 bg-slate-50 rounded-xl text-blue-500"><section.icon size={20} /></div>
                  {section.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {section.fields.map((field) => (
                    <div key={field.id} className="field-group">
                      <label className="field-label block">{field.label}</label>
                      <div className="relative">
                        {field.type === 'select' ? (
                          <select 
                            value={formData[field.id] || 'Not Done'}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            className="field-input appearance-none bg-slate-50"
                          >
                            {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                             <input 
                              type="text"
                              placeholder={field.range}
                              value={formData[field.id] || ''}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                              className="field-input"
                            />
                            {field.unit && <span className="field-unit shrink-0 uppercase">{field.unit}</span>}
                          </div>
                        )}
                      </div>
                      <p className="field-range">Normal: {field.range}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={runAnalysis}
            disabled={analyzing}
            className="analyze-btn flex items-center justify-center gap-4"
          >
            {analyzing ? (
              <><Loader2 className="animate-spin" /> AI Pattern Matching...</>
            ) : (
              <><ClipboardList /> Analyze Blood Report</>
            )}
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
              <AlertTriangle size={18} />
              <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="results-panel space-y-10 animate-in fade-in duration-700">
           <div className={`diagnosis-badge ${
             results.diagnosis.includes("Both") ? "diagnosis-both" :
             results.diagnosis.includes("Dengue") ? "diagnosis-dengue" :
             results.diagnosis.includes("Typhoid") ? "diagnosis-typhoid" :
             "diagnosis-neither"
           }`}>
             <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-60 mb-4">Diagnostic Analysis Results</p>
             <h3 className="text-6xl font-black uppercase tracking-tighter mb-6">{results.diagnosis}</h3>
             <div className="flex items-center justify-center gap-4">
                <span className="px-4 py-2 border-2 border-current/20 rounded-full text-xs font-black uppercase tracking-widest">
                  {results.confidence} Confidence
                </span>
                <span className="px-4 py-2 border-2 border-current/20 rounded-full text-xs font-black uppercase tracking-widest">
                  {results.severity} Severity
                </span>
                <span className={`urgency-badge urgency-${results.urgency}`}>
                  {results.urgency} Priority
                </span>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="p-8 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <AlertTriangle size={14} className="text-red-500" /> Key Indicators
                   </h4>
                   <div className="space-y-6">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-red-600 tracking-widest">Dengue Markers</p>
                        <ul className="space-y-2">
                           {results.dengue_indicators.map((item, i) => (
                             <li key={i} className="text-sm font-bold text-slate-700 flex items-center gap-2">
                               <ChevronRight size={14} className="text-red-300" /> {item}
                             </li>
                           ))}
                           {results.dengue_indicators.length === 0 && <li className="text-xs text-slate-400 italic">No markers identified</li>}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Typhoid Markers</p>
                        <ul className="space-y-2">
                           {results.typhoid_indicators.map((item, i) => (
                             <li key={i} className="text-sm font-bold text-slate-700 flex items-center gap-2">
                               <ChevronRight size={14} className="text-amber-300" /> {item}
                             </li>
                           ))}
                           {results.typhoid_indicators.length === 0 && <li className="text-xs text-slate-400 italic">No markers identified</li>}
                        </ul>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Abnormal Value Log</h4>
                 <div className="abnormal-values-list space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {results.abnormal_values.map((item, i) => (
                      <div key={i} className="abnormal-item p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-2 transition-all hover:bg-white hover:shadow-lg">
                         <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.parameter}</p>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              item.status.includes("critical") ? "bg-red-500 text-white" : "bg-slate-200 text-slate-600"
                            }`}>
                              {item.status}
                            </span>
                         </div>
                         <h5 className="text-2xl font-black text-slate-900">{item.value}</h5>
                         <p className="text-[10px] font-bold text-slate-400">Ref Range: {item.normal_range}</p>
                         <p className="text-xs font-medium text-red-600 italic mt-4 border-t border-slate-200/50 pt-3">
                           {item.implication}
                         </p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           <div className="recommendation-box p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Medical Recommendation</p>
                <div className="flex gap-6">
                   <div className="w-1.5 h-auto bg-blue-500 rounded-full" />
                   <div className="space-y-6 flex-1">
                      <p className="text-xl font-medium leading-relaxed italic pr-6 focus:outline-none">
                        "{results.recommendation}"
                      </p>
                      <div className="flex flex-wrap gap-4">
                         <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                            <Clock size={16} className="text-blue-400" />
                            <div>
                               <p className="text-[9px] font-bold uppercase opacity-40">Urgency</p>
                               <p className="text-sm font-black uppercase leading-none">{results.urgency}</p>
                            </div>
                         </div>
                         <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                            <Activity size={16} className="text-red-400" />
                            <div>
                               <p className="text-[9px] font-bold uppercase opacity-40">Risk Level</p>
                               <p className="text-sm font-black uppercase leading-none">{results.severity}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
           </div>

           <footer className="text-center space-y-6 pt-10">
              <p className="disclaimer text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-2xl mx-auto leading-relaxed border-t border-slate-100 pt-8">
                <ShieldAlert size={20} className="mx-auto mb-4 opacity-20" />
                {results.disclaimer}
              </p>
              <button 
                onClick={() => {setResults(null); setFormData({});}} 
                className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-[0.4em]"
              >
                 Reset Analysis and New Report
              </button>
           </footer>
        </div>
      )}
    </div>
  );
}
