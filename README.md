# 📦 GoodStock | Enterprise Inventory Management

**GoodStock** is a high-fidelity, industrial-grade inventory management solution built with modern web technologies. Designed for speed, reliability, and precision, it provides businesses with a powerful operations hub to track products, manage transfers, and optimize warehouse logistics.

---

## 🚀 Quick Start

### Method 1: The One-Click Way (Windows)
If you are on Windows, simply double-click the `start.bat` file in the root directory. This script will:
1.  Verify your Node.js installation.
2.  Install all necessary dependencies (`npm install`).
3.  Launch the development server.
4.  Open the application in your default browser.

```bash
./start.bat
```

### Method 2: Manual Developer Setup
If you prefer the command line or are on a non-Windows OS:

1.  **Clone & Enter**:
    ```bash
    git clone <repository-url>
    cd odoo_coreinv
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env` file in the root and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  **Launch**:
    ```bash
    npm run dev
    ```

---

## ✨ Key Features

-   **🔍 Advanced Product Catalog**: Browse inventory via Kanban or List views. Features multi-criteria sorting by Date, Stock, Name, or SKU.
-   **🔄 Operations Hub**: Specialized forms for **Receipts**, **Deliveries**, **Internal Transfers**, and **Inventory Adjustments**.
-   **⚡ Stock Replenishment**: One-click "Replenish" shortcut from the product list to instant receipt generation.
-   **📊 Real-time Dashboard**: Live KPIs for low stock, out-of-stock items, and pending operations with direct navigation.
-   **🎨 Premium UI/UX**: Industrial aesthetic featuring text-shuffle animations, high-contrast status bars, and glassmorphism.
-   **🌐 Multi-Location Support**: Track stock across multiple warehouses and locations with cross-site availability hints.
-   **🖨️ Professional Records**: Built-in print functionality for all operational documents (Receipts, Transfers, etc.).

---

## 🛠️ Technology Stack

-   **Frontend**: React 19 (TypeScript)
-   **Build Tool**: Vite
-   **Styling**: Tailwind CSS 4.0
-   **Database/Auth**: Supabase (PostgreSQL)
-   **State Management**: Zustand
-   **Form Handling**: React Hook Form + Zod
-   **Icons**: Lucide React

---

## 📂 Project Structure

```text
odooxindus/
├── src/
│   ├── components/         # Reusable UI & Logic components
│   │   ├── ui/             # Atomic design components (Button, Input, etc.)
│   │   ├── DashboardKpis    # Live performance metrics
│   │   ├── Navbar          # Navigation & Branding
│   │   └── Layout          # Base structure
│   ├── pages/              # View-level components
│   │   ├── operations/     # Receipts, Deliveries, Transfers, Adjustments
│   │   ├── products/       # Catalog & Product Management
│   │   ├── settings/       # Warehouse, Location, & Profile settings
│   │   └── auth/           # Login & Multi-step Signup
│   ├── lib/                # Third-party configurations (Supabase)
│   ├── store/              # Zustand global state (Auth, UI)
│   └── App.tsx             # Route configurations
├── public/                 # Static assets & Icons
├── database_setup.sql      # Core schema & Demo data
├── vercel.json             # Deployment configurations
├── package.json            # Dependencies & Scripts
└── start.bat               # Windows automation script
```

---

## ⚙️ Database Configuration

To get started with the data layer, run the provided `database_setup.sql` in your Supabase SQL Editor. This will:
1.  Initialize all necessary tables (Products, Locations, Warehouses, Receipts, etc.).
2.  Setup row-level security (RLS) policies.
3.  Populate the system with 20+ demo products and categories for immediate testing.

---

## 🌐 Deployment

This project is specialized for **Vercel** hosting. Ensure you add your Supabase environment variables in the Vercel dashboard to enable the serverless backend features.

---

Developed with ❤️ for Modern Logistics.
