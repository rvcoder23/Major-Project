# ✅ Deployment Checklist

Use this checklist to ensure everything is properly deployed.

## Pre-Deployment

- [ ] Code is committed to GitHub
- [ ] All environment variables documented
- [ ] Database schema files ready
- [ ] Tested locally

## Database (Supabase)

- [ ] Supabase project created
- [ ] Project URL copied
- [ ] API keys copied (anon key)
- [ ] Database schema executed (`schema.sql`)
- [ ] Housekeeping schema executed (`housekeeping_schema.sql`)
- [ ] Food schema executed (`food_enhancements.sql`)
- [ ] Billing schema executed (`comprehensive_billing_schema.sql`)
- [ ] Tables verified in Table Editor
- [ ] Sample data inserted (if needed)

## Backend Deployment

- [ ] GitHub repository created and code pushed
- [ ] Render/Railway account created
- [ ] Web service created on Render/Railway
- [ ] Root directory set to `backend`
- [ ] Build command: `cd backend && npm install`
- [ ] Start command: `cd backend && npm start`
- [ ] Environment variables added:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=10000` (or auto-assigned)
  - [ ] `SUPABASE_URL=your_url`
  - [ ] `SUPABASE_ANON_KEY=your_key`
  - [ ] `FRONTEND_URL=your_frontend_url` (add after frontend deploy)
- [ ] Deployment successful
- [ ] Health check working: `/api/health`
- [ ] Backend URL copied

## Frontend Deployment

- [ ] Vercel/Netlify account created
- [ ] Project created on Vercel/Netlify
- [ ] GitHub repository connected
- [ ] Root directory set to `frontend`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variable added:
  - [ ] `VITE_API_URL=https://your-backend.onrender.com/api`
- [ ] Deployment successful
- [ ] Frontend URL copied

## Post-Deployment Configuration

- [ ] Backend `FRONTEND_URL` updated with actual frontend URL
- [ ] Backend redeployed (if needed)
- [ ] CORS working correctly
- [ ] API calls working from frontend

## Testing

- [ ] Frontend loads without errors
- [ ] Login works (admin/admin123)
- [ ] Dashboard displays correctly
- [ ] Room management works
- [ ] Booking creation works
- [ ] Housekeeping features work
- [ ] Inventory management works
- [ ] Food court works
- [ ] Reports generate correctly
- [ ] Bills generate correctly

## Security

- [ ] Environment variables not exposed in code
- [ ] `.env` files in `.gitignore`
- [ ] Supabase service role key kept secret
- [ ] HTTPS enabled (automatic on Vercel/Render)

## Monitoring

- [ ] Render/Railway logs accessible
- [ ] Vercel/Netlify analytics enabled
- [ ] Supabase dashboard monitoring active
- [ ] Error tracking set up (optional)

## Documentation

- [ ] Deployment URLs documented
- [ ] Environment variables documented
- [ ] Team members have access
- [ ] Login credentials shared securely

## Optional Enhancements

- [ ] Custom domain configured
- [ ] SSL certificate verified
- [ ] Backup strategy in place
- [ ] Performance monitoring set up
- [ ] Uptime monitoring configured

---

## Quick Test Commands

### Test Backend Health
```bash
curl https://your-backend.onrender.com/api/health
```

### Test API Endpoint
```bash
curl https://your-backend.onrender.com/api/rooms
```

### Test Frontend
Open browser: `https://your-app.vercel.app`

---

**Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

