# Prakash Library Management System

A comprehensive, full-stack library management system designed to track student subscriptions, payments, seating, and notifications. 

Built with a **React + Vite** frontend and a **Node.js + Express + Prisma** backend, this application provides an intuitive admin dashboard and a student portal.

## 🌟 Key Features

*   **Student Management**: Add, update, and manage student profiles, including their specific library seat numbers and profile photos.
*   **Recurring Subscription Billing**: Automated tracking of monthly fee cycles (`PAID`, `PENDING`, `DUE`).
*   **Payment Tracking**: Record full payments, partial payments, and issue refunds (reverts) with strict PIN protection. 
*   **Automated Notifications**: Daily background cron jobs automatically notify students via Email and WhatsApp (3 days before due date, on due date, and overdue).
*   **Analytics & Revenue Dashboard**: Real-time insights into total students, active subscriptions, and daily/monthly revenue.
*   **Role-based Access**: Secure Admin portal for library owners, and a dedicated Student portal for members to view their fee status and payment history.

## 🛠️ Tech Stack

### Frontend (`/client`)
*   **Framework**: React 18 + Vite
*   **Styling**: Tailwind CSS + custom glassmorphism UI
*   **Icons**: Lucide React
*   **Routing**: React Router DOM
*   **State / Fetching**: Axios, React Hot Toast

### Backend (`/server`)
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database ORM**: Prisma
*   **Database**: MySQL / TiDB
*   **Authentication**: JSON Web Tokens (JWT) & bcryptjs
*   **Background Jobs**: node-cron
*   **File Uploads**: Multer + Cloudinary
*   **Notifications**: Nodemailer (Email) + WhatsApp API Integration

## 🚀 Getting Started (Local Development)

### Prerequisites
*   Node.js (v18+)
*   A MySQL Database URL
*   Cloudinary Account (for image uploads)
*   Nodemailer compatible email account

### 1. Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `/server` directory:
   ```env
   PORT=5000
   DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
   JWT_SECRET="your_jwt_secret"
   NODE_ENV="development"
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   
   # Email
   EMAIL_USER="your_email@gmail.com"
   EMAIL_PASS="your_app_password"
   
   # WhatsApp
   WHATSAPP_API_URL="your_whatsapp_provider_url"
   WHATSAPP_API_KEY="your_whatsapp_api_key"
   
   # Admin Secrets
   ADMIN_EMAIL="admin@prakashlibrary.com"
   ADMIN_PASSWORD="securepassword"
   SECRET_PIN="1234"
   ```
4. Push the database schema:
   ```bash
   npx prisma db push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `/client` directory:
   ```env
   VITE_API_URL="http://localhost:5000/api"
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

## ☁️ Deployment (Render)

This application can be easily deployed on [Render.com](https://render.com). 

### Option 1: Monorepo Deployment (Recommended)
You can deploy both the frontend and backend as separate web services from this single GitHub repository.

**Backend Service:**
1. Create a new **Web Service** on Render.
2. Root Directory: `server`
3. Build Command: `npm install && npx prisma generate`
4. Start Command: `npm start` (Make sure `"start": "node index.js"` is in your `package.json`).
5. Add all the Environment Variables from your `.env` file.

**Frontend Service:**
1. Create a new **Static Site** on Render.
2. Root Directory: `client`
3. Build Command: `npm install && npm run build`
4. Publish Directory: `dist`
5. Add Environment Variable: `VITE_API_URL` pointing to your deployed backend Render URL.
6. **Important**: Add a Rewrite rule for React Router. Under "Redirects/Rewrites", set Source `/*`, Destination `/index.html`, Action `Rewrite`.

## 📜 License
Private Software. All rights reserved.
