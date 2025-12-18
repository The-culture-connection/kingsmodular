# Railway Service Setup Guide

## The Problem

If you see "Server is ready" in the logs but still get 502 errors, the issue is usually with Railway service configuration, not your code.

## Step-by-Step Fix

### 1. Check Service is Public

1. Go to your Railway project dashboard
2. Click on your service (the one running your Next.js app)
3. Click on the **"Settings"** tab (or gear icon)
4. Scroll down to **"Networking"** or **"Public Networking"**
5. Make sure **"Public"** is enabled (toggle should be ON)
6. If it's OFF, turn it ON
7. This will generate a public URL like `https://your-app.up.railway.app`

### 2. Verify Service is Running

1. In Railway dashboard, look at your service
2. Check the status indicator:
   - ✅ **Green/Active** = Service is running
   - ❌ **Red/Stopped** = Service is stopped (click "Deploy" to start)
   - ⚠️ **Yellow/Warning** = Service has issues

### 3. Check Service Port

1. In Railway service settings
2. Look for **"Port"** or **"Ports"** section
3. Railway should automatically detect port 8080 (or whatever PORT env var is set)
4. If no port is configured, Railway might not be routing traffic

### 4. Verify Environment Variables

1. Go to service **"Variables"** tab
2. Make sure `PORT` is NOT manually set (Railway sets this automatically)
3. If you manually set `PORT`, remove it and let Railway handle it

### 5. Check Service Health

1. Once service is public and running
2. Test the health endpoint: `https://your-app.up.railway.app/api/health`
3. Should return: `{"status":"ok","timestamp":"...","uptime":...}`

### 6. Redeploy if Needed

1. If you changed settings, you may need to redeploy
2. Go to **"Deployments"** tab
3. Click **"Redeploy"** on the latest deployment
4. Or push a new commit to trigger a redeploy

## Common Issues

### Issue: Service is Private
**Symptom**: Server starts but 502 errors
**Fix**: Enable "Public" networking in service settings

### Issue: Wrong Port Configuration
**Symptom**: Server listens on wrong port
**Fix**: Don't manually set PORT env var, let Railway set it

### Issue: Service Not Started
**Symptom**: No logs, service shows "Stopped"
**Fix**: Click "Deploy" or "Start" in Railway dashboard

### Issue: Multiple Services
**Symptom**: Confusion about which service is the web app
**Fix**: Make sure you're looking at the correct service that runs `npm start`

## Verification Checklist

- [ ] Service is set to "Public" in Railway settings
- [ ] Service status shows "Active" or "Running"
- [ ] Logs show "✅ Server is ready on http://0.0.0.0:[PORT]"
- [ ] Health endpoint responds: `/api/health`
- [ ] Public URL is accessible (not just internal)
- [ ] No manual PORT environment variable is set

## Still Not Working?

If you've checked all of the above and still get 502 errors:

1. **Share your Railway service settings screenshot** (hide sensitive info)
2. **Check if there's a reverse proxy or load balancer** in front
3. **Verify the service URL** - make sure you're accessing the correct public URL
4. **Check Railway status page** - sometimes Railway has outages

