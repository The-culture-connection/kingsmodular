# Railway Service Variables Setup Guide

## Quick Fix: Reference Your Shared Variables

Since you've already set the variables as **Shared Variables**, you just need to reference them in your service.

## Step-by-Step Instructions

### Step 1: Find Your Service

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click on your **project** (not the settings icon)
3. You should see a list of **services** - look for one named something like:
   - `kingsmodular-production`
   - `kings-modular-website`
   - Or whatever you named your service

### Step 2: Open Service Settings

1. Click on the **service name** (the card/box, not the project name)
2. This opens the service details page
3. Look for tabs at the top: **Deployments**, **Metrics**, **Variables**, **Settings**, etc.
4. Click on the **"Variables"** tab

### Step 3: Add Variable References

In the Variables tab, you'll see an option to add new variables. Add these 4 variables:

**Variable 1:**
- **Name:** `FIREBASE_PROJECT_ID`
- **Value:** `${{FIREBASE_PROJECT_ID}}`
- Click "Add" or "Save"

**Variable 2:**
- **Name:** `FIREBASE_CLIENT_EMAIL`
- **Value:** `${{FIREBASE_CLIENT_EMAIL}}`
- Click "Add" or "Save"

**Variable 3:**
- **Name:** `FIREBASE_PRIVATE_KEY`
- **Value:** `${{FIREBASE_PRIVATE_KEY}}`
- Click "Add" or "Save"

**Variable 4:**
- **Name:** `FIREBASE_STORAGE_BUCKET`
- **Value:** `${{FIREBASE_STORAGE_BUCKET}}`
- Click "Add" or "Save"

### Step 4: Verify and Redeploy

1. After adding all 4 variables, Railway should automatically redeploy
2. If not, go to the **Deployments** tab and click "Redeploy"
3. Wait for the deployment to complete

### Step 5: Test

Visit: `https://kingsmodular-production.up.railway.app/api/test-admin`

You should see `"success": true` and all variables detected.

## Visual Guide

```
Railway Dashboard
  └── Your Project
       └── [Click on Service Card] ← Click here, not project settings
            └── Variables Tab ← Click here
                 └── Add Variable
                      Name: FIREBASE_PROJECT_ID
                      Value: ${{FIREBASE_PROJECT_ID}} ← Use this syntax
```

## Alternative: If You Can't Find Service Variables

If you absolutely cannot find the service Variables tab, you can:

1. **Delete the Shared Variables** (from Project Settings → Shared Variables)
2. **Re-add them as Service Variables** directly:
   - Go to your service
   - Variables tab
   - Add each variable with the actual values (not references)

## Troubleshooting

### "I don't see a Variables tab"
- Make sure you clicked on the **service** (the deployment), not the project
- The service should show deployment history, logs, etc.
- Variables tab should be visible in the service view

### "The ${{}} syntax doesn't work"
- Make sure the Shared Variable names match exactly
- Check that Shared Variables are set in the same environment (production)
- Try copying the exact variable name from Shared Variables

### "Still showing as MISSING"
- Wait for Railway to redeploy (can take 1-2 minutes)
- Check Railway logs for any errors
- Verify the Shared Variables are in the "production" environment

## Quick Reference

**Shared Variables Location:**
- Project Settings → Shared Variables

**Service Variables Location:**
- Service → Variables Tab

**To Reference Shared Variables:**
- Use `${{VARIABLE_NAME}}` syntax in Service Variables

