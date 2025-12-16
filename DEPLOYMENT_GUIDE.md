# 🚀 Complete Deployment Guide - Front Office Management System

This guide provides detailed steps to deploy your Front Office Management System (Frontend, Backend, and Database) to production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup (Supabase)](#database-setup-supabase)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Environment Variables Configuration](#environment-variables-configuration)
6. [Post-Deployment Steps](#post-deployment-steps)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account (for code repository)
- ✅ Supabase account (for database)
- ✅ Render/Railway account (for backend) - Free tier available
- ✅ Vercel/Netlify account (for frontend) - Free tier available
- ✅ Domain name (optional, for custom domain)

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click **"New Project"**
4. Fill in project details:
   - **Name**: `hotel-management-db` (or your preferred name)
   - **Database Password**: Create a strong password (save it securely)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for small projects
5. Click **"Create new project"**
6. Wait 2-3 minutes for project setup

### Step 2: Get Supabase Credentials

1. Once project is ready, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (keep this secret!)

### Step 3: Run Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Click **"New Query"**
3. Open `supabase/schema.sql` from your project
4. Copy entire content and paste in SQL Editor
5. Click **"Run"** to execute
6. Repeat for other schema files if needed:
   - `supabase/housekeeping_schema.sql`
   - `supabase/food_enhancements.sql`
   - `supabase/comprehensive_billing_schema.sql`

### Step 4: Verify Database Setup

1. Go to **Table Editor** in Supabase
2. Verify tables are created:
   - `rooms`
   - `bookings`
   - `housekeeping`
   - `housekeeping_staff`
   - `inventory`
   - `food_menu`
   - `food_orders`
   - `accounts`
   - `bills`
   - etc.

✅ **Database is now ready!**

---

## 🔙 Backend Deployment

We'll use **Render** (recommended) or **Railway** for backend deployment.

### Option A: Deploy to Render (Recommended)

#### Step 1: Prepare Backend for Deployment

1. **Create `Procfile`** in `backend/` directory:
```bash
cd backend
echo "web: node server.js" > Procfile
```

2. **Update `server.js`** CORS configuration:
```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Will be set in environment variables
    credentials: true
}));
```

3. **Create `.dockerignore`** (optional):
```
node_modules
.env
*.log
.git
```

#### Step 2: Push Code to GitHub

1. Initialize git (if not already):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create GitHub repository:
   - Go to [GitHub](https://github.com)
   - Click **"New Repository"**
   - Name: `hotel-management-system`
   - Make it **Private** (recommended)
   - Click **"Create repository"**

3. Push code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/hotel-management-system.git
git branch -M main
git push -u origin main
```

#### Step 3: Deploy on Render

1. Go to [https://render.com](https://render.com)
2. Sign up/Login (use GitHub for easy integration)
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Select your repository: `hotel-management-system`
6. Configure service:
   - **Name**: `hotel-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty (or set to `backend` if deploying only backend folder)

7. **Environment Variables** (click "Advanced"):
   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

8. Click **"Create Web Service"**
9. Wait for deployment (5-10 minutes)
10. Copy the service URL (e.g., `https://hotel-backend.onrender.com`)

✅ **Backend deployed!** Note the URL for frontend configuration.

---

### Option B: Deploy to Railway

1. Go to [https://railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository
6. Railway will auto-detect Node.js
7. Set **Root Directory** to `backend`
8. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=${{PORT}}
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   FRONTEND_URL=your_frontend_url
   ```
9. Click **"Deploy"**
10. Copy the generated URL

---

## 🎨 Frontend Deployment

We'll use **Vercel** (recommended) for frontend deployment.

### Step 1: Prepare Frontend for Deployment

1. **Update API Configuration** in `frontend/src/services/api.js`:

```javascript
// For production, use your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
```

2. **Create `vite.config.js`** (if not exists) in `frontend/`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Only for local dev
        changeOrigin: true,
      }
    }
  }
})
```

### Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"Add New Project"**
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

7. Click **"Deploy"**
8. Wait for deployment (2-5 minutes)
9. Your app will be live at: `https://your-project.vercel.app`

✅ **Frontend deployed!**

---

### Alternative: Deploy to Netlify

1. Go to [https://netlify.com](https://netlify.com)
2. Sign up/Login with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Select your repository
5. Configure build:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

6. Add Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

7. Click **"Deploy site"**

---

## 🔐 Environment Variables Configuration

### Backend Environment Variables (Render/Railway)

```
NODE_ENV=production
PORT=10000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend Environment Variables (Vercel/Netlify)

```
VITE_API_URL=https://your-backend.onrender.com/api
```

**Note**: In Vite, environment variables must start with `VITE_` to be accessible in the browser.

---

## 📝 Post-Deployment Steps

### 1. Update CORS in Backend

After getting your frontend URL, update backend CORS:

1. Go to Render/Railway dashboard
2. Open your backend service
3. Go to **Environment** tab
4. Update `FRONTEND_URL` with your actual frontend URL
5. Redeploy if needed

### 2. Test the Application

1. Open your frontend URL
2. Try logging in with default credentials:
   - Username: `admin`
   - Password: `admin123`
3. Test all features:
   - Room management
   - Bookings
   - Housekeeping
   - Inventory
   - Food Court
   - Reports

### 3. Set Up Custom Domain (Optional)

#### For Frontend (Vercel):
1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

#### For Backend (Render):
1. Go to Render dashboard → Your service → Settings → Custom Domain
2. Add your domain
3. Update DNS records as instructed

### 4. Enable HTTPS

Both Vercel and Render provide free SSL certificates automatically. Your sites will be HTTPS by default.

### 5. Set Up Monitoring

- **Render**: Built-in monitoring available
- **Vercel**: Analytics available in dashboard
- **Supabase**: Database monitoring in dashboard

---

## 🔧 Troubleshooting

### Issue 1: CORS Errors

**Solution**: 
- Ensure `FRONTEND_URL` in backend matches exactly
- Check backend CORS configuration
- Verify frontend `VITE_API_URL` is correct

### Issue 2: API Not Connecting

**Solution**:
- Check backend URL is correct in frontend env variables
- Verify backend is running (check Render/Railway logs)
- Test backend URL directly: `https://your-backend.onrender.com/api/rooms`

### Issue 3: Database Connection Failed

**Solution**:
- Verify Supabase credentials in backend environment variables
- Check Supabase project is active
- Ensure database schema is properly set up

### Issue 4: Build Failures

**Solution**:
- Check build logs in deployment platform
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Issue 5: Environment Variables Not Working

**Solution**:
- Restart deployment after adding env variables
- Ensure variable names are correct (case-sensitive)
- For Vite, variables must start with `VITE_`

---

## 📊 Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema executed successfully
- [ ] Backend deployed to Render/Railway
- [ ] Backend environment variables configured
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Frontend environment variables configured
- [ ] CORS configured correctly
- [ ] Application tested end-to-end
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring set up

---

## 🎯 Quick Reference URLs

After deployment, you'll have:

- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-backend.onrender.com`
- **Database**: Managed by Supabase

---

## 💰 Cost Estimation

### Free Tier (Sufficient for small projects):

- **Supabase**: Free tier includes:
  - 500 MB database
  - 2 GB bandwidth
  - 50,000 monthly active users

- **Render**: Free tier includes:
  - 750 hours/month
  - Sleeps after 15 min inactivity (wakes on request)

- **Vercel**: Free tier includes:
  - Unlimited deployments
  - 100 GB bandwidth
  - Custom domains

### Paid Options (if needed):

- **Render**: $7/month for always-on service
- **Supabase**: $25/month for production plan
- **Vercel**: $20/month for Pro plan

---

## 📞 Support

If you encounter issues:

1. Check deployment platform logs
2. Verify environment variables
3. Test API endpoints directly
4. Check Supabase dashboard for database issues
5. Review browser console for frontend errors

---

## 🎉 Congratulations!

Your Front Office Management System is now live in production! 🚀

**Next Steps**:
- Share the frontend URL with your team
- Set up regular backups
- Monitor usage and performance
- Consider upgrading plans as you scale

---

**Last Updated**: 2024
**Maintained by**: Your Development Team

