# How to Access Service Variables in Railway

## The Problem
You've set variables as **Shared Variables** but need to reference them in your **Service Variables**.

## Finding Your Service in Railway

### Method 1: From Dashboard
1. Go to https://railway.app/dashboard
2. You'll see a list of **Projects**
3. Click on your project name (e.g., "Kings Modular" or similar)
4. Inside the project, you'll see **Services** (these are your deployments)
5. Click on the service card (it might be named "web", "api", "kingsmodular-production", etc.)
6. Look for tabs: **Deployments**, **Metrics**, **Variables**, **Settings**
7. Click **Variables** tab

### Method 2: From Project Settings
1. Go to Project Settings (gear icon)
2. Look for **Services** section on the left sidebar
3. Click on your service name
4. This should take you to the service page
5. Click **Variables** tab

### Method 3: Direct URL
If you know your service ID, you can go directly to:
```
https://railway.app/project/[PROJECT_ID]/service/[SERVICE_ID]/variables
```

## What You Should See

In the Service Variables tab, you should see:
- A list of existing variables (if any)
- An "Add Variable" or "New Variable" button
- Input fields for Variable Name and Value

## What to Do

Add these 4 variables with references to your Shared Variables:

| Variable Name | Value |
|--------------|-------|
| `FIREBASE_PROJECT_ID` | `${{FIREBASE_PROJECT_ID}}` |
| `FIREBASE_CLIENT_EMAIL` | `${{FIREBASE_CLIENT_EMAIL}}` |
| `FIREBASE_PRIVATE_KEY` | `${{FIREBASE_PRIVATE_KEY}}` |
| `FIREBASE_STORAGE_BUCKET` | `${{FIREBASE_STORAGE_BUCKET}}` |

**Important:** Use the exact syntax `${{VARIABLE_NAME}}` - this tells Railway to use the Shared Variable.

## Still Can't Find It?

### Option A: Use Railway CLI
If you have Railway CLI installed:

```bash
railway variables set FIREBASE_PROJECT_ID='${{FIREBASE_PROJECT_ID}}'
railway variables set FIREBASE_CLIENT_EMAIL='${{FIREBASE_CLIENT_EMAIL}}'
railway variables set FIREBASE_PRIVATE_KEY='${{FIREBASE_PRIVATE_KEY}}'
railway variables set FIREBASE_STORAGE_BUCKET='${{FIREBASE_STORAGE_BUCKET}}'
```

### Option B: Copy Values Directly
If referencing doesn't work, copy the actual values from Shared Variables:

1. Go to Project Settings → Shared Variables
2. Click on each variable to see its value
3. Copy the value
4. Go to Service → Variables
5. Add the variable with the actual value (not reference)

## Visual Navigation Path

```
Railway Dashboard
│
├── Projects (list)
│   └── [Your Project] ← Click here
│       │
│       ├── Services (cards/list)
│       │   └── [Your Service Card] ← Click here (this is your deployment)
│       │       │
│       │       ├── Deployments tab
│       │       ├── Metrics tab
│       │       ├── Variables tab ← CLICK HERE
│       │       └── Settings tab
│       │
│       └── Settings (gear icon) ← This is PROJECT settings (Shared Variables)
│           └── Shared Variables
```

## Key Difference

- **Project Settings → Shared Variables**: Project-level, need to be referenced
- **Service → Variables**: Service-level, directly available to that service

You need to set variables in **Service → Variables** that reference your **Shared Variables**.

