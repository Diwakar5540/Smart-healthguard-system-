# Smart Health Guard System 🛡️🩺

A premium medical assistive platform featuring biometric authentication (WebAuthn), rule-based health diagnostics, and a modern medical-grade UI.

## 🚀 Tech Stack

-   **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Axios, WebAuthn API
-   **Backend**: Node.js, Express.js (ES Modules)
-   **ORM**: Prisma + PostgreSQL (Supabase/Neon)
-   **Security**: JWT (Session-based via httpOnly cookies), bcrypt (Password hashing), WebAuthn (Fingerprint)

## 📁 Architecture

```text
smart-health-guard/
├── client/          # Vite + React (Frontend)
├── server/          # Node.js + Express (Backend)
└── README.md
```

## 🛠️ Setup Instructions

### 1. Database
-   Create a PostgreSQL database (e.g., on [Neon.tech](https://neon.tech/))
-   Note the connection string.

### 2. Backend Setup
```bash
cd server
npm install
```
-   Create a `.env` file based on `.env.example`:
```env
PORT=5000
DATABASE_URL="your_postgresql_url"
JWT_SECRET="your_random_secret"
RP_ID="localhost"
ORIGIN="http://localhost:5173"
CLIENT_URL="http://localhost:5173"
```
-   Deploy Schema: `npx prisma migrate dev --name init`
-   Start Server: `npm run dev`

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

## 🧠 Medical Intelligence Logic

### Vitamin Deficiency
Analyzes a combination of physical symptoms (e.g., fatigue, hair loss) to score and detect potential deficiencies in Vitamin A, B12, C, D, and Calcium.

### Disease Detection
Combines clinical symptoms (e.g., joint pain, rash) with lab values (Platelets, Fever Temperature/Duration) to screen for Dengue and Typhoid with Moderate/High probability.

## 🔒 Fingerprint Authentication Flow

1.  **Register/Login**: Standard email + password authentication.
2.  **Enroll**: After logging in, the user can prompt fingerprint enrollment via the Dashboard.
3.  **Login via Biometric**: On future sessions, users can click "Start Biometric Login" on the Sign-In page to authenticate instantly.

## 📝 Disclaimer
This tool is for educational and assistive purposes only. It is NOT a clinical diagnosis. Always consult a certified physician for medical concerns.
