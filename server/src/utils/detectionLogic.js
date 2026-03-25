/**
 * Vitamin Deficiency Detection scoring logic
 * @param {string[]} symptoms 
 */
export const detectVitaminDeficiency = (symptoms = []) => {
  const scores = {
    "Vitamin D": 0,
    "Vitamin B12": 0,
    "Vitamin A": 0,
    "Vitamin C": 0,
    "Calcium": 0
  };

  const symptomList = symptoms.map(s => s.toLowerCase());

  // Rule: fatigue + hair_loss + brittle_nails -> Vitamin D deficiency (high)
  if (symptomList.includes("fatigue")) scores["Vitamin D"] += 1;
  if (symptomList.includes("hair_loss")) scores["Vitamin D"] += 1;
  if (symptomList.includes("brittle_nails")) scores["Vitamin D"] += 1;

  // Rule: sore_mouth + cracked_lips + fatigue -> Vitamin B12 deficiency (high)
  if (symptomList.includes("sore_mouth")) scores["Vitamin B12"] += 1;
  if (symptomList.includes("cracked_lips")) scores["Vitamin B12"] += 1;
  if (symptomList.includes("fatigue")) scores["Vitamin B12"] += 1;

  // Rule: night_blindness + dry_skin -> Vitamin A deficiency (medium)
  if (symptomList.includes("night_blindness")) scores["Vitamin A"] += 2;
  if (symptomList.includes("dry_skin")) scores["Vitamin A"] += 1;

  // Rule: bleeding_gums + slow_wound_healing -> Vitamin C deficiency (medium)
  if (symptomList.includes("bleeding_gums")) scores["Vitamin C"] += 2;
  if (symptomList.includes("slow_wound_healing")) scores["Vitamin C"] += 1;

  // Rule: muscle_weakness + bone_pain -> Vitamin D + Calcium deficiency (high)
  if (symptomList.includes("muscle_weakness")) {
    scores["Vitamin D"] += 1;
    scores["Calcium"] += 1;
  }
  if (symptomList.includes("bone_pain")) {
    scores["Vitamin D"] += 1;
    scores["Calcium"] += 1;
  }

  // Rule: tingling_hands + memory_issues -> Vitamin B12 deficiency (high)
  if (symptomList.includes("tingling_hands")) scores["Vitamin B12"] += 2;
  if (symptomList.includes("memory_issues")) scores["Vitamin B12"] += 1;

  // Find the highest score
  let bestMatch = Object.entries(scores).reduce((a, b) => b[1] > a[1] ? b : a);
  
  if (bestMatch[1] === 0) {
    return {
      deficiency: "None detected",
      confidence: "Low",
      recommendation: "Maintain a balanced diet and stay hydrated.",
      severity: "low"
    };
  }

  const result = {
    deficiency: bestMatch[0],
    confidence: bestMatch[1] >= 3 ? "High" : (bestMatch[1] >= 2 ? "Medium" : "Low"),
    recommendation: "",
    severity: bestMatch[1] >= 3 ? "high" : (bestMatch[1] >= 2 ? "moderate" : "low")
  };

  // Assign recommendations based on deficiency
  const recommendations = {
    "Vitamin D": "Increase sun exposure, supplement 1000IU/day, eat fatty fish",
    "Vitamin B12": "Include meat, eggs, or dairy in your diet. Consider B12 supplements if vegan.",
    "Vitamin A": "Eat carrots, sweet potatoes, spinach, and liver.",
    "Vitamin C": "Consume citrus fruits, bell peppers, strawberries, and broccoli.",
    "Calcium": "Increase intake of dairy products, kale, or fortified cereals."
  };

  result.recommendation = recommendations[bestMatch[0]] || "Consult a doctor for advice.";

  return result;
};

/**
 * Disease Detection logic (Dengue/Typhoid)
 * @param {string[]} symptoms 
 * @param {object} labValues 
 */
export const detectDisease = (symptoms = [], labValues = {}) => {
  const symptomList = symptoms.map(s => s.toLowerCase());
  const feverTemp = parseFloat(labValues.fever) || 0;
  const platelets = parseInt(labValues.platelets) || 200000;
  const feverDuration = parseInt(labValues.feverDuration) || 0;
  const widalTestPos = !!labValues.widalTest;

  // Dengue detection rules
  if (feverTemp > 38.5 && platelets < 100000 && symptomList.includes("rash")) {
    return {
      disease: "Dengue",
      probability: "High",
      recommendation: "Seek immediate medical attention. Hydrate aggressively. Do not take NSAIDs.",
      severity: "high",
      disclaimer: "This is an assistive tool, not a clinical diagnosis. Consult a certified physician."
    };
  }

  if (feverTemp > 38.0 && (symptomList.includes("headache") || symptomList.includes("joint_pain"))) {
    return {
      disease: "Dengue",
      probability: "Moderate",
      recommendation: "Monitor temperature, stay hydrated, and consult a doctor if symptoms worsen.",
      severity: "moderate",
      disclaimer: "This is an assistive tool, not a clinical diagnosis. Consult a certified physician."
    };
  }

  // Typhoid detection rules
  if (feverTemp > 38.5 && feverDuration >= 5 && (symptomList.includes("abdominal_pain") || widalTestPos)) {
    return {
      disease: "Typhoid",
      probability: "High",
      recommendation: "Start physician-prescribed antibiotics. Ensure clean drinking water.",
      severity: "high",
      disclaimer: "This is an assistive tool, not a clinical diagnosis."
    };
  }

  if (feverTemp > 38.0 && (symptomList.includes("constipation") || symptomList.includes("diarrhea") || symptomList.includes("nausea"))) {
    return {
      disease: "Typhoid",
      probability: "Moderate",
      recommendation: "Maintain hygiene, drink boiled water, and consult a doctor for a Widal test.",
      severity: "moderate",
      disclaimer: "This is an assistive tool, not a clinical diagnosis."
    };
  }

  return {
    disease: "None detected",
    probability: "Low",
    recommendation: "Monitor your health and consult a physician if you feel unwell.",
    severity: "low",
    disclaimer: "This is an assistive tool, not a clinical diagnosis."
  };
};
