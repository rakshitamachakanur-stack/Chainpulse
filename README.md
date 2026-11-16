# ⚡ ChainPulse v2 — Role-Based MERN Supply Chain Management

Production-grade MERN capstone with **5 separate role interfaces**, full supply
chain workflow, animations, and a dedicated admin panel.

## 🚀 Quick Start

```bash
# 1 — Install all dependencies
cd backend   && npm install
cd ../frontend && npm install
cd ../admin    && npm install

# 2 — Seed the database
cd backend && npm run seed

# 3a — Start everything at once (recommended)
cd ..
npm run dev:all

# 3b — Or start in 3 separate terminals
cd backend   && npm run dev    # → http://localhost:5000
cd frontend  && npm start      # → http://localhost:3000
cd admin     && npm start      # → http://localhost:3001
```

## 🔑 Credentials

| Role        | Email                          | Password  |
|-------------|-------------------------------|-----------|
| Manager     | manager@chainpulse.com        | User@123  |
| Procurement | procurement@chainpulse.com    | User@123  |
| Warehouse   | warehouse@chainpulse.com      | User@123  |
| Logistics   | logistics@chainpulse.com      | User@123  |
| Admin       | admin@chainpulse.com          | Admin@123 |

**Tracking numbers:** `CP-FEDEX-001` · `CP-UPS-002` · `CP-DHL-003`

## 🎨 Design System

| Token     | Value     | Used for                     |
|-----------|-----------|------------------------------|
| Forest    | `#2C5F5D` | Warehouse accent, success     |
| Copper    | `#C68642` | Primary CTA, procurement      |
| Cream     | `#F8F4EC` | Primary text                  |
| Slate     | `#2E3239` | Borders, muted backgrounds    |
| Pine      | `#5E8B7E` | Secondary elements            |
| Sage      | `#7AAE8E` | Logistics accent              |
| Brick     | `#B85C38` | Manager accent, warnings      |

## ✨ Animations Integrated

- **NetworkBackground** — Login page canvas (warehouse node graph)
- **TypingTerminal / CyclingTerminal** — Login page live status lines
- **KpiCard** — CountUp numbers + Framer Motion stagger on all dashboards
- **ShipmentTimeline** — Animated progress bar in shipment detail view
- **LiveClock** — Real-time clock in topbar (HH:MM:SS with copper seconds)
- **LiveIndicator** — Pulsing live dot in topbar
- **PageWrapper** — Smooth fade+slide on every page transition
- **useLiveDataPulse** — Auto-updates shipment rows every 9s (row-flash)
- **DeltaBadge** — Animated ↑/↓ on KPI cards
- **DashboardBackground** — Dot-grid on all page backgrounds
- **copper-divider** — Gradient divider line on dashboards
- **skeleton loaders** — While data is loading on all pages
- **row-updated / row-new** — Flash animation when live data changes
- **low-stock** — Pulse border on critical inventory rows

## 🔄 Workflow

```
Warehouse low stock → notification to Procurement
Procurement creates Requisition → submits for approval
Manager approves → Procurement converts to PO
Goods arrive → Warehouse creates GRN → verifies (inventory auto-updates)
Logistics creates Shipment → updates status → marks delivered
Manager monitors KPIs live (refetches every 15s)
Admin sees all activity in real-time
```

## 🚀 Advanced Features Added

### 1. 🗺️ Live Shipment Map (Leaflet & OpenStreetMap)
- **Real-Time Moving Markers:** Shipments render as moving vehicle markers (`🚚` / `✈️`) on an interactive Leaflet/OpenStreetMap map.
- **Socket.io Sync:** Updated in real time via existing Socket.io events (`shipment:location` & `shipment:updated`).
- **Interactive Route Polylines:** Visualizes route paths from origin city to destination with animated dashed progress lines.
- **Controls & HUD:** Live fleet radar HUD with carrier filtering (FedEx, UPS, DHL), vehicle speedometers, and live motion simulator toggle.
- **Where to find:** In **Logistics** (`/tracking` & `/shipments`) and **Manager** (`/shipments`).

### 2. 📈 Demand Forecasting & Smart Reorder
- **Predictive Engine:** Calculates monthly usage per product from order history (weighted moving average and linear regression trend).
- **Stock Depletion Countdown:** Computes daily burn rates and forecasts exact days of stock remaining (`🚨 Critical <7d`, `⚠️ Warning <18d`, `✅ Healthy`).
- **1-Click Auto-Draft Requisition:** Auto-generates a draft Purchase Requisition with suggested reorder quantities based on target safety buffers.
- **Batch Reorder:** One-click button to replenish all critical inventory items at once, connecting directly to procurement approvals.
- **Where to find:** In **Warehouse** (`/inventory`), **Procurement** (`/requisitions`), and **Manager** (`/inventory`).

### 3. 🏆 Supplier Scorecards & Leaderboard
- **3-Factor Quality Rating:**
  - **On-Time Delivery Rate (%):** Actual delivery vs expected delivery date with late/on-time counts.
  - **GRN Defect / Rejection Rate (%):** Rejection percentage from Goods Receipt Notes, tracking damaged items and defect reasons.
  - **Lead-Time Accuracy (%):** Variance between stated supplier lead time vs measured average delivery duration.
- **Composite Score & Tier:** Weighted score (`40% On-Time + 35% Quality + 25% Lead Time`) with tiers: `A+ (Elite)`, `A (Preferred)`, `B (Reliable)`, `C (Under Review)`.
- **Ranked Chart & Podium:** Recharts comparative bar chart and ranked leaderboard with 🥇 Gold, 🥈 Silver, 🥉 Bronze badges.
- **Where to find:** In **Manager** (`/suppliers`) and **Procurement** (`/suppliers`).

### 4. 📄 PDF & QR Support
- **Purchase Order PDF:** Download official corporate Purchase Order documents (`PO-{number}.pdf`) with company branding, vendor details, facility address, line items table, and authorized signatures.
- **Goods Receipt Note (GRN) PDF:** Download official receiving & inspection certificates (`GRN-{number}.pdf`) with ordered vs received vs rejected counts, condition, and verification sign-off.
- **QR Code Shipping Labels:** Generates high-density dynamic QR codes on shipments pointing to `/tracking?tn={trackingNumber}`. Includes a printable shipping label preview and one-click label printing (`🖨️ Print Label`).
- **Where to find:** PO PDF in `/orders` (Procurement & Manager); GRN PDF in `/receiving` (Warehouse); QR in `/shipments` & `/tracking` (Logistics & Manager).

### 5. 🤖 AI Supply Chain Copilot
- **Live Assistant Drawer:** Floating interactive assistant in the bottom right corner of all pages.
- **Live MongoDB Context:** Inquires directly against active inventory, delayed shipments, supplier defect rates, and pending approvals.
- **Natural Language Answers:** Responds to manager questions like *"Which items will run out this week?"*, *"Which supplier is most delayed?"*, *"Show active shipments"*, and *"What are our pending approvals?"*.
- **Where to find:** Available on all authenticated pages via the floating bottom-right copilot button.

## 🏗️ Stack

| Layer      | Tech                                                    |
|------------|----------------------------------------------------------|
| Backend    | Node.js, Express, Mongoose, JWT, bcryptjs, Socket.io    |
| Frontend   | React 18, React Router v6, TanStack Query v5, Socket.io |
| Animations | Framer Motion 11, react-countup                         |
| Charts     | Recharts                                                |
| Database   | MongoDB                                                 |
| Styling    | Tailwind CSS v3 + custom CSS variables                  |

## 🪟 Login not working? (Windows)
1. MongoDB must be running (Services → "MongoDB Server"), then run `npm run seed` in `backend` **once**.
2. Start backend FIRST and wait for `✅ MongoDB connected`.
3. Check http://localhost:5000/api/health in the browser.
4. `.env` now uses `127.0.0.1` instead of `localhost` for MongoDB (avoids IPv6 `::1` connection failures).
5. Wrong credentials now show a red error toast instead of silently reloading the page.
