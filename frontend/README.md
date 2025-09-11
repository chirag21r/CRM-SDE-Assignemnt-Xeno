Xeno CRM Frontend (React + Vite)

Run locally
1) Install Node 18+
2) Install deps
   npm install
3) Start dev server (proxies /api to backend)
   npm run dev
   Open http://localhost:5173

Features
- Login page (uses Google OAuth if configured; dev-continue fallback)
- Dashboard: Customers, Orders, Segment Builder (AND/OR; inactiveDays), Campaigns
- Clean dark UI, responsive, simple code suitable for interview explanations

Configure Backend URL
- Dev proxy is set to http://localhost:8081 in vite.config.js
- To change, edit vite.config.js or use FRONTEND_URL env and align backend CORS

