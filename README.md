# ⚡ Smart & Friendly – AI-Powered Form and Google Sheets Automation Extension

A privacy-conscious Chrome extension that leverages AI to automate form filling and Google Sheets manipulation. Just type your intent – the extension does the rest.

---

## 🖼️ Demo

### 🔹 Before Automation

<img src="assets/1.png" width="600"/>

### 🔹 After Automation

<img src="assets/2.png" width="600"/>

---

## 🚀 Features

- 🔐 **Secure Google Sign-In (OAuth2)**
- ✍️ **Intelligent Form Autofill** (supports MUI, AntD, and custom UIs)
- 📄 **Smart Page & Form Structure Extraction**
- 📊 **Google Sheets Support**:
  - Fill data with prompts
  - Auto-generate charts & tables
- 🔧 **AI Integration via DeepSeek API**
- 🔔 **Visual step-by-step status tracker**
- 📦 **JWT-based auth via secure Chrome storage**

---

## 🛠️ Tech Stack

- Chrome Extension (Manifest V3)
- React + Vite + TypeScript
- Node.js + Express (Backend)
- Tailwind + ShadCN
- OpenAI (LLM for AI)
- Google OAuth2 (via `chrome.identity`)

---

## 🔧 Installation & Development

### 📁 Frontend (Chrome Extension)

```bash
npm install
npm run build
```
