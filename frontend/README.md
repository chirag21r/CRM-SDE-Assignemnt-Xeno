Xeno CRM Frontend (React + Vite)

Overview
- Minimal dark UI with pages for Login, Dashboard, Customers, Orders, Segment Builder, Create Campaign, Campaign History, AI Suggestions.
- Uses hash routing and a proxy (/api) to the backend.

Requirements
- Node 18+

Run locally
1) npm install
2) npm run dev
   Open http://localhost:5173

Environment
- Defaults to calling /api (proxy to backend at 8081 via vite.config.js)
- If you deploy, configure rewrites for /api, /oauth2, /login, /logout to the backend URL

Features
- Auth: Google OAuth when enabled; dev-continue fallback when disabled
- Dashboard: stats + compact charts (Recharts) and recent campaigns
- Customers: add and list with dynamic refresh
- Orders: add by email (select) and list; backend sets date
- Segment Builder: AND/OR groups; preview audience without saving
- Campaigns: Create & Send; history shows only delivered campaigns
- AI Suggestions: 2–3 short messages; honors explicit percents and audiences

Deployment tips
- Ensure backend FRONTEND_URL equals the deployed frontend origin
- Add rewrites for /api and auth endpoints on your static host

