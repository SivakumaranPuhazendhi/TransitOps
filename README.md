<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/truck.svg" alt="TransitOps Logo" width="80" height="80">
  <h1 align="center">TransitOps</h1>
  <p align="center">
    <strong>Next-Generation Fleet Intelligence & AI Dispatch Platform</strong>
    <br />
    <br />
    <a href="#-the-problem">The Problem</a>
    ·
    <a href="#-the-solution">The Solution</a>
    ·
    <a href="#-key-features">Key Features</a>
    ·
    <a href="#-tech-stack">Tech Stack</a>
    ·
    <a href="#-getting-started">Getting Started</a>
  </p>
</div>

---

## 🚨 The Problem

Modern logistics networks are crippled by fragmented systems. Fleet managers rely on disjointed spreadsheets to track maintenance, safety officers manually audit expiring licenses, and dispatchers assign vehicles based on guesswork rather than geospatial data. The result? High operational costs, delayed deliveries, and dangerous compliance blind spots.

## 💡 The Solution

**TransitOps** is a unified, real-time fleet intelligence platform designed to eliminate operational friction. By combining **geospatial data (PostGIS)**, **natural language AI (Gemini)**, and **real-time automation (Supabase & pg_cron)**, TransitOps transforms fleet management from reactive firefighting into proactive intelligence.

---

## ✨ Key Features (Hackathon Highlights)

### 🤖 Gemini AI Dispatch Copilot
Why click through 5 menus when you can just type? 
Our built-in Copilot understands natural language commands like: *"Dispatch TRK-007 with John Doe for 2000kg to Chennai Port"*. The AI parses the intent, calculates a **Risk Score** based on driver/vehicle history, and proposes a safe dispatch plan for one-click approval.

### 🗺️ PostGIS Geospatial Fleet Tracking
We leverage advanced PostgreSQL PostGIS capabilities to track vehicles. Need a truck ASAP? Enter your coordinates and the system executes a nearest-neighbor spatial query to find the closest **Available** vehicle in milliseconds, instantly calculating ETAs.

### ⚡ Supabase Realtime & Automated Compliance
The database works for you, not the other way around:
- **Database-Level Invariants**: Using raw SQL triggers, if a vehicle logs an unresolved maintenance issue, the database *automatically* locks its status to `In Shop`. It is physically impossible to dispatch an unsafe vehicle.
- **pg_cron Background Jobs**: Automated jobs constantly monitor driver license expiries, flagging them for Safety Officers before compliance is breached.
- **WebSocket Alerts**: Real-time fleet events push directly to the dashboard without refreshing the page.

### 🎮 Immersive 3D UI
First impressions matter. We integrated a custom **Three.js** highway particle grid for the login sequence, paired with an industry-standard dark mode **CartoDB** map interface to deliver a stunning, premium user experience.

---

## 🛠 Tech Stack

**Frontend:**
- React 18 + Vite (TypeScript)
- Tailwind CSS v4 (Glassmorphism & Custom Theming)
- Three.js & React Three Fiber (3D Login Visuals)
- React Leaflet (Live Fleet Map)
- Lucide React (Icons)

**Backend:**
- Node.js + Express (TypeScript)
- Prisma ORM (Schema management & Typed client)
- Google Gemini API (AI Copilot)

**Database (Supabase / PostgreSQL):**
- **PostGIS** (Geospatial querying)
- **pg_cron** (Automated task scheduling)
- **PL/pgSQL Functions & Triggers** (Strict data integrity & auto-locking)
- **Row Level Security (RLS)** (Secure access control)

---

## 👥 Role-Based Workflows

TransitOps provides bespoke dashboards based on the user's role:
- 🚛 **Fleet Manager**: Access the *Fleet Registry* to manage vehicles/drivers, use the *Live Map*, and trigger *AI Dispatches*.
- 🧑‍✈️ **Driver**: Log in to view active trip assignments and update trip statuses.
- 🛡️ **Safety Officer**: Monitor the *Audit Log* and view automated compliance alerts.
- 📊 **Financial Analyst**: Review automated *Fuel & Maintenance* cost aggregations and vehicle profitability metrics.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- A Supabase Project (PostgreSQL)
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SivakumaranPuhazendhi/Odoo-hackathon-.git
   cd Odoo-hackathon-
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create a .env file with your DATABASE_URL and GEMINI_API_KEY
   
   # Push the schema and apply database triggers/functions
   npx prisma db push
   npx prisma db execute --file prisma/migrations/20260712000000_harden_schema_and_add_features/migration.sql --schema prisma/schema.prisma
   
   # Seed the rich demo data
   npx tsx src/seed.ts
   
   # Start the backend server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   
   # Start the Vite development server
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`. 
5. Log in using any demo account (e.g., `manager@transitops.com`) with the password `password`.

---

<div align="center">
  <i>Built with ❤️ for the Hackathon</i>
</div>
