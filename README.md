# 📦 GoodStock — Enterprise Inventory Management System

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue)
![Vite](https://img.shields.io/badge/Vite-Fast%20Build-purple)
![Supabase](https://img.shields.io/badge/Database-Supabase-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

**GoodStock** is a modern **enterprise-grade inventory management platform** designed for businesses that require **real-time stock tracking, warehouse coordination, and operational transparency**.

The system acts as a **central logistics hub** where warehouse managers can track inventory, perform stock movements, and manage operations across multiple locations.

Built using **React + Supabase**, GoodStock delivers **high performance, modern UI, and real-time data synchronization**.
---

# 🎯 Project Goals

GoodStock was built to simulate a **real-world ERP inventory module** similar to systems used in large logistics and manufacturing companies.

The project focuses on:

* Warehouse inventory management
* Real-time stock visibility
* Operational workflow automation
* Clean enterprise UI
* Fast frontend performance

---

# ✨ Key Features

## 📦 Product Catalog

* SKU-based product tracking
* Advanced product listing
* Kanban and List views
* Smart sorting by stock, date, name, or SKU

---

## 🔄 Inventory Operations

Perform all warehouse operations in one place:

* **Receipts** — Add incoming stock
* **Deliveries** — Ship products to customers
* **Internal Transfers** — Move stock between warehouses
* **Inventory Adjustments** — Correct stock discrepancies

---

## ⚡ Smart Replenishment

Low stock items can be replenished instantly using a **one-click replenish button** directly from the product catalog.

---

## 📊 Real-Time Dashboard

Monitor warehouse performance with live operational metrics:

* Low stock alerts
* Out-of-stock warnings
* Pending warehouse operations
* Quick navigation to issues

---

## 🏭 Multi-Warehouse System

Supports complex logistics structures:

* Multiple warehouses
* Multiple storage locations
* Cross-warehouse transfers

---

## 🖨️ Printable Operational Records

Generate professional printable records for:

* Receipts
* Deliveries
* Transfers
* Adjustments

---

## 🎨 Premium Industrial UI

The interface uses a **modern industrial aesthetic** featuring:

* Glassmorphism panels
* Text shuffle animations
* High contrast status indicators
* Smooth UI transitions

---

# 🛠 Technology Stack

| Layer            | Technology            |
| ---------------- | --------------------- |
| Frontend         | React 19 + TypeScript |
| Build Tool       | Vite                  |
| Styling          | Tailwind CSS          |
| Backend          | Supabase              |
| Database         | PostgreSQL            |
| State Management | Zustand               |
| Form Handling    | React Hook Form       |
| Validation       | Zod                   |
| Icons            | Lucide React          |
| Deployment       | Vercel                |

---

# ⚡ Running the Project

The project is designed to run with **one simple command**.

## Windows (Recommended)

Just run:

```
./start.bat
```

The script will automatically:

1. Verify Node.js installation
2. Install required dependencies
3. Start the development server
4. Open the application in your browser

No additional setup is required.

---

## What `start.bat` Does

The script internally performs:

```
npm install
npm run dev
```

This ensures the project works even on **fresh machines without dependencies installed**.

---

# 📂 Project Structure

```
odoo_coreinv
│
├── src
│   ├── components
│   │   ├── ui
│   │   ├── Navbar
│   │   ├── DashboardKpis
│   │   └── Layout
│   │
│   ├── pages
│   │   ├── operations
│   │   ├── products
│   │   ├── settings
│   │   └── auth
│   │
│   ├── store
│   │   └── Zustand global state
│   │
│   ├── lib
│   │   └── Supabase configuration
│   │
│   └── App.tsx
│
├── public
├── database_setup.sql
├── vercel.json
├── package.json
└── start.bat
```

---
📈 Future Improvements

Planned enhancements:

Barcode scanner support

Role-based permissions

Purchase order system

Supplier management

Inventory forecasting

Mobile warehouse interface
