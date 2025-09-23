# Mini CRM

**Live Demo:** https://mini-crm-iqd4.onrender.com
Please wait for some minutes for site to load.

## What is this?

I built this small CRM system as part of an internship assignment. The goal was to create a complete customer relationship management flow - from getting customer data and orders into the system, to segmenting audiences and running campaigns, with some basic analytics thrown in. I also added an AI feature that helps write campaign messages.

## What it does

**Data Management**
- Add customers and their orders through REST APIs
- Everything gets stored and tracked automatically

**Audience Segmentation** 
- Build customer segments using a flexible rule engine (supports AND/OR logic)
- Preview how many customers match your rules before saving
- Currently works with total spend, visit count, and days since last activity

**Campaign Management**
- Create campaigns targeting specific segments
- Messages get queued and sent through a simulated delivery system
- Track delivery status and success rates (simulates ~90% delivery success)
- Get detailed stats on how campaigns performed

**Dashboard**
- Quick overview of key metrics and your most recent campaign
- Visual charts showing recent campaign performance

**Authentication**
- Integrated with Google OAuth for secure login
- Falls back to a development mode when credentials aren't set up

**AI Assistant**
- Get campaign message suggestions powered by Groq AI
- Has a local fallback system when the AI service isn't available

## Tech Stack

I went with a pretty standard setup:

**Backend:** Java 17 with Spring Boot 3.5 (using Web, JPA, Security, OAuth2 Client, and Validation modules)
**Database:** MySQL 8+
**Frontend:** React 18 built with Vite, using Recharts for the graphs

## Project Structure

```
backend/     # Spring Boot application
frontend/    # React app (Vite setup)
```

The frontend development server automatically proxies API calls, OAuth routes, and auth endpoints to the backend.

## Getting it running locally

**What you'll need:**
- Java 17
- Node.js 18+
- MySQL

**Step 1: Set up the database**
```sql
CREATE DATABASE crm;
```

**Step 2: Configure the backend**

Set these environment variables:
```bash
export DB_URL="jdbc:mysql://localhost:3306/crm?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
export DB_USERNAME="root"
export DB_PASSWORD="your_mysql_password"
export FRONTEND_URL="http://localhost:5173"
export VENDOR_SUCCESS_RATE="0.9"
```

If you want Google OAuth (optional):
```bash
export GOOGLE_CLIENT_ID="your_google_client_id"
export GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

For AI message suggestions (optional):
```bash
export GROQ_MODEL_NAME="llama-3.1-8b-instant"
export GROQ_API_KEY="your_groq_api_key"
```

**Step 3: Start the backend**
```bash
cd backend
./mvnw -DskipTests package
java -jar target/*.jar --server.port=8081
```

**Step 4: Start the frontend**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and you should be good to go!

## API Documentation

Once the backend is running, check out the interactive API docs at:
http://localhost:8081/swagger-ui/index.html

## Key API Endpoints

Here are the main endpoints you'll probably use:

**Customer & Order Management**
- `POST /api/customers` - Add a new customer `{ name, email }`
- `POST /api/orders` - Record an order `{ customerId, amount }`

**Segmentation**
- `POST /api/segments` - Create a new segment `{ name, ruleJson }`
- `POST /api/segments/preview` - Preview segment size `{ ruleJson }` → `{ audienceSize }`

**Campaigns**
- `POST /api/campaigns` - Create campaign `{ segmentId, name, message }`
- `POST /api/vendor/send/{campaignId}` - Send campaign messages
- `POST /api/vendor/receipt` - Receive delivery status `{ vendorMessageId, status }`
- `GET /api/campaigns/{id}/stats` - Get campaign performance

**System**
- `GET /api/public/health` - Check if everything's running


- Comprehensive logging and monitoring

The codebase is structured to make it easy to add these features later if needed.

---
