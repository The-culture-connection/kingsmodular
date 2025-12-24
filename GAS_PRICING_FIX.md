# Gas Pricing Fix - Setup Instructions

## Issues Fixed:

1. **API Key Not Found**: Created server-side API route so `GOOGLE_MAPS_API_KEY` works properly
2. **Firestore Undefined Error**: Fixed `updateJobData` to filter out undefined values

## Setup Steps:

### 1. Environment Variable

Make sure your `.env.local` file has:

```env
GOOGLE_MAPS_API_KEY=AIzaSyDi...
```

**Important:**
- File must be named `.env.local` (not `.env`)
- Restart your dev server after adding/changing the variable
- The variable is `GOOGLE_MAPS_API_KEY` (no `NEXT_PUBLIC_` prefix needed since it runs server-side now)

### 2. Restart Dev Server

After adding the API key, restart your Next.js dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 3. Verify API Key is Loaded

Check the server console logs when creating a job. You should see:
- `✅ [DISTANCE API] API key found (length: XX)`
- NOT `❌ [DISTANCE API] Google Maps API key not found`

## How It Works Now:

1. **Job Creation**: When a job is created, it's saved to Firestore first
2. **Gas Calculation**: After a short delay, an API route is called (`/api/jobs/calculate-gas`)
3. **Server-Side Execution**: The API route runs on the server where `GOOGLE_MAPS_API_KEY` is available
4. **Distance Calculation**: Google Maps Distance Matrix API is called server-side
5. **Update Job**: Gas cost is calculated and saved back to the job document

## Testing:

1. Create a new job with a valid address
2. Check browser console - should see:
   - `🔵 [FIRESTORE] Starting gas calculation for new job: [jobId]`
   - `✅ [FIRESTORE] Gas calculation completed for job: [jobId]`
3. Check server console - should see:
   - `🔵 [API] Gas calculation request for jobId: [jobId]`
   - `✅ [DISTANCE API] API key found`
   - `✅ [DISTANCE API] Success! Distance: X miles`
4. View the job in the Job Suite → Financials tab
5. You should see "Gas Cost" line item if distance > 0

## Troubleshooting:

### Still seeing "API key not found"
- ✅ Check `.env.local` file exists (not `.env`)
- ✅ Check variable name is exactly `GOOGLE_MAPS_API_KEY`
- ✅ Restart dev server
- ✅ Check server console (not browser console) for API key logs

### Gas cost still 0
- Check that job has a valid `location` field
- Check server console for distance calculation logs
- Verify Google Maps Distance Matrix API is enabled in Google Cloud Console

### Firestore errors
- Should be fixed now - undefined values are filtered out
- If still seeing errors, check the console logs for which field is undefined

