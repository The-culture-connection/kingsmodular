# Gas Pricing Engine Setup Guide

## 1. Environment Variable

Add this to your `.env.local` file:

```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Note:** Use `GOOGLE_MAPS_API_KEY` (without `NEXT_PUBLIC_`) for server-side usage, which is more secure. The code will automatically use this for API calls.

## 2. Enable Google Maps APIs

In your Google Cloud Console, enable these APIs:

1. **Distance Matrix API** (Required)
   - Go to: https://console.cloud.google.com/apis/library/distancematrix.googleapis.com
   - Click "Enable"

2. **Geocoding API** (Optional but recommended for caching)
   - Go to: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com
   - Click "Enable"

## 3. API Key Restrictions (Recommended)

For security, restrict your API key:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your API key
3. Under "API restrictions", select "Restrict key"
4. Choose only:
   - Distance Matrix API
   - Geocoding API (if using)
5. Under "Application restrictions", you can restrict by:
   - HTTP referrers (for client-side)
   - IP addresses (for server-side)

## 4. Initialize Pricing Config

The pricing config will be created automatically with defaults when first accessed. You can also manually initialize it by:

1. Going to Admin Suite → Pricing Engine
2. The config will load with defaults:
   - Office Address: "6407 US - 50, Holton, IN 47023"
   - Gas Price: $5.00/gallon
   - MPG: 20
   - Surge Threshold: 200 miles
   - Surge Multiplier: 2.0x
3. Adjust settings as needed and click "Save Configuration"

## 5. How It Works

### Automatic Calculation
- Gas is automatically calculated when:
  - A new job is created (customer quote or admin job creation)
  - You click "Recalculate All Jobs" in the Pricing Engine

### Manual Recalculation
- Go to Admin Suite → Pricing Engine
- Click "Recalculate All Jobs" to update all existing jobs with current pricing settings

### Gas Calculation Logic
1. For each job item, finds the origin:
   - Looks for a prior job that ended 1-2 days before this job's start date
   - If found, uses that job's location as origin
   - If not found, uses the office address
2. Calculates driving distance from origin to destination
3. Calculates base cost: `distance × (gasPrice / mpg)`
4. If distance > surge threshold:
   - Adds surge pricing to customer price
   - Surge cost = `distance × (basePerMile × multiplier)`
5. Saves gas data to each job item and rolls up to `Cost.gasCost`

## 6. Testing

1. Create a test job with a location
2. Check the job detail view → Financials tab
3. You should see gas cost in the breakdown
4. If distance > 200 miles, check that customer price includes surge

## 7. Troubleshooting

### Distance returns 0
- Check that `GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Verify the API key is enabled for Distance Matrix API
- Check browser console for API errors

### Gas not calculating
- Ensure pricing config is enabled (Admin Suite → Pricing Engine)
- Check that job has a valid location address
- Verify API key has correct permissions

### Prior job not found
- This is normal if it's the first job or no jobs ended 1-2 days before
- System will use office address as origin

