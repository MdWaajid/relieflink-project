# 🌐 ReliefLink — Smart Disaster Relief Resource Coordination Platform

> **ReliefLink** connects disaster relief camps with NGOs in real time — using AI-powered smart matching, priority scoring, and live notifications to get the right resources to the right people as fast as possible.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup-fastapi--python)
  - [Frontend Setup](#2-frontend-setup-react--vite)
- [Running the Application](#-running-the-application)
- [User Roles & Dashboards](#-user-roles--dashboards)
- [API Reference](#-api-reference)
- [Environment Variables](#-environment-variables)

---

## 🔍 Overview

ReliefLink is a full-stack web platform designed for disaster relief coordination. It enables three types of users:

| Role | Description |
|------|-------------|
| 🏕️ **Camp** | Disaster relief camps that submit resource requests (food, water, medicine, etc.) |
| 🤝 **NGO** | Non-Governmental Organizations that manage and dispatch resources |
| 🛡️ **Admin** | System administrators who oversee all operations, analytics, and can reassign/override |

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **SQLAlchemy** | ORM for database models |
| **SQLite** *(default)* | Local database (no setup needed!) |
| **Supabase / PostgreSQL** | Optional cloud database |
| **Python 3.10+** | Runtime |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Styling |
| **Chart.js** | Analytics charts |
| **Leaflet / React-Leaflet** | Interactive disaster map |
| **Supabase JS** | Auth & real-time |
| **Axios** | HTTP requests to backend |

---

## 📁 Project Structure

```
relief link/
├── backend/                    # FastAPI Python Backend
│   ├── main.py                 # All API routes & app entrypoint
│   ├── database.py             # DB connection (SQLite or Supabase)
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── seed.py                 # Demo data seeder (auto-runs on empty DB)
│   ├── requirements.txt        # Python dependencies
│   ├── relieflink.db           # SQLite database file (auto-created)
│   └── engines/
│       ├── matching.py         # Smart NGO Matching Engine (RMS Algorithm)
│       └── priority.py         # Auto Priority Scoring Engine
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── App.jsx             # Root app component + routing by role
│   │   ├── api.js              # Centralized API calls to backend
│   │   ├── supabaseClient.js   # Supabase auth client
│   │   ├── main.jsx            # React entry point
│   │   └── components/
│   │       ├── AuthModal.jsx           # Login/Signup screen
│   │       ├── Navbar.jsx              # Navigation bar
│   │       ├── CampDashboard.jsx       # Camp view: submit requests
│   │       ├── NgoDashboard.jsx        # NGO view: manage resources & requests
│   │       ├── AdminDashboard.jsx      # Admin view: full system overview
│   │       ├── AnalyticsCharts.jsx     # Charts for analytics page
│   │       ├── GoogleDisasterMap.jsx   # Interactive map component
│   │       └── NotificationCenter.jsx  # Live notifications drawer
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── relieflink.db               # Root-level SQLite DB (backup)
└── ReliefLink_PRD (1).md       # Product Requirements Document
```

---

## ⚙️ How It Works

### 🔁 Core Workflow

```
Camp submits resource request
         ↓
Priority Engine auto-scores it (Critical / High / Medium / Low)
         ↓
Smart Matching Engine (RMS) scans all NGOs
         ↓
Best matched NGO is notified automatically
         ↓
NGO reviews → Accepts → Dispatches → Delivers
         ↓
Camp receives live notifications at every step
         ↓
Admin can monitor, override priorities, and view analytics
```

### 🧠 Smart Matching Engine (RMS Algorithm)

The **Resource Match Score (RMS)** is calculated for every NGO using 4 weighted factors:

| Factor | Weight | How it's measured |
|--------|--------|-------------------|
| 📍 **Distance** | 35% | Haversine distance from camp to NGO base |
| 📦 **Resource Availability** | 25% | Does the NGO have the requested resource category? |
| 🔢 **Quantity** | 25% | Does the NGO have enough stock to fulfill the request? |
| 🚨 **Priority Alignment** | 15% | Critical requests get priority boosting |

**Score ≥ 0.30** → Automatic match is made and both parties are notified.

### 🎯 Priority Engine

Priority is auto-assigned when a request is submitted based on:
- **Category**: Medicine, Water get highest base priority
- **Quantity**: Large quantities escalate priority
- **Affected Count**: More people affected = higher urgency

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:

- ✅ **Python 3.10+** → [Download](https://www.python.org/downloads/)
- ✅ **Node.js 18+** → [Download](https://nodejs.org/)
- ✅ **npm** (comes with Node.js)
- ✅ A terminal / PowerShell / Command Prompt

---

### 1. Backend Setup (FastAPI + Python)

#### Step 1: Open a terminal and navigate to the backend folder
```powershell
cd "C:\Users\waaji\Desktop\relief link\backend"
```

#### Step 2: Create a Python virtual environment
```powershell
python -m venv venv
```

#### Step 3: Activate the virtual environment
```powershell
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1

# On Windows Command Prompt:
.\venv\Scripts\activate.bat
```

> **Note:** If you get an execution policy error on PowerShell, run:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

#### Step 4: Install dependencies
```powershell
cd
```

#### Step 5: (Optional) Create `.env` file for Supabase or custom DB
If you want to use **Supabase** instead of the local SQLite DB, create a `.env` file inside the `backend/` folder:

```env
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
SUPABASE_KEY=[YOUR_SUPABASE_ANON_KEY]
```

> ⚡ **If you skip `.env`**, the app automatically uses a local SQLite file (`relieflink.db`) — no setup needed!

---

### 2. Frontend Setup (React + Vite)

#### Step 1: Open a **new/separate terminal** and navigate to the frontend folder
```powershell
cd "C:\Users\waaji\Desktop\relief link\frontend"
```

#### Step 2: Install Node.js dependencies
```powershell
npm install
```

#### Step 3: (Optional) Create `.env` file for Supabase Auth
Create a `.env` file inside the `frontend/` folder:
```env
VITE_SUPABASE_URL=https://[YOUR_PROJECT].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```

> ⚡ **If you skip `.env`**, the app uses placeholder values. The core functionality (connected to local backend) still works without Supabase Auth.

---

## ▶️ Running the Application

You need **two terminals** running simultaneously — one for backend, one for frontend.

### Terminal 1 — Start Backend API
```powershell
cd "C:\Users\waaji\Desktop\relief link\backend"
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

✅ Backend will be live at: **http://localhost:8000**  
📖 API Docs (Swagger UI): **http://localhost:8000/docs**

> On first launch, if the database is empty, demo data is seeded automatically!

---

### Terminal 2 — Start Frontend Dev Server
```powershell
cd "C:\Users\waaji\Desktop\relief link\frontend"
npm run dev
```

✅ Frontend will be live at: **http://localhost:5173**

---

### 🎉 Open in Browser

Go to **http://localhost:5173** and you'll see the login screen.

---

## 👤 User Roles & Demo Logins

Each user role and entity now has its **own separate login account**. You can log in using Email & Password or click the quick login presets on the sign in screen.

### 🔑 Demo Accounts

| Role | Entity / Name | Email | Password |
|------|---------------|-------|----------|
| 🏕️ **Camp Manager** | Central Flood Shelter Camp #1 | `camp1@relieflink.org` | `camp123` |
| 🏕️ **Camp Manager** | St. Mary's Relief Camp #2 | `camp2@relieflink.org` | `camp123` |
| 🏕️ **Camp Manager** | Riverside High School Shelter #3 | `camp3@relieflink.org` | `camp123` |
| 🤝 **NGO Coordinator** | Red Cross Emergency Relief | `ngo1@relieflink.org` | `ngo123` |
| 🤝 **NGO Coordinator** | Humanitarian Water Corps | `ngo2@relieflink.org` | `ngo123` |
| 🛡️ **District Authority** | Authority Admin Command | `admin@relieflink.org` | `admin123` |

### 🏕️ Camp Dashboard
- **Private View**: Camp managers see **ONLY their assigned Relief Area Camp's details** and resource requests (no access to other camps' private operations).
- **Dynamic Units & Auto Priority**: Selecting a category automatically sets the correct unit (e.g. `food` ➔ `Packets`, `drinking_water` ➔ `Liters`, `medicine` ➔ `Kits`, `blankets` ➔ `Pieces`, `shelter` ➔ `Tents`) and updates priority previews in real time based on category, quantity, and affected count.
- Submit resource requests and track real-time status: `Pending → Matched → Accepted → Dispatched → Delivered`.

### 🤝 NGO Dashboard
- **Private View**: NGO coordinators manage **ONLY their organization's stock** inventory and matched requests.
- **Dynamic Stock Units**: Selecting resource category automatically updates units (e.g. Food shown in Packets, Water in Liters).
- **⛺ Register Relief Area Camp**: NGOs have authorization to create/register a new Relief Area Camp and assign a Camp Manager account.
- Accept requests, mark as dispatched, and confirm deliveries (auto-decrements inventory).

### 🛡️ Admin Dashboard
- **Fixed Authority Protection**: Primary Authority Admin (`admin@relieflink.org`) is fixed and cannot be deleted.
- **Entity Registration**: District Authorities can register new NGO Organizations, Relief Area Camps, and add new Authority Officers.
- Full district command overview across all camps, requests, and NGOs with interactive disaster map & analytics charts.

---

## 📡 API Reference

All API endpoints are available at `http://localhost:8000` and documented interactively at `http://localhost:8000/docs`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/auth/me?role=camp` | Get or create user profile |
| `GET` | `/api/camps` | List all camps |
| `POST` | `/api/camps` | Create a new camp |
| `GET` | `/api/ngos` | List all NGOs |
| `POST` | `/api/ngos` | Register a new NGO |
| `GET` | `/api/resources` | List all resources |
| `POST` | `/api/ngos/{id}/resources` | Add resource to NGO inventory |
| `POST` | `/api/requests` | Submit new resource request (triggers matching!) |
| `GET` | `/api/requests` | List all requests (filter by status/priority/category) |
| `GET` | `/api/requests/{id}/matches` | See RMS match scores for a request |
| `PATCH` | `/api/requests/{id}/status` | Update request status |
| `PATCH` | `/api/requests/{id}/accept` | NGO accepts a request |
| `PATCH` | `/api/requests/{id}/priority` | Admin overrides priority |
| `PATCH` | `/api/requests/{id}/reassign` | Admin reassigns to different NGO |
| `GET` | `/api/notifications` | Get recent notifications |
| `PATCH` | `/api/notifications/{id}/read` | Mark notification as read |
| `GET` | `/api/analytics/overview` | Get full analytics data |

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | No | PostgreSQL URL. If absent, SQLite is used automatically |
| `SUPABASE_URL` | No | Your Supabase project URL |
| `SUPABASE_KEY` | No | Your Supabase service/anon key |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | No | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | Your Supabase anon public key |

---

## 🧪 Quick Test (No Setup Required!)

The fastest way to see ReliefLink running:

1. Start the backend (it auto-seeds demo data)
2. Start the frontend
3. Log in as **Camp** → Submit a food request for 500 units
4. Watch it get auto-matched to an NGO with a match score
5. Switch to **NGO** role → Accept the request and mark it as dispatched
6. Switch to **Admin** → See analytics and the full request pipeline

---

## 📊 Features Summary

- ✅ Role-based authentication (Camp / NGO / Admin)
- ✅ Smart NGO matching using the RMS algorithm
- ✅ Auto priority scoring on request submission
- ✅ Live notification center (polls every 5 seconds)
- ✅ Real-time resource inventory management
- ✅ Interactive analytics with charts
- ✅ Interactive disaster map (Leaflet)
- ✅ Admin priority override & NGO reassignment
- ✅ Auto-seeded demo data for instant testing
- ✅ Works offline with SQLite (no cloud setup needed)
- ✅ Swagger API documentation at `/docs`

---

## 🙏 Built With

- **FastAPI** — Modern Python API framework
- **React + Vite** — Blazing fast frontend
- **Tailwind CSS** — Utility-first styling
- **SQLAlchemy** — Database ORM
- **Supabase** — Auth & cloud database (optional)
- **Chart.js** — Data visualization
- **Leaflet** — Open-source mapping

---

*© 2026 ReliefLink — Smart Disaster Relief Resource Coordination Platform*
