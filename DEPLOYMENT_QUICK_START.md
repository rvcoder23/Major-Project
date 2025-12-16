# 🚀 Quick Deployment Guide

## TL;DR - Deploy in 15 Minutes

### 1. Database (Supabase) - 5 min
```bash
1. Go to supabase.com → New Project
2. Copy Project URL and API Key
3. Run SQL schema from supabase/schema.sql
```

### 2. Backend (Render) - 5 min
```bash
1. Push code to GitHub
2. Go to render.com → New Web Service
3. Connect GitHub repo
4. Set Root Directory: backend
5. Add Environment Variables:
   - SUPABASE_URL=your_url
   - SUPABASE_ANON_KEY=your_key
   - FRONTEND_URL=your_frontend_url (add after frontend deploy)
   - NODE_ENV=production
   - PORT=10000
```

### 3. Frontend (Vercel) - 5 min
```bash
1. Go to vercel.com → New Project
2. Connect GitHub repo
3. Set Root Directory: frontend
4. Add Environment Variable:
   - VITE_API_URL=https://your-backend.onrender.com/api
5. Deploy!
```

## Environment Variables Cheat Sheet

### Backend (.env or Render Environment)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
PORT=10000
```

### Frontend (Vercel Environment)
```
VITE_API_URL=https://your-backend.onrender.com/api
```

## Testing After Deployment

1. **Test Backend**: `https://your-backend.onrender.com/api/health`
2. **Test Frontend**: Open your Vercel URL
3. **Login**: admin / admin123

## Common Issues

- **CORS Error**: Update FRONTEND_URL in backend
- **API Not Found**: Check VITE_API_URL in frontend
- **Database Error**: Verify Supabase credentials

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

