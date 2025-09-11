Xeno Mini CRM (Spring Boot + React + MySQL)

Minimal single-server app that covers:
- Ingestion APIs (customers, orders)
- Segment builder with AND/OR rules + audience preview
- Campaign creation, simulated delivery, delivery receipts + stats
- Optional Google OAuth (auto-disabled if not configured)
- AI message suggestions (offline fallback; can plug OpenAI)

Tech
- Java 17, Spring Boot 3.5 (Web, JPA, Security, OAuth2 Client, Validation)
- MySQL
- React 18 via CDN in `src/main/resources/static/index.html`

Backend - Run locally (12‑factor envs)
1) Create DB
   CREATE DATABASE xeno_crm;
2) Export env
   export DB_URL="jdbc:mysql://localhost:3306/xeno_crm?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   export DB_USERNAME="root"
   export DB_PASSWORD='your_password'
   export FRONTEND_URL="http://localhost:5173"
   export VENDOR_SUCCESS_RATE=0.9
3) Build & run
   JAVA_HOME=/path/to/jdk17 PATH=$JAVA_HOME/bin:$PATH ./mvnw -DskipTests package
   java -jar target/crm-xeno-0.0.1-SNAPSHOT.jar --server.port=8081
   Open http://localhost:8081


OAuth (optional)
   export GOOGLE_CLIENT_ID=...
   export GOOGLE_CLIENT_SECRET=...

AI (optional)
   export OPENAI_API_KEY=...

Key APIs
- POST /api/customers { name, email }
- POST /api/orders { customerId, amount }
- POST /api/segments { name, ruleJson }
- GET  /api/segments/{id}/preview-size
- POST /api/campaigns { segmentId, name, message }
- POST /api/vendor/send/{campaignId}
- POST /api/vendor/receipt { vendorMessageId, status }
- GET  /api/campaigns/{id}/stats

Frontend - React
Located at ../frontend

   cd ../frontend && npm install && npm run dev
   Open http://localhost:5173

Deploy
- Build: ./mvnw -DskipTests package
- Run:   java -jar target/crm-xeno-0.0.1-SNAPSHOT.jar

Assumptions
- Rule engine supports numeric comparisons on totalSpend and totalVisits.
- Vendor send simulates ~90% success.

