Xeno Mini CRM

Live demo
- https://mini-crm-iqd4.onrender.com

Overview
This is a small CRM built as part of an internship assignment. It demonstrates a complete flow from customer and order ingestion to audience segmentation and campaign delivery, with a simple analytics dashboard and an AI-assisted copy suggestion feature.

Features
- Data ingestion: REST APIs to create customers and orders.
- Segmentation: JSON rule-based engine supporting AND/OR groups; preview audience size before saving. Supported fields: `totalSpend`, `totalVisits`, `inactiveDays`.
- Campaigns: create a campaign for a segment, queue communication logs, simulate vendor delivery (~90% sent), receive delivery receipts, and compute stats.
- Dashboard: totals and last campaign snapshot; bar chart of recent campaigns.
- Authentication: Google OAuth 2.0. When credentials are not provided, the app runs in a relaxed “dev mode”.
- AI suggestions: campaign message suggestions via Groq with a deterministic local fallback.

Stack
- Backend: Java 17, Spring Boot 3.5 (Web, JPA, Security, OAuth2 Client, Validation)
- Database: MySQL 8+
- Frontend: React 18 + Vite + Recharts

Repository layout
- `backend/` — Spring Boot application
- `frontend/` — React application (Vite). Dev server proxies `/api`, `/oauth2`, `/login`, `/logout` to the backend.

Quickstart (local)
Prerequisites: Java 17, Node 18+, MySQL 8+

1) Database
   CREATE DATABASE xeno_crm;

2) Backend configuration (env)
   export DB_URL="jdbc:mysql://localhost:3306/xeno_crm?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   export DB_USERNAME="root"
   export DB_PASSWORD="<your_password>"
   export FRONTEND_URL="http://localhost:5173"
   export VENDOR_SUCCESS_RATE="0.9"
   # Optional: enable Google OAuth
   export GOOGLE_CLIENT_ID="<client_id>"
   export GOOGLE_CLIENT_SECRET="<client_secret>"
   # Optional: AI via Groq
   export GROQ_MODEL_NAME="llama-3.1-8b-instant"
   export GROQ_API_KEY="<groq_api_key>"

3) Backend build and run
   cd backend
   ./mvnw -DskipTests package
   java -jar target/*.jar --server.port=8081

4) Frontend
   cd ../frontend
   npm install
   npm run dev
   Open http://localhost:5173

API documentation
- Swagger UI: http://localhost:8081/swagger-ui/index.html

Representative endpoints
- POST `/api/customers` `{ name, email }`
- POST `/api/orders` `{ customerId, amount }`
- POST `/api/segments` `{ name, ruleJson }`
- POST `/api/segments/preview` `{ ruleJson }` → `{ audienceSize }`
- POST `/api/campaigns` `{ segmentId, name, message }`
- POST `/api/vendor/send/{campaignId}`
- POST `/api/vendor/receipt` `{ vendorMessageId, status }`
- GET  `/api/campaigns/{id}/stats`
- GET  `/api/public/health`

Authentication
- In development, the frontend bypasses auth to simplify testing.
- To enable real Google OAuth: set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the backend. The backend will enforce authentication. On the frontend, remove the dev bypass in `src/main.jsx` where `isAuthed` is forced to `true`.

Deployment notes
- Backend (Render): set the start command to `java -jar target/*.jar --server.port=$PORT` and configure all environment variables.
- Frontend (Render Static): point to the built `dist/`. Add rewrites so `/api`, `/oauth2`, `/login`, `/logout` route to the backend service.
- Ensure `FRONTEND_URL` in the backend matches the deployed frontend origin.

Out of scope
- Pub/sub for write decoupling is intentionally not implemented to keep the deployment simple. The code is structured to allow introducing a message broker later if needed.
