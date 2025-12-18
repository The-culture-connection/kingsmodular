# Fix: Railway Variables Not Being Detected

## Problem
You've set environment variables in Railway's "Shared Variables" but the application can't see them. The test endpoint shows all variables as "MISSING".

## Solution

Railway has two types of variables:
1. **Service Variables** - Set directly on your service (recommended)
2. **Shared Variables** - Set at project level, must be referenced

## Quick Navigation Guide

**To find your Service Variables:**
1. Railway Dashboard → Click your **Project** (not settings)
2. You'll see **Services** (deployment cards)
3. Click on your **Service** (the card, e.g., "kingsmodular-production")
4. Click **Variables** tab at the top

**See `HOW_TO_ACCESS_SERVICE_VARIABLES.md` for detailed navigation instructions.**

### Quick Fix: Use Service Variables

1. **Go to your Railway Service** (not Project Settings)
   - In Railway dashboard, click on your service (e.g., "kingsmodular-production")
   - NOT the project settings

2. **Click on "Variables" tab** in your service

3. **Add the 4 Firebase Admin variables directly:**
   - Click "New Variable"
   - Add each one:
     - `FIREBASE_PROJECT_ID` = `kingsmodularllc`
     - `FIREBASE_CLIENT_EMAIL` = (your service account email)
     - `FIREBASE_PRIVATE_KEY` = (the full private key from JSON)
     - `FIREBASE_STORAGE_BUCKET` = `kingsmodularllc.firebasestorage.app`

4. **Save and Redeploy**
   - Railway will automatically redeploy
   - Or trigger a manual redeploy

### Alternative: Reference Shared Variables

If you want to keep using Shared Variables:

1. **Go to your Railway Service** → **Variables** tab

2. **Add variables that reference the shared ones:**
   - `FIREBASE_PROJECT_ID` = `${{FIREBASE_PROJECT_ID}}`
   - `FIREBASE_CLIENT_EMAIL` = `${{FIREBASE_CLIENT_EMAIL}}`
   - `FIREBASE_PRIVATE_KEY` = `${{FIREBASE_PRIVATE_KEY}}`
   - `FIREBASE_STORAGE_BUCKET` = `${{FIREBASE_STORAGE_BUCKET}}`

   **IMPORTANT:** The `${{...}}` syntax references the **variable name**, not the value. The name inside must match your Shared Variable name exactly.

   **Easier Option:** Just use the actual values directly (no `${{}}` needed). See `RAILWAY_VARIABLES_CORRECT_SYNTAX.md` for details.

3. **Save and Redeploy**

## Verify It's Working

After setting the variables:

1. **Wait for redeploy** (Railway should auto-redeploy)

2. **Test the endpoint:**
   ```
   https://kingsmodular-production.up.railway.app/api/test-admin
   ```

3. **Check the response:**
   - `success` should be `true`
   - `checks.envVars` should show all variables as present
   - `adminApp` should be "Initialized"
   - `firestore` should be "Accessible"

## Why This Happens

Railway's Shared Variables are project-level and need to be explicitly referenced by services. Service Variables are directly available to that specific service, which is why they're recommended for this use case.

## Still Not Working?

1. **Check variable names** - Must be exact: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_STORAGE_BUCKET`
2. **Check private key format** - Should include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
3. **Check Railway logs** - Look for initialization errors
4. **Redeploy manually** - Sometimes Railway needs a manual trigger

