Xeno CRM Frontend (React + Vite)

Live demo
- https://mini-crm-iqd4.onrender.com

Overview
Single-page React application with a dark theme. Pages: Login, Dashboard, Customers, Orders, Segment Builder, Create Campaign, Campaign History, and AI Suggestions. Hash-based routing is used, and the development server proxies API and auth routes to the backend.

Requirements
- Node 18+

Run locally
1) npm install
2) npm run dev
   Open http://localhost:5173

Configuration
- API base defaults to the same origin under `/api`. During development, `vite.config.js` proxies `/api`, `/oauth2`, `/login`, and `/logout` to `http://localhost:8081`.
- You can override the backend base using `VITE_API_BASE` at build time if needed.

Notes on authentication
- The UI includes a simplified development mode that allows navigation without OAuth when the backend reports `authEnabled=false`. To run with real OAuth, configure Google credentials in the backend; the login button will redirect to Google and return to `/#/dashboard` on success.

Key features
- Consistent typography and dark UI.
- Dashboard with summary stats and compact bar charts (Recharts).
- Customer and order creation with inline tables.
- Segment builder with AND/OR rules and audience preview before saving.
- Campaign creation, send simulation, and history with delivered stats only.
- AI message suggestions with explicit percent and audience handling.

Deployment
- Ensure the backend `FRONTEND_URL` matches the deployed frontend origin.
- Configure rewrites so `/api`, `/oauth2`, `/login`, and `/logout` resolve to the backend service.

