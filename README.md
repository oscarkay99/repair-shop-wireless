# FixHub

A phone repair shop management system built for shops that fix devices — not sell them. FixHub manages the full repair lifecycle from intake to collection, with technician tracking, parts inventory, customer records, warranty coverage, and financial reporting in one place.

---

## Overview

FixHub replaces the combination of paper job cards, WhatsApp threads, and disconnected tools that most repair shops rely on. It brings repairs, customers, parts inventory, payments, warranty, and operations into a single platform with role-based access — so every staff member sees exactly what they need to do their job and nothing more.

The system is a frontend-only application with an in-memory mock data layer — no backend or database required.

---

## Current Modules

The sidebar organises all modules into six groups.

---

### CORE

**Dashboard**
The first screen on login. Shows the repair shop at a glance — active jobs in progress, devices ready for pickup, revenue this month, and jobs completed this month. Includes a repair pipeline with live job counts per stage, a Repair Revenue trend chart with 7/14/30-day period toggles, a device type breakdown donut chart, and a technician workload view.

**Analytics**
Deep performance data across five tabs — Overview, Repairs, Revenue, Customers, and Operations. Covers job throughput, average turnaround time, revenue trends, technician performance comparisons, and customer return rates.

**AI Studio**
A conversational AI assistant. Ask it questions about repair volume, technician performance, or get data-driven recommendations for the shop.

---

### WORKSHOP

**Repairs**
The core job queue. Each card shows the repair ID, device, issue, current status, assigned technician, ETA, and cost estimate. Filterable by status: Received, Diagnosed, Parts Pending, In Progress, Ready, Completed, and Cancelled.

Clicking a card opens a detail panel with the full workflow timeline — Received → Diagnosed → Parts Pending → In Progress → Ready → Collected. The action button advances the job to the next stage with one click. Technicians can add notes at any stage. Parts are tracked individually with their own status (Pending, Ordered, Installed). When the device is ready, a Notify Customer button fires. A View Receipt / View Job Card button opens a print-ready PDF receipt with the full repair breakdown, parts list, technician notes, and warranty certificate.

**Customers**
Every customer the shop has served, displayed as profile cards with segment badge, lifetime value, repair count, and contact details. Filterable by segment. Clicking a card opens the full customer profile with repair history and contact information.

**Warranty**
Two tabs. Warranties lists every active warranty with customer name, device, warranty type, expiry date, and days remaining — filterable by status (Active, Expiring Soon, Expired). Returns & Refunds tracks all return requests with approve/reject actions and refund tracking.

**Parts**
The complete spare parts and components catalogue. Every item has its name, category, stock quantity, reorder level, supplier, and unit price. Covers screens, batteries, charging ports, cameras, housings, keyboards, trackpads, and consumables across iPhone, Android, MacBook, iPad, and Windows devices. Low stock and out-of-stock states are highlighted.

**Payments**
Transaction log for all repair payments. Filter pills: All, Verified, Pending, Needs Review, Failed. Clicking a transaction opens the full detail — reference number, customer, payment method, amount, status, and a context-aware action button.

---

### INTELLIGENCE

**Delivery**
Tracks outgoing device deliveries. Each entry shows customer, priority (High, Medium, Low), status (Pending, In Transit, Delivered), delivery address, assigned driver, zone, and ETA. Filterable by status.

---

### FINANCE

**Expenses**
Full profit and loss tracking. The Overview tab shows monthly revenue, total expenses, and gross profit with a comparison chart. Each expense category shows spend against budget with an On Track, Near Limit, or Over Budget indicator. The Transactions tab logs every income and expense entry. The Budgets tab shows all categories as progress bar cards.

**Reports**
Generates exportable reports. Eight report types: Sales, Inventory, Customer, Repairs, Profit & Loss, Team Performance, Marketing, and Loyalty. Select type, set a date range, choose the format (PDF, Excel, or CSV), and generate.

---

### LOYALTY

**Loyalty**
Customer rewards programme with four tiers: Bronze, Silver, Gold, Platinum. Members earn points on completed repairs. The Members tab shows all enrolled customers with tier, points balance, lifetime spend, and progress to the next milestone. The Tiers, Rewards, and Analytics tabs manage the programme.

---

### OPERATIONS

**Authentication**
Issues official authenticity certificates for devices serviced by the shop. Includes an IMEI checker against known stolen or blocked device records, and a certificate generator for verified devices.

**Team**
Staff directory showing every team member with their role, contact details, and performance snapshot.

**Users**
Creates and manages login accounts for staff. Each account is assigned one of five roles which automatically controls which modules that person can access.

**Audit Logs**
A full activity trail. Records all significant actions in the system — who did what and when — for accountability and review.

**Settings**
Seven sections: Branding, Templates, Automation, Integrations, Team & Roles, Security, and general store configuration.

---

## Role-Based Access

Five staff roles with distinct module access:

| Role | Accessible Modules |
|---|---|
| Admin | All modules |
| Sales Manager | Dashboard, Analytics, Audit Logs, Parts, Payments, Customers, Repairs, Reports, Loyalty, Team |
| Sales Rep | Dashboard, Audit Logs, Repairs, Customers, Parts |
| Technician | Dashboard, Audit Logs, Repairs, Warranty, Parts, Customers |
| Inventory Manager | Dashboard, Analytics, Audit Logs, Parts, Delivery, Reports |

---

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| admin@fixhub.com | admin123 | Admin |
| kofi@fixhub.com | kofi123 | Sales Manager |
| abena@fixhub.com | abena123 | Sales Rep |
| ama@fixhub.com | ama123 | Technician |
| yaw@fixhub.com | yaw123 | Inventory Manager |

---

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v7
- **Data:** In-memory mock store (no backend required)
- **Icons:** Remix Icons
- **Charts:** Recharts
- **State:** React Hooks (useSyncExternalStore for auth)

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `development` | Default branch — all active development work |
| `testing` | QA and staging — promoted from development |
| `main` | Production — promoted from testing only |

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
git clone https://github.com/oscarkay99/repair-shop.git
cd repair-shop
npm install
npm run dev
```

The app runs on `http://localhost:5173` by default.

### Production Build

```bash
npm run build
```

---

## Project Structure

```
src/
├── components/
│   ├── base/              # Reusable UI components (Button, Input, StatCard)
│   └── feature/           # Layout shell (Sidebar, TopBar, AppShell, AuthGuard)
├── hooks/                 # Data hooks (useRepairs, useCustomers, useExpenses, etc.)
├── mocks/                 # Seed/demo data for all modules
├── pages/                 # Page components — one folder per route
├── services/              # Service functions and data layer
├── types/                 # TypeScript interfaces
├── router/                # Route configuration
└── utils/                 # Access control (canAccessModule)
```

---

## Design Tokens

| Token | Value |
|---|---|
| Brand Navy | `#0D1F4A` |
| Brand Gold | `#F5A623` |
| App Background | `#EEF3FF → #E8EFFF` |
| Font | Plus Jakarta Sans |

---

## License

Proprietary software. All rights reserved — FixHub.
