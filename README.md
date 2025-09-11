<<<<<<< HEAD
# CRM-SDE-Assignemnt-Xeno
=======
Xeno Mini CRM (Spring Boot + React static + MySQL)

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

Run locally
1) Install Java 17
   sudo apt-get install -y openjdk-17-jdk
2) Create DB
   CREATE DATABASE xeno_crm;
3) Configure env (or edit application.properties)
   export DB_URL="jdbc:mysql://localhost:3306/xeno_crm?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   export DB_USERNAME=root
   export DB_PASSWORD=root
4) Start
   ./mvnw spring-boot:run
   Open http://localhost:8080

cd /home/chirag/Desktop/projects/CRM_XENO/crm-xeno
export DB_URL="jdbc:mysql://localhost:3306/xeno_crm?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
export DB_USERNAME="root"
export DB_PASSWORD='212004@ChiragShukla'
JAVA_HOME=/home/chirag/Desktop/projects/CRM_XENO/.jdk PATH=$JAVA_HOME/bin:$PATH ./mvnw -q -DskipTests package
JAVA_HOME=/home/chirag/Desktop/projects/CRM_XENO/.jdk PATH=$JAVA_HOME/bin:$PATH java -jar target/crm-xeno-0.0.1-SNAPSHOT.jar --server.port=8081


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

Deploy
- Build: ./mvnw -DskipTests package
- Run:   java -jar target/crm-xeno-0.0.1-SNAPSHOT.jar

Assumptions
- Rule engine supports numeric comparisons on totalSpend and totalVisits.
- Vendor send simulates ~90% success.

>>>>>>> 4b9a1f2 (connected MySql with basic frontend and Swagger UI)
