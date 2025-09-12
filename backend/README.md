Xeno CRM Backend (Spring Boot)

Overview
- REST APIs for customers, orders, segments, campaigns, delivery receipts, dashboard stats, and AI suggestions.
- Security with Spring Security + OAuth2 (Google). Auth auto-disables if GOOGLE_CLIENT_ID is not set.
- CORS controlled by FRONTEND_URL.

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
2) Export envs (above)
3) Build and run
   JAVA_HOME=/path/to/jdk17 PATH=$JAVA_HOME/bin:$PATH ./mvnw -DskipTests package
   java -jar target/crm-xeno-0.0.1-SNAPSHOT.jar --server.port=8081
   Swagger: http://localhost:8081/swagger-ui/index.html

Key APIs
- POST /api/customers { name, email }
- POST /api/orders { customerId, amount }
- POST /api/segments { name, ruleJson }
- GET  /api/segments/{id}/preview-size
- POST /api/campaigns { segmentId, name, message }
- POST /api/vendor/send/{campaignId}
- POST /api/vendor/receipt { vendorMessageId, status }
- GET  /api/campaigns/{id}/stats
- GET  /api/public/health

Notes
- Rule engine fields: totalSpend, totalVisits, inactiveDays.
- Vendor simulator success rate configurable via VENDOR_SUCCESS_RATE.
- Frontend app lives in ../frontend.

