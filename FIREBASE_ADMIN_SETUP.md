# Firebase Admin SDK Setup for Railway

## Why This Is Needed

The invoice download feature requires Firebase Admin SDK to access Firestore from the server-side API routes. The Admin SDK bypasses Firestore security rules and allows server-side operations.

## Step-by-Step Setup

### 1. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kingsmodularllc**
3. Click the **gear icon** (⚙️) → **Project Settings**
4. Click the **"Service Accounts"** tab
5. Click **"Generate New Private Key"** button
6. A JSON file will download (e.g., `kingsmodularllc-firebase-adminsdk-xxxxx.json`)

### 2. Extract Values from JSON

Open the downloaded JSON file. It will look like this:

```json
{
  "type": "service_account",
  "project_id": "kingsmodularllc",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@kingsmodularllc.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 3. Set Environment Variables in Railway

Go to your Railway project → **Variables** tab and add these:

#### FIREBASE_PROJECT_ID
```
kingsmodularllc
```

#### FIREBASE_CLIENT_EMAIL
```
firebase-adminsdk-xxxxx@kingsmodularllc.iam.gserviceaccount.com
```
*(Use the `client_email` value from the JSON)*

#### FIREBASE_PRIVATE_KEY
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
... (entire key including BEGIN and END lines) ...
-----END PRIVATE KEY-----
```
**IMPORTANT**: 
- Copy the ENTIRE `private_key` value from the JSON (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
- Keep the `\n` characters as-is (they represent newlines)
- In Railway, you can paste it directly - Railway will handle the newlines

#### FIREBASE_STORAGE_BUCKET
```
kingsmodularllc.firebasestorage.app
```
*(Or check your Firebase project settings for the exact storage bucket name)*

### 4. Verify in Railway

After adding all variables:
1. Make sure all 4 variables are set
2. Redeploy your service (Railway will automatically redeploy when you save variables)
3. Check the deployment logs to ensure no errors

### 5. Test Invoice Download

1. Go to your deployed site
2. Navigate to a job with "Approved" status
3. Click "Download Invoice"
4. It should work now!

## Troubleshooting

### Error: "Firebase Admin SDK is not configured"

**Solution**: Check that all 4 environment variables are set in Railway:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`

### Error: "FIREBASE_PRIVATE_KEY appears to be malformed"

**Solution**: 
- Make sure the private key includes `-----BEGIN PRIVATE KEY-----` at the start
- Make sure it includes `-----END PRIVATE KEY-----` at the end
- Don't remove the `\n` characters (they're needed for newlines)

### Error: "Failed to fetch estimate"

**Possible causes**:
1. Environment variables not set (most common)
2. Firestore rules blocking Admin SDK access (shouldn't happen, but check)
3. Network issues

**Solution**: Check Railway logs for detailed error messages. Look for lines starting with `[Admin-` or `[req-` to see the exact error.

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit the service account JSON file or private key to Git
- The private key gives full access to your Firebase project
- Only add these variables in Railway (server-side), never in client-side code
- If the key is compromised, regenerate it immediately in Firebase Console

## Quick Checklist

- [ ] Downloaded service account JSON from Firebase Console
- [ ] Added `FIREBASE_PROJECT_ID` to Railway
- [ ] Added `FIREBASE_CLIENT_EMAIL` to Railway
- [ ] Added `FIREBASE_PRIVATE_KEY` to Railway (full key with BEGIN/END)
- [ ] Added `FIREBASE_STORAGE_BUCKET` to Railway
- [ ] Redeployed service in Railway
- [ ] Tested invoice download

