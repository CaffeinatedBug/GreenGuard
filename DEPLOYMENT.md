# GreenGuard AI - Deployment Guide

Complete guide to deploy the GreenGuard AI carbon audit system locally and to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [API Keys Configuration](#api-keys-configuration)
4. [Testing the System](#testing-the-system)
5. [Production Deployment](#production-deployment)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** 20+ (recommended: latest LTS)
- **npm** or **pnpm** or **yarn**
- **Git** (for version control)

### Required API Keys
1. **Gemini AI API Key** (Free)
   - Get at: https://aistudio.google.com/app/apikey
   - Used for: AI-powered audit analysis

2. **ElectricityMaps API Key** (Free trial available)
   - Get at: https://api-portal.electricitymaps.com/
   - Used for: Real-time carbon intensity data

3. **OpenWeatherMap API Key** (Free tier available)
   - Get at: https://openweathermap.org/api
   - Used for: Weather data (optional, has intelligent fallback)

---

## Local Development Setup

### 1. Clone the Repository

```bash
cd d:\Projects\GreenGuard
# Or if cloning fresh:
# git clone <your-repo-url> GreenGuard
# cd GreenGuard
```

### 2. Install Dependencies

```bash
npm install
```

> [!TIP]
> If you encounter dependency issues, try deleting `node_modules` and `package-lock.json`, then run `npm install` again.

### 3. Create Environment File

Create a `.env.local` file in the project root:

```bash
# Create the file
New-Item .env.local -ItemType File
```

### 4. Configure Environment Variables

Add the following to `.env.local`:

```env
# =============================================================================
# GreenGuard AI - Environment Configuration
# =============================================================================

# Gemini AI (REQUIRED for AI-powered audits)
# Get your key at: https://aistudio.google.com/app/apikey
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# ElectricityMaps API (RECOMMENDED for real carbon data)
# Get your key at: https://api-portal.electricitymaps.com/
NEXT_PUBLIC_ELECTRICITYMAPS_API_KEY=your_electricitymaps_key_here

# OpenWeatherMap API (OPTIONAL - has intelligent fallback)
# Get your key at: https://openweathermap.org/api
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key_here
```

> [!IMPORTANT]
> Replace `your_*_key_here` with your actual API keys.

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

---

## API Keys Configuration

### Getting Gemini AI API Key (REQUIRED)

1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Copy the key and add to `.env.local`:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
   ```

### Getting ElectricityMaps API Key (RECOMMENDED)

1. Visit https://api-portal.electricitymaps.com/
2. Sign up for a free trial account
3. Navigate to the API Keys section
4. Copy the auth token and add to `.env.local`:
   ```env
   NEXT_PUBLIC_ELECTRICITYMAPS_API_KEY=ZH7V2hT7ERDj052w5Q5i
   ```

> [!NOTE]
> Approval may take time. The system will use intelligent mock data as fallback.

### Getting OpenWeatherMap API Key (OPTIONAL)

1. Visit https://openweathermap.org/api
2. Sign up for a free account
3. Go to **API Keys** section
4. Generate a new key (instant activation)
5. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_OPENWEATHER_API_KEY=abc123...
   ```

---

## Testing the System

### 1. Test Context Agent

Visit the test page at: **http://localhost:3000/test-api**

- Enter coordinates (default: New Delhi)
- Click **"Fetch Context Data"**
- Verify data sources (should show ✅ for configured APIs)

### 2. Test IoT Ingestion API

Using **curl**:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_id": "supplier_1",
    "iot_data": {
      "power": 150,
      "latitude": 28.6139,
      "longitude": 77.2090,
      "temperature": 32,
      "humidity": 65
    }
  }'
```

Using **PowerShell**:

```powershell
$body = @{
    supplier_id = "supplier_1"
    iot_data = @{
        power = 150
        latitude = 28.6139
        longitude = 77.2090
        temperature = 32
        humidity = 65
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/ingest" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### 3. Expected Response

```json
{
  "success": true,
  "audit_result": {
    "verdict": "VERIFIED",
    "confidence": 92,
    "reasoning": "Power consumption justified by high temperature...",
    "logs": [...]
  },
  "message": "Audit completed in 1234ms"
}
```

---

## Production Deployment

### Option 1: Deploy to Vercel (Recommended for Next.js)

#### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - GreenGuard AI"
git remote add origin <your-github-repo-url>
git push -u origin main
```

#### Step 2: Deploy to Vercel

1. Visit https://vercel.com/
2. Sign in with GitHub
3. Click **"Import Project"**
4. Select your GreenGuard repository
5. Configure the project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Step 3: Add Environment Variables in Vercel

1. Go to **Project Settings** → **Environment Variables**
2. Add each variable:
   - `NEXT_PUBLIC_GEMINI_API_KEY`
   - `NEXT_PUBLIC_ELECTRICITYMAPS_API_KEY`
   - `NEXT_PUBLIC_OPENWEATHER_API_KEY`
3. Set environment: **Production**, **Preview**, and **Development**
4. Click **Save**

#### Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at: `https://your-project.vercel.app`

> [!TIP]
> Vercel automatically redeploys on every git push to main branch.

### Option 2: Deploy to Netlify

1. Visit https://www.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
5. Add environment variables in **Site settings** → **Environment variables**
6. Deploy

### Option 3: Self-Hosted (Docker)

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t greenguard-ai .
docker run -p 3000:3000 --env-file .env.local greenguard-ai
```

---

## Environment Variables Reference

| Variable | Required | Purpose | Get From |
|----------|----------|---------|----------|
| `NEXT_PUBLIC_GEMINI_API_KEY` | ✅ Yes | AI audit analysis | https://aistudio.google.com/app/apikey |
| `NEXT_PUBLIC_ELECTRICITYMAPS_API_KEY` | ⚠️ Recommended | Carbon intensity data | https://api-portal.electricitymaps.com/ |
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | ⭕ Optional | Weather data | https://openweathermap.org/api |

> [!WARNING]
> **Production Note**: All variables are prefixed with `NEXT_PUBLIC_` because they are used in client-side code. Do NOT store sensitive secrets with this prefix. For production, consider moving API calls to server-side API routes.

---

## Troubleshooting

### Issue: API Not Working

**Symptoms**: Getting "Mock Data" instead of real API data

**Solutions**:
1. Check if API keys are correctly set in `.env.local`
2. Restart the dev server after adding environment variables
3. Verify API keys are valid and not expired
4. Check browser console (F12) for error messages

### Issue: Build Fails

**Symptoms**: `npm run build` fails with TypeScript errors

**Solutions**:
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Issue: Environment Variables Not Loading

**Symptoms**: `process.env.NEXT_PUBLIC_*` is undefined

**Solutions**:
1. Ensure variables start with `NEXT_PUBLIC_`
2. Restart dev server completely (Ctrl+C, then `npm run dev`)
3. In production (Vercel/Netlify), verify variables are added in dashboard
4. Check `.env.local` is not committed to git (should be in `.gitignore`)

### Issue: CORS Errors

**Symptoms**: API calls fail with CORS errors

**Solutions**:
- This shouldn't happen since all APIs are called from Next.js server
- If you see CORS errors, ensure you're using the API routes (`/api/*`) not calling external APIs directly from client

### Issue: Rate Limiting

**Symptoms**: APIs return 429 Too Many Requests

**Solutions**:
1. OpenWeatherMap free tier: 60 calls/minute
2. ElectricityMaps free tier: Check your plan limits
3. Gemini AI free tier: 60 requests/minute
4. Implement caching for production use

---

## Production Checklist

Before deploying to production:

- [ ] All API keys configured in environment variables
- [ ] `.env.local` is NOT committed to git (check `.gitignore`)
- [ ] Build completes successfully: `npm run build`
- [ ] Test the production build locally: `npm start`
- [ ] Test all API endpoints with production URLs
- [ ] Set up monitoring/logging (optional: Vercel Analytics, Sentry)
- [ ] Configure custom domain (optional)
- [ ] Enable HTTPS (automatic on Vercel/Netlify)

---

## Next Steps

1. **Database Integration**: Replace mock data with Supabase
   - Create `audit_events` table
   - Implement data persistence
   - Add historical audit tracking

2. **Real IoT Integration**: Connect actual IoT sensors
   - Set up MQTT broker or WebSocket connection
   - Implement real-time data streaming
   - Add sensor authentication

3. **Dashboard**: Build frontend to visualize audits
   - Display real-time audit results
   - Show historical trends
   - Alert system for anomalies

4. **Authentication**: Add user management
   - Implement Supabase Auth
   - Role-based access control
   - Multi-tenant support

---

## Support

For issues or questions:
- Check console logs for detailed error messages
- Review API documentation for each service
- Ensure all environment variables are correctly set
- Verify API keys have not expired

**Happy Deploying! 🚀**
