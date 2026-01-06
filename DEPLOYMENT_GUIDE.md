# PrimePOS Deployment Guide - Vercel & Render

## Quick Start

### Vercel (Recommended for Next.js)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - **Root Directory:** Set to `frontend` (if frontend is in subdirectory)
   - **Framework:** Next.js (auto-detected)
   - Click "Deploy"

3. **Add Environment Variables:**
   - Project Settings  Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend.com/api/v1`
   - Add: `NEXT_PUBLIC_API_BASE_URL` = `https://your-backend.com`
   - Redeploy

### Render

1. **Create Web Service:**
   - Go to https://dashboard.render.com
   - New +  Web Service
   - Connect repository

2. **Configure:**
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free or Starter

3. **Environment Variables:**
   - Add: `NEXT_PUBLIC_API_URL`
   - Add: `NEXT_PUBLIC_API_BASE_URL`
   - Add: `NODE_ENV=production`
   - Add: `PORT=10000`

## Detailed Steps

### Vercel Deployment

#### Step 1: Prepare Repository
- Ensure code is on GitHub/GitLab
- Verify `frontend/package.json` exists
- Check `next.config.js` is configured

#### Step 2: Create Vercel Project
1. Visit https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your repository
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend` (if needed)
   - **Build Command:** `npm run build` (or `cd frontend && npm run build`)
   - **Output Directory:** `.next`

#### Step 3: Environment Variables
Add in Project Settings  Environment Variables:
```
NEXT_PUBLIC_API_URL=https://your-api.com/api/v1
NEXT_PUBLIC_API_BASE_URL=https://your-api.com
NODE_ENV=production
```

#### Step 4: Deploy
- Automatic: Push to main branch
- Manual: Click "Deploy" in dashboard

#### Step 5: Custom Domain (Optional)
- Settings  Domains  Add domain
- Configure DNS as instructed
- SSL is automatic

### Render Deployment

#### Option A: Web Service (Recommended)

1. **Create Service:**
   - Dashboard  New +  Web Service
   - Connect Git repository

2. **Settings:**
   - **Name:** primepos-frontend
   - **Root Directory:** `frontend`
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (or upgrade for better performance)

3. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Render builds and deploys automatically

#### Option B: Static Site (Not Recommended for Next.js)

- Use only if you export static site
- Not suitable for dynamic Next.js features

## Configuration Files

### vercel.json (Already Created)
Located in project root - configures Vercel deployment

### render.yaml (Already Created)
Located in project root - configures Render deployment

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API endpoint | `https://api.example.com/api/v1` |
| `NEXT_PUBLIC_API_BASE_URL` | Backend base URL | `https://api.example.com` |
| `NODE_ENV` | Environment | `production` |

### Platform-Specific

**Vercel:**
- Variables automatically available
- No PORT needed (auto-managed)

**Render:**
- Must set `PORT=10000` (or other port)
- Variables must be set in dashboard

## Post-Deployment Checklist

- [ ] Application loads at deployed URL
- [ ] Login functionality works
- [ ] API calls succeed (check Network tab)
- [ ] No console errors
- [ ] Environment variables are set
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Backend CORS allows frontend domain

## Troubleshooting

### Build Fails
- Check build logs in dashboard
- Verify `package.json` scripts
- Ensure all dependencies installed
- Check Node.js version compatibility

### API Not Connecting
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend CORS settings
- Test API URL directly
- Check browser console for errors

### Environment Variables Not Working
- **Vercel:** Must start with `NEXT_PUBLIC_` for browser access
- **Render:** Restart service after adding variables
- Rebuild after adding variables

### Slow Performance
- Upgrade plan (Free  Paid)
- Optimize images and assets
- Enable Next.js caching
- Use CDN for static files

## Important Notes

1. **Root Directory:** If `frontend/` is a subdirectory, configure it in platform settings
2. **Build Command:** Must run from frontend directory or use `cd frontend &&`
3. **Environment Variables:** Must be set before first deployment
4. **Backend First:** Deploy backend API before frontend
5. **CORS:** Configure backend to allow frontend domain

## Quick Commands

### Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Render
- Automatic via Git push
- Or use Render CLI (if available)

## Support

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
