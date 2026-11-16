# Troubleshooting Login Issues

## "Login failed" / CORS error

**Root cause:** Backend is not running or frontend can't reach it.

### Step 1 — Start backend FIRST
```bash
cd backend
npm install   # if first time
npm run dev
```
You must see: `🚀 Server running on http://localhost:5000`
And: `✅ MongoDB connected`

### Step 2 — Test backend is alive
Open browser → http://localhost:5000/api/health
You should see: `{"success":true,"message":"ChainPulse 2.0 running"}`

### Step 3 — Start frontend
```bash
cd frontend
npm install   # if first time
npm start
```

### Step 4 — Start admin (separate terminal)
```bash
cd admin
npm install   # if first time
npm start
```

## MongoDB not connecting

Make sure MongoDB is running:
- **Windows**: Open Services → MongoDB → Start
- **Or run**: `mongod` in a terminal
- **MongoDB Atlas**: Replace MONGO_URI in backend/.env with your Atlas connection string

## Credentials

| Role        | Email                         | Password   |
|-------------|-------------------------------|------------|
| Manager     | manager@chainpulse.com        | User@123   |
| Procurement | procurement@chainpulse.com    | User@123   |
| Warehouse   | warehouse@chainpulse.com      | User@123   |
| Logistics   | logistics@chainpulse.com      | User@123   |
| Admin       | admin@chainpulse.com          | Admin@123  |

**Must run `npm run seed` in backend before first login.**

## Starting everything at once

From the project root you can start all three servers in one terminal:
```bash
npm run dev:all
```
This uses `concurrently` and colour-codes output by service (cyan = backend, green = frontend, magenta = admin).
