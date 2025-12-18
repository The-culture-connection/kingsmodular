# Railway Deployment Guide

## Environment Variables Required

Make sure to set these environment variables in your Railway project settings:

### Required for Basic Functionality
- `NODE_ENV=production` (usually set automatically by Railway)

### Required for Firebase Client SDK
The Firebase client SDK uses hardcoded config in `lib/firebase/config.ts`, so no env vars needed for basic auth/database.

### Required for Firebase Admin SDK (Invoice PDF Generation)
If you want invoice PDF generation to work, set these:

- `FIREBASE_PROJECT_ID=kingsmodularllc`
- `FIREBASE_CLIENT_EMAIL=your-service-account-email@kingsmodularllc.iam.gserviceaccount.com`
- `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"`
- `FIREBASE_STORAGE_BUCKET=kingsmodularllc.firebasestorage.app`

**Note:** The `FIREBASE_PRIVATE_KEY` must include the newlines (`\n`) and be wrapped in quotes.

### Optional
- `PUPPETEER_EXECUTABLE_PATH` - Only needed if you want to use a custom Chrome path (not needed on Railway)

## Port Configuration

The app automatically uses Railway's `PORT` environment variable. The custom `server.js` ensures the app listens on `0.0.0.0:PORT`.

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

