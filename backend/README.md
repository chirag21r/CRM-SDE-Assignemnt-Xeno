Xeno CRM Backend (Spring Boot)

Live frontend
- https://mini-crm-iqd4.onrender.com

Overview
Spring Boot service that exposes REST APIs for customer/order ingestion, audience segmentation, campaign creation, vendor delivery simulation and receipts, dashboard stats, and AI-assisted message suggestions. Security is handled with Spring Security and Google OAuth 2.0. CORS is restricted to the configured frontend origin.

Requirements
- Java 17
- MySQL 8+

Environment variables
- DB_URL=jdbc:mysql://localhost:3306/xeno_crm?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
- DB_USERNAME=root
- DB_PASSWORD=<your_password>
- FRONTEND_URL=http://localhost:5173
- VENDOR_SUCCESS_RATE=0.9
- GOOGLE_CLIENT_ID=<optional>
- GOOGLE_CLIENT_SECRET=<optional>
- GROQ_MODEL_NAME=llama-3.1-8b-instant
- GROQ_API_KEY=<optional>

Run locally
1) Create DB: CREATE DATABASE xeno_crm;
2) Export the environment variables listed above
3) Build and run
   ./mvnw -DskipTests package
   java -jar target/*.jar --server.port=8081
4) Swagger UI
   http://localhost:8081/swagger-ui/index.html
   Deployed: https://crm-sde-assignemnt-xeno.onrender.com/swagger-ui/index.html

Key endpoints
- POST /api/customers { name, email }
- POST /api/orders { customerId, amount }
- POST /api/segments { name, ruleJson }
- POST /api/segments/preview { ruleJson }
- GET  /api/segments/{id}/preview-size
- POST /api/campaigns { segmentId, name, message }
- POST /api/vendor/send/{campaignId}
- POST /api/vendor/receipt { vendorMessageId, status }
- GET  /api/campaigns/{id}/stats
- GET  /api/public/health

Authentication
- If `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set, all non-public APIs require authentication. On successful login, users are redirected back to `FRONTEND_URL`.
- When these credentials are missing, the backend permits all requests for development convenience.

Notes
- Rule fields: `totalSpend`, `totalVisits`, `inactiveDays`.
- Vendor simulator success rate is controlled by `VENDOR_SUCCESS_RATE`.
- The React frontend resides in `../frontend`.

