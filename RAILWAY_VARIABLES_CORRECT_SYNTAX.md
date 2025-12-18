# Correct Railway Variable Syntax

## The Problem

You're using the wrong syntax. The `${{}}` syntax should reference the **variable name**, not the value.

## ❌ Wrong Syntax (What You Have)

```
FIREBASE_CLIENT_EMAIL="${{firebase-adminsdk-fbsvc@kingsmodularllc.iam.gserviceaccount.com}}"
FIREBASE_PRIVATE_KEY="${{-----BEGIN PRIVATE KEY-----...}}"
FIREBASE_PROJECT_ID="${{kingsmodularllc}}"
```

This is trying to reference a shared variable named `firebase-adminsdk-fbsvc@kingsmodularllc.iam.gserviceaccount.com`, which doesn't exist.

## ✅ Correct Syntax (What You Need)

The `${{}}` syntax references the **name** of your Shared Variable:

```
FIREBASE_CLIENT_EMAIL="${{FIREBASE_CLIENT_EMAIL}}"
FIREBASE_PRIVATE_KEY="${{FIREBASE_PRIVATE_KEY}}"
FIREBASE_PROJECT_ID="${{FIREBASE_PROJECT_ID}}"
FIREBASE_STORAGE_BUCKET="${{FIREBASE_STORAGE_BUCKET}}"
```

## How to Fix It

### Option 1: Reference Shared Variables (If Names Match)

1. Go to your Service → Variables tab
2. **Delete** the current variables with wrong syntax
3. Add new variables with correct syntax:

| Variable Name | Value |
|--------------|-------|
| `FIREBASE_PROJECT_ID` | `${{FIREBASE_PROJECT_ID}}` |
| `FIREBASE_CLIENT_EMAIL` | `${{FIREBASE_CLIENT_EMAIL}}` |
| `FIREBASE_PRIVATE_KEY` | `${{FIREBASE_PRIVATE_KEY}}` |
| `FIREBASE_STORAGE_BUCKET` | `${{FIREBASE_STORAGE_BUCKET}}` |

**Important:** The name inside `${{}}` must match the exact name of your Shared Variable.

### Option 2: Use Direct Values (Easier)

Since you already have the values, just use them directly:

1. Go to your Service → Variables tab
2. **Delete** the current variables
3. Add new variables with actual values (no `${{}}`):

| Variable Name | Value |
|--------------|-------|
| `FIREBASE_PROJECT_ID` | `kingsmodularllc` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@kingsmodularllc.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3ZsvrVG8ZRUjh\n5XVjtKXQjCNkyzTDjPzdICU6zz+aCjB2tPFFjRh/cZtEVtx6EBjlQx09W17f5mgt\nhadWJJm1gj2B36ES3pSvLDUMWugG9NpQD0HwGc27Ziew/AZC+O0btj9OqzvC69QO\nY/RsT/gjnLeQsuXK8/qp+ueOU1DeT6mBENRvmpm3SXYQ5fi3h+enHv2cTRkezNxg\nTK9Mhp/iQOK8Lw/UYtwIk1bTF54dZI3jrL7PpH7D1+YMFYSpNa7So82lPyPsUghI\nKuhCfStrA6KMlEbpjf3DGVttoSq5ULp6jna2LE2GLD1cdhvIzfuyolupHdC0jgWW\nc7QQqywtAgMBAAECggEATsN5iRfqXKZ6PfWO/CJ9YbqFisiQYPkgMZEYHBEchfmh\nRaHAyndlkXoHTgqlxlA6eN9hY9PlQ3AOxpoTOvYeAysrYibZ5KItpattHuC9rBsk\n1OQwk75pMfWVzzb1M3b3UYLr3kvArx4bpJB9zLRtY1HvLdf+wzITsUN9hYy3erls\nUJtu6Ojrp+3SpGgHzcKGr+bl9Z2zedlDfJXC2GiV97BqI0IC4+649Du18K0e6TXn\nl7yvTKF7e3XLUxWF6ytZeDNGWb/zVCJh5Y5hb9A5/aCbnGjRA2EtmwzAEI9jy5z/\n6WsV0orxmo96v51ti3jcJ1cGAGSL+k+fmrYnSizumwKBgQD8X7IupIxD8ktbdbZ0\ntqARPUem8S9rXIgQXmw3JEeiUMX1V6Ta2AQq33fCTgzG/fsvY0XES518FjRmL77r\n9AEHoGy8jhouTtpRNxyInxMfsOovZpiYLqhEO3OPTYrOi6BK35Ic5eNTj0VsmJAt\nRKH36IQ9aNtDYq9rA0qXcTBO9wKBgQC6CWaMCAZ50ROHJ8wfI86UXvnHv86T/Zey\nFOu2T3ZbQ5dVnO5ibYuaQPRzB99vc+JQpc9WJqUZlN1DUlBkrxBPdtNS84zy2Wou\nOoG801G52YmVKBk4nzxlkiiukP7zB2KOAhfpr8CT3KH+1DkgrMMKmtd5YWm4BTYC\nOHrQHfBA+wKBgQCY5/YSEno1dKi5qjE4t6l1qHYwLHL5jl+V40+XfTC1pFC8HDTy\nruyfeTObEyTkr98vT+tmShYJp35p50W6ueSh1U3sVACCzB20FTsBf7fbfJn2zCdq\nFOK4LHkQev+9spUUqC5judkouGZsrGa2Np4XkNYGSvCF/FWh9aWM6fRF8wKBgCsP\n9f6/9M/Jx51nZuZmYXESsvq7uVOkRbLhCNbAegMSGDunAb8i4EeqdWsTDXM8/cvx\nNZcZhunu/XCR4y4LH9llBfGTkrK8BMoCnPlaaPZ+FkzCZWQn59ETDfuqcHlM4lFA\nxsw+9HLFhXH5KegYVWVlBi+Ajvobqq7E6Bi4dV51AoGBANYOQMPmkLSDK0BQZVzB\nie0HF4SNuVhI9bKx3/3XUgLhA+H/9rdBW2I67qOtKCY3clg7Wq9hVSXkb0qAgw5G\nbjZ9vYNJBT09FTVxpMe89sz6M4ZtbLkLCeL5qQOjZRtrCJsVdhGQCQU1rVxp1DXf\nOdGLh5qtfzIvLUGFa3saVDC3\n-----END PRIVATE KEY-----` |
| `FIREBASE_STORAGE_BUCKET` | `kingsmodularllc.firebasestorage.app` |

**Note:** For `FIREBASE_PRIVATE_KEY`, paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. Railway will handle the newlines automatically.

## Quick Fix Steps

1. **Go to Service → Variables tab**
2. **Click the `⋮` (three dots) next to each wrong variable**
3. **Click "Delete" or "Remove"**
4. **Click "New Variable"**
5. **Add each variable with the correct value** (use Option 2 above - direct values)
6. **Save** - Railway will auto-redeploy

## Verify

After fixing, test again:
```
https://kingsmodular-production.up.railway.app/api/test-admin
```

You should see `"success": true` and all variables detected.

