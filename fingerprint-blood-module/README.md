# Fingerprint-Based Blood Group Detection Module

> **Self-contained module** — no existing project files are modified.

## 🧬 Scientific Basis

Fingerprint ridge patterns (loops, whorls, arches) have a genetic correlation with blood group traits. Blood group-specific antigens are secreted through sweat on fingerprint ridges. This module uses AI (or a mock predictor) to analyze fingerprint ridge patterns and predict the most likely blood group.

Research references:
- Bharadwaja et al. (2004) — Dermatoglyphics and ABO blood groups
- Rastogi & Pillai (2010) — Fingerprint patterns and blood group distribution
- Mehta & Mehta (2015) — Correlation of fingerprint patterns with blood groups

---

## 📁 Module Structure

```
fingerprint-blood-module/
├── frontend/
│   └── FingerprintDetect.jsx      ← React UI component
├── backend/
│   ├── fingerprintRoute.js        ← Express POST route
│   ├── preprocess.js              ← Image preprocessing pipeline
│   └── predictor.js               ← Mock + Gemini AI prediction logic
├── model/
│   └── .gitkeep                   ← Placeholder for trained CNN model
└── README.md                      ← This file
```

---

## 🔌 Integration Guide

### Step 1: Add the Frontend Route

**File to edit:** `client/src/App.jsx`

Add the import at the top:
```jsx
import FingerprintDetect from "../../fingerprint-blood-module/frontend/FingerprintDetect.jsx";
```

Add the route inside `<Routes>` (before the catch-all `*` route):
```jsx
<Route path="/fingerprint-detect" element={
  <ProtectedRoute>
    <MainLayout><FingerprintDetect /></MainLayout>
  </ProtectedRoute>
} />
```

### Step 2: Add Navigation Link

**File to edit:** `client/src/components/layout/Sidebar.jsx`

Add import for the Fingerprint icon (already imported, but add `Scan` if preferred):
```jsx
import { ..., Fingerprint } from "lucide-react";
```

Add new sidebar item inside `<nav>`:
```jsx
<SidebarItem to="/fingerprint-detect" icon={Fingerprint} label="Fingerprint Detect" collapsed={collapsed} />
```

### Step 3 (Optional): Mount Backend Route

If using the server-side mock predictor instead of client-side Gemini:

**File to edit:** `server/src/app.js`

```js
import fingerprintDetectRoutes from "../../fingerprint-blood-module/backend/fingerprintRoute.js";
app.use("/api", fingerprintDetectRoutes);
```

> **Note:** The frontend component works standalone using client-side Gemini Vision AI or built-in mock predictor. The backend route is only needed if you want server-side prediction.

---

## ⚙️ Configuration

### Gemini API Key (for AI Mode)

The module reads the API key from the client `.env` file:

```
VITE_GEMINI_API_KEY=your_key_here
```

Get a free key at: https://aistudio.google.com/

If no API key is configured, the module automatically falls back to **Demo Mode** with mock predictions.

### Demo Mode vs AI Mode

| Feature | Demo Mode | AI Mode |
|---------|-----------|---------|
| API Key Required | ❌ | ✅ |
| Real Image Analysis | ❌ | ✅ |
| Badge Displayed | "Demo Mode" (amber) | "AI Mode" (green) |
| Prediction Source | Pattern correlation table | Gemini Vision API |

---

## 🧠 Model Architecture (for future CNN training)

**Recommended:** MobileNetV2 (lightweight, mobile-friendly)

- **Input:** 224×224×3 preprocessed fingerprint image
- **Output:** Softmax probabilities for 8 classes (A+, A-, B+, B-, AB+, AB-, O+, O-)
- **Task:** Multi-class classification

### Dataset Structure
```
dataset/
├── A+/     (800–1200 images)
├── A-/     (800–1200 images)
├── B+/     (800–1200 images)
├── B-/     (800–1200 images)
├── AB+/    (800–1200 images)
├── AB-/    (800–1200 images)
├── O+/     (800–1200 images)
└── O-/     (800–1200 images)
```

### Training Configuration
- Split: 80% train / 20% validation
- Data augmentation: ±15° rotation, horizontal flip, zoom (0.8–1.2)
- Optimizer: Adam (lr=0.0001)
- Loss: categorical_crossentropy
- Epochs: 25–50 with early stopping

### Swapping in a Trained Model

Replace the `predictBloodGroup()` function in `backend/predictor.js` with TensorFlow.js inference:

```js
import * as tf from '@tensorflow/tfjs-node';
const model = await tf.loadLayersModel('file://./model/mobilenetv2_bloodgroup/model.json');

export async function predictBloodGroup(imageBuffer) {
  const tensor = preprocessAndConvertToTensor(imageBuffer);
  const prediction = model.predict(tensor);
  const probs = prediction.arraySync()[0];
  const maxIdx = probs.indexOf(Math.max(...probs));
  return {
    blood_group: BLOOD_GROUPS[maxIdx],
    confidence: probs[maxIdx],
    status: "success"
  };
}
```

---

## 📋 Image Preprocessing Pipeline

Applied automatically on the client side before analysis:

1. **Resize** → 224×224 pixels (center-crop to maintain aspect ratio)
2. **Grayscale** → Luminance conversion (0.299R + 0.587G + 0.114B)
3. **Contrast Enhancement** → Histogram stretching (1st–99th percentile)
4. **RGB Conversion** → 3-channel for CNN input
5. **Normalization** → Pixel values scaled to [0, 1]
6. **Quality Assessment** → Mean brightness, std deviation, contrast ratio

---

## 🔧 No New Global Dependencies

This module uses only packages already present in the project:
- React, Framer Motion, lucide-react, react-hot-toast (frontend)
- Express, multer (backend, already installed)
- Canvas API (browser-native, no install needed)

---

## 📄 API Reference

### Client-Side (Direct Gemini Call — Default)
The component calls the Gemini Vision API directly from the browser, same pattern as the existing Blood Group Detector and Vitamin Analyzer.

### Server-Side (Optional Backend Route)

```
POST /api/fingerprint-detect
Content-Type: multipart/form-data

Field: fingerprint_image (JPG/PNG/WebP)
```

**Success Response:**
```json
{
  "blood_group": "A+",
  "confidence": 0.91,
  "pattern_type": "loop",
  "mode": "demo",
  "status": "success",
  "all_probabilities": {
    "A+": 0.20, "A-": 0.07, "B+": 0.20, "B-": 0.06,
    "AB+": 0.10, "AB-": 0.04, "O+": 0.25, "O-": 0.08
  }
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Image quality too low. Please retake."
}
```
