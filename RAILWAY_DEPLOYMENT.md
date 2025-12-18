# Railway Deployment Guide

## Important: Check Railway Logs First

If you're getting a 502 error, **the most important step is to check your Railway deploy logs**. Look for:
- Error messages during build
- Error messages during startup
- "Ready on http://..." message (means server started successfully)
- Any stack traces or crash messages

## Environment Variables Required

Make sure to set these environment variables in your Railway project settings:

### Required for Basic Functionality
- `NODE_ENV=production` (usually set automatically by Railway)

### Required for Firebase Client SDK
The Firebase client SDK uses hardcoded config in `lib/firebase/config.ts`, so no env vars needed for basic auth/database.

### Required for Firebase Admin SDK (Invoice PDF Generation)
**CRITICAL**: These are REQUIRED for invoice downloads to work. Without these, invoice generation will fail with a 500 error.

**See `FIREBASE_ADMIN_SETUP.md` for detailed step-by-step instructions.**

Quick setup:
- `FIREBASE_PROJECT_ID=kingsmodularllc`
- `FIREBASE_CLIENT_EMAIL=your-service-account-email@kingsmodularllc.iam.gserviceaccount.com`
- `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"`
- `FIREBASE_STORAGE_BUCKET=kingsmodularllc.firebasestorage.app`

**How to Get Firebase Admin Credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (kingsmodularllc)
3. Click the gear icon → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Download the JSON file
7. Extract values from the JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (copy the entire value including BEGIN/END lines)
   - Storage bucket from Firebase config → `FIREBASE_STORAGE_BUCKET`

**Common Error**: If you see "Failed to fetch estimate" or "Firebase Admin SDK is not configured", it means these environment variables are missing in Railway.

### Optional
- `PUPPETEER_EXECUTABLE_PATH` - Only needed if you want to use a custom Chrome path (not needed on Railway)

## Port Configuration

The app automatically uses Railway's `PORT` environment variable. The custom `server.js` ensures the app listens on `0.0.0.0:PORT`.

## Service Configuration on Railway

**IMPORTANT**: Make sure your Railway service is properly configured:

1. **Service is Public**: 
   - Go to your Railway service settings
   - Under "Networking" or "Settings"
   - Make sure the service is set to "Public" (not private)
   - This generates a public URL

2. **Port is Correct**:
   - Railway automatically sets the `PORT` environment variable
   - The server listens on `0.0.0.0:PORT` (all interfaces)
   - Check logs to confirm the port (should be 8080 or similar)

3. **Health Check**:
   - Railway may need a health check endpoint
   - The app includes `/api/health` endpoint
   - You can test it: `https://your-app.railway.app/api/health`

4. **Service Status**:
   - In Railway dashboard, check that the service shows "Active" or "Running"
   - If it shows "Stopped" or "Error", check the logs

## Troubleshooting 502 Errors

If you're getting a 502 error, check:

1. **Railway Deploy Logs** - Look for error messages during startup
2. **Missing Environment Variables** - Firebase Admin SDK will warn but not crash if missing
3. **Build Errors** - Make sure the build completes successfully
4. **Port Binding** - The server should log "Ready on http://0.0.0.0:PORT"

## Common Issues

### App crashes on startup
- Check Railway logs for the exact error
- Verify all required environment variables are set
- Make sure Firebase Admin credentials are correctly formatted

### Firebase Storage not working
- This is expected if Firebase Admin env vars are not set
- The app will fall back to returning PDFs directly as base64
- Check `lib/firebase/firebaseAdmin.ts` for initialization warnings

### Build succeeds but app won't start
- Check that `server.js` is in the root directory
- Verify `package.json` has `"start": "node server.js"`
- Check Railway logs for runtime errors

### Invoice download still failing after setting environment variables
1. **Verify variables are set**: Go to Railway → Variables tab and confirm all 4 variables are present
2. **Check variable format**: 
   - `FIREBASE_PRIVATE_KEY` should include `-----BEGIN PRIVATE KEY-----` at the start
   - `FIREBASE_PRIVATE_KEY` should include `-----END PRIVATE KEY-----` at the end
   - The key should be the full value from the JSON file
3. **Redeploy**: After adding/updating variables, Railway should auto-redeploy. If not, trigger a manual redeploy
4. **Test Admin SDK**: Visit `https://your-app.railway.app/api/test-admin` to see detailed diagnostics
5. **Check logs**: Look for `[AdminInit-` or `[Admin-` prefixes in Railway logs to see exact errors
6. **Common issues**:
   - Private key missing newlines (should have `\n` characters)
   - Private key wrapped in extra quotes (Railway handles quotes automatically)
   - Variables not saved (make sure to click "Save" after adding)
   - Service not redeployed after adding variables

