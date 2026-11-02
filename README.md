# Myko Pingpong Stock Systems

A web app for tracking stock and orders in one place, built for sellers on multiple platforms (Shopee, Tokopedia, TikTok Shop). Built as my undergraduate thesis at Universitas Pasundan.

**Live demo:** https://mykopingpongstocksystems.vercel.app

## Features

**Owner**
- Dashboard with stock, order, and sales summaries
- Manage products and variants (photos, search, filters, low-stock indicators)
- Enter, edit, and delete orders, tagged by platform
- Revenue summary, weekly and monthly sales, and product breakdown
- Stock movement history with period filter and pagination

**Manager**
- See active orders
- Process orders and confirm shipment with a receipt photo

**Notifications**
- WhatsApp messages (via Fonnte) for new orders, low stock, and shipments

## Tech stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS, Framer Motion
- Supabase (PostgreSQL and Storage)
- Fonnte WhatsApp API

## Getting started

Requirements: Node.js, a Supabase project, and a Fonnte account (only needed for WhatsApp notifications).

```bash
git clone https://github.com/FawwasSabil25/Myko-Pingpong-Stock-Systems.git
cd Myko-Pingpong-Stock-Systems
npm install
```

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url      # [VERIFY variable names]
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key     # [VERIFY variable names]
FONNTE_TOKEN=your-fonnte-token                  # [VERIFY variable names]
```

Set up the database with the SQL files in the `supabase/` folder, then run:

```bash
npm run dev
```

Open http://localhost:3000.

## Project status

This is a thesis prototype, not a production system. Known limitations:

- No login. The role (owner or manager) is chosen on first setup and stored in the browser.
- Orders are entered manually with a platform label. There is no marketplace API sync.

## Thesis context

The system was analyzed and designed with the Work System Framework, modeled in UML, and evaluated with usability testing.

## Author

Fawwas Nawwaf Sabil: [GitHub](https://github.com/FawwasSabil25)
