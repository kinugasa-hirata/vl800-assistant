# Keyence VL-800 Mobile AI Assistant & Troubleshooting App 📱✨

[![Vercel Ready](https://img.shields.io/badge/Vercel-Ready-black?logo=vercel)](https://vercel.com)
[![PWA](https://img.shields.io/badge/PWA-Android%20Ready-0EA5E9)](https://web.dev/progressive-web-apps/)
[![Gemini Vision](https://img.shields.io/badge/AI-Gemini%201.5%20%2F%202.0%20Vision-4285F4)](https://deepmind.google/technologies/gemini/)

A dedicated, offline-first mobile assistant and visual troubleshooting progressive web application (PWA) designed for machine operators and quality control engineers using the **Keyence VL-800 3D Scanner Coordinate Measuring Machine (3Dスキャナ型三次元測定機)**.

Because the dedicated VL-800 control computer operates in an isolated / air-gapped network with no internet connection, operators can run this mobile app directly on their **Google Android smartphone** to diagnose errors, inspect scan issues via camera, and consult step-by-step operational workflows.

---

## 🌟 Key Features

1. **📸 AI Camera Visual Diagnostic**:
   - Snap a photo or upload an image of the PC monitor, error dialog, scan mesh defect, or workpiece surface.
   - Automatically detects root causes (specular glare, alignment trap, stage cabling error, ambient light noise) and provides immediate numbered fix steps.
2. **💬 VL-800 AI Chatbot (Multimodal & Offline Knowledge Engine)**:
   - Grounded on all **8 official Keyence VL-800 manuals** (over 340+ pages indexed).
   - Powered by Gemini 1.5/2.0 Flash API with fallback to local offline knowledge matching.
   - Always cites exact manual names and page numbers (e.g. `[📘 AS_148443 p.19-22]`).
3. **📋 Interactive Guided Workflows**:
   - **新規データ取得編 (New Data Acquisition)**: Workpiece positioning, exposure, HDR, texture ON/OFF, multi-angle stitching.
   - **3D測定編 (3D Dimension Inspection)**: Creating geometric elements, tolerances, PDF/Excel report export.
   - **幾何公差編 (GD&T)**: Datum A/B/C definition, Flatness, Roundness, Perpendicularity, Position MMC.
   - **断面測定 & 多断面測定 (Cross-Section Profile)**: Slicing planes, 2D contour R-radius, chamfer angles.
   - **3D比較測定・カラーマップ (CAD Comparison)**: STEP/IGES CAD import, 3-2-1 alignment, deviation heatmaps.
   - **キャリブレーション & 保守 (Calibration & Maintenance)**: Board OP-88145 alignment, accuracy verification.
4. **📶 100% Offline-First PWA on Android**:
   - Pre-caches all app assets, manual metadata, and diagnostic decision trees via Service Worker.
   - Installable on Android home screen just like a native app.

---

## 🚀 Quick Local Development

```bash
# Navigate to the project directory
cd vl800-assistant

# Start the local development server
node server.js
```
Open **`http://localhost:3000`** in your browser.

---

## 📦 How to Build & Deploy to GitHub & Vercel

### Step 1: Initialize Git and Push to GitHub

1. Open your terminal in the `vl800-assistant` folder:
```bash
cd vl800-assistant
git init
git add .
git commit -m "Initial commit: Keyence VL-800 Mobile AI Assistant PWA"
```

2. Create a new repository on [GitHub](https://github.com/new) (e.g., `vl800-mobile-assistant`).

3. Link and push your code:
```bash
git remote add origin https://github.com/<YOUR_USERNAME>/vl800-mobile-assistant.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy to Vercel (1-Click)

1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **"Add New..."** ➔ **"Project"**.
3. Select your GitHub repository **`vl800-mobile-assistant`** and click **"Import"**.
4. **Configure Project Settings**:
   - **Framework Preset**: `Other` (or leave default)
   - **Root Directory**: `./`
5. **Add Environment Variable** (Optional for live Gemini Vision AI):
   - Name: `GEMINI_API_KEY`
   - Value: `AIzaSy...` (Get your free key at [Google AI Studio](https://aistudio.google.com/))
6. Click **"Deploy"** 🚀!

In less than 30 seconds, Vercel will provide an active HTTPS production URL:
`https://vl800-mobile-assistant.vercel.app`

---

### Step 3: Open & Install on Google Android Phone

1. On your Android phone, open **Google Chrome**.
2. Visit your Vercel URL: `https://vl800-mobile-assistant.vercel.app`
3. Tap the **Three Dots Menu (⋮)** in Chrome.
4. Tap **"Add to Home screen"** (or **"Install app"**).
5. The VL-800 AI Assistant icon will appear on your Android home screen and run as a full-screen, offline-capable native app!

---

## 📂 Project Structure

```text
vl800-assistant/
├── api/
│   ├── chat.js            # Vercel Serverless Function for Gemini Chat API
│   └── diagnose.js        # Vercel Serverless Function for Gemini Multimodal Vision
├── css/
│   └── style.css          # Industrial Precision Dark CSS theme (Stitch-designed)
├── js/
│   ├── app.js             # Main SPA router, state, PWA service worker registration
│   ├── chat.js            # Chatbot UI, prompt chips, speech recognition
│   ├── diagnostic.js      # Camera viewfinder, photo upload, fault detection
│   ├── knowledge_db.js    # Indexed offline manual knowledge base (8 PDFs)
│   └── wizard.js          # Interactive measurement guides & calibration checklist
├── index.html             # Mobile web application shell
├── manifest.json          # Android PWA configuration
├── sw.js                  # Offline Service Worker cache
├── package.json           # Project manifest
├── vercel.json            # Vercel deployment & security headers config
├── server.js              # Local Node.js preview server with Vercel API shim
└── README.md              # Documentation & Deployment guide
```

---

## 📄 Grounded Manual References

- `AS_148443`: 3Dスキャナ型三次元測定機 VL-800 新規データ取得編 簡単操作ガイド
- `AS_148444`: 3Dスキャナ型三次元測定機 VL-800 3D測定編 簡単操作ガイド
- `AS_148445`: 3Dスキャナ型三次元測定機 VL-800 幾何公差編 簡単操作ガイド
- `AS_148446`: 3Dスキャナ型三次元測定機 VL-800 断面測定編 簡単操作ガイド
- `AS_148447`: 3Dスキャナ型三次元測定機 VL-800 多断面測定編 簡単操作ガイド
- `AS_149847`: 3Dスキャナ型三次元測定機 VL-800 3D比較測定・断面比較測定編 簡単操作ガイド
- `AS_159000`: 3Dスキャナ型三次元測定機 VL-800 アプリケーション リファレンスマニュアル (342p)
- `AS_168219`: 3Dスキャナ型三次元測定機 VL-800 ユーザーズマニュアル (ハードウェア・接続・仕様)
