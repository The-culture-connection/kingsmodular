# Troubleshooting 502 Errors on Railway

## Step 1: Check Railway Deploy Logs

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Deployments" tab
4. Click on the latest deployment
5. Check the "Build Logs" and "Deploy Logs"

Look for:
- ✅ **Success**: "Ready on http://0.0.0.0:PORT" or "Compiled successfully"
- ❌ **Errors**: Any red error messages, stack traces, or "Failed to start" messages

## Common Issues and Fixes

### Issue 1: Font Files Not Found
**Error**: `Cannot find module '../Assets/Fonts/...'` or similar

**Fix**: Make sure the `Assets` folder is in your repository root and committed to git.

### Issue 2: Port Binding Error
**Error**: `EADDRINUSE` or port-related errors

**Fix**: Railway automatically sets the `PORT` environment variable. The start script should use `${PORT:-3000}`.

### Issue 3: Missing Environment Variables
**Error**: Firebase or other service initialization errors

**Fix**: Check that all required environment variables are set in Railway project settings.

### Issue 4: Build Succeeds but App Crashes
**Error**: Build completes but app won't start

**Possible causes**:
- Runtime error in app initialization
- Missing dependencies
- Font path issues
- Firebase Admin SDK initialization errors

**Fix**: Check deploy logs for the exact error message.

## Quick Debugging Steps

1. **Verify build succeeds**: Check build logs for "Compiled successfully"
2. **Check startup logs**: Look for "Ready on http://..." message
3. **Verify PORT is set**: Railway sets this automatically, but check logs to confirm
4. **Check for runtime errors**: Look for any error messages after "Ready on..."

## If Still Not Working

1. Share the exact error message from Railway logs
2. Check if the build completes successfully
3. Verify all environment variables are set
4. Make sure the `Assets` folder is committed to git

