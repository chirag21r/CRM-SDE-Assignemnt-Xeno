Xeno Mini CRM (Spring Boot + React + MySQL)

What this project includes
- Data ingestion APIs (customers, orders)
- Segment builder with AND/OR rules and audience preview
- Campaigns: create → simulate delivery (~90% sent) → delivery receipts → stats
- Google OAuth 2.0 (auto-disabled if not configured)
- AI message suggestions (Groq; robust local fallback)

Tech
- Java 17, Spring Boot 3.5 (Web, JPA, Security, OAuth2 Client, Validation)
- MySQL
- React 18 (Vite, Recharts)

Project structure
- backend/  → Spring Boot app
- frontend/ → React app (Vite) with proxy to backend

Run locally
1) Java 17 and Node 18+
2) MySQL: CREATE DATABASE xeno_crm;
3) Backend (envs)
   export DB_URL="jdbc:mysql://localhost:3306/xeno_crm?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   export DB_USERNAME="root"
   export DB_PASSWORD="<your_password>"
   export FRONTEND_URL="http://localhost:5173"
   export VENDOR_SUCCESS_RATE="0.9"
   export GOOGLE_CLIENT_ID="<client_id>"
   export GOOGLE_CLIENT_SECRET="<client_secret>"
   export GROQ_MODEL_NAME="llama-3.1-8b-instant"
   export GROQ_API_KEY="<groq_api_key>"
4) Backend (build/run)
   cd backend && ./mvnw -DskipTests package && java -jar target/*.jar --server.port=8081
5) Frontend
   cd ../frontend && npm install && npm run dev
   Open http://localhost:5173

Swagger
- http://localhost:8081/swagger-ui/index.html

Key APIs
- POST /api/customers { name, email }
- POST /api/orders { customerId, amount }
- POST /api/segments { name, ruleJson }
- POST /api/campaigns { segmentId, name, message }
- POST /api/vendor/send/{campaignId}
- POST /api/vendor/receipt { vendorMessageId, status }
- GET  /api/campaigns/{id}/stats
- GET  /api/public/health

Deployment (quick)
- Backend: Render (Java 17). Start: java -jar target/*.jar --server.port=$PORT
- Frontend: Render Static. Rewrites /api, /oauth2, /login, /logout to backend.
- DB: PlanetScale (free). Use sslMode=VERIFY_IDENTITY in JDBC URL.

Notes / assumptions
- Rule engine supports numeric comparisons for totalSpend, totalVisits, inactiveDays.
- Vendor simulator success rate is configurable via env.
