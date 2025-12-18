# Invoice PDF Generation Setup

This document explains how to set up autonomous invoice PDF generation using Puppeteer and Firebase Storage.

## Overview

The invoice generation system:
1. Generates professional PDF invoices from HTML templates using Puppeteer
2. Uploads PDFs to Firebase Storage
3. Returns signed download URLs that expire after 15 minutes
4. Works in both serverless (Vercel) and traditional hosting environments

## Prerequisites

1. **Firebase Service Account Key**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `kingsmodularllc`
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file

2. **Extract Service Account Credentials**
   From the downloaded JSON file, you'll need:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

## Environment Variables

Create a `.env.local` file in the root directory with:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=kingsmodularllc
FIREBASE_CLIENT_EMAIL=your-service-account-email@kingsmodularllc.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=kingsmodularllc.firebasestorage.app
```

**Important Notes:**
- The `FIREBASE_PRIVATE_KEY` must include the `\n` characters (newlines) as shown
- Wrap the entire private key in quotes
- Keep the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers

## Firebase Storage Setup

1. **Enable Firebase Storage**
   - Go to Firebase Console → Storage
   - Click "Get Started"
   - Start in production mode (we'll use signed URLs for security)

2. **Storage Rules** (Optional - for additional security)
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       // Invoices are private - only accessible via signed URLs
       match /invoices/{customerId}/{invoiceId}.pdf {
         allow read: if request.auth != null && request.auth.uid == customerId;
         allow write: if false; // Only server can write
       }
     }
   }
   ```

## Local Development

The system automatically detects your environment and uses the appropriate browser:

### Automatic Detection
- **Local Development**: Automatically tries to find and use system Chrome/Chromium
- **Serverless (Vercel/AWS Lambda)**: Automatically uses `@sparticuz/chromium`

### Manual Configuration (Optional)
If automatic detection doesn't work, you can manually set the Chrome path:

**Windows:**
```env
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

**macOS:**
```env
PUPPETEER_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

**Linux:**
```env
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
```

### Fallback Behavior
- If system Chrome is not found, the system will automatically fall back to `@sparticuz/chromium`
- No additional setup needed - it works out of the box!

## Deployment

### Vercel Deployment
1. Add all environment variables in Vercel Dashboard → Settings → Environment Variables
2. Deploy - the serverless functions will automatically use `@sparticuz/chromium`

### Other Platforms
- **Railway/EC2**: Can use regular `puppeteer` package instead of `puppeteer-core`
- **Firebase Cloud Functions**: Use the same setup as Vercel

## Testing

1. Navigate to `/customer/jobs`
2. Find a job with status: `approved`, `outstanding`, `in_progress`, or `paid`
3. Click "Download Invoice"
4. The PDF should generate and download automatically

## Troubleshooting

### Error: "Failed to generate invoice"
- Check that all environment variables are set correctly
- Verify Firebase Storage is enabled
- Check server logs for detailed error messages

### Error: "Puppeteer launch failed"
- For local dev: Set `PUPPETEER_EXECUTABLE_PATH` to your Chrome executable
- For production: Ensure `@sparticuz/chromium` is installed

### PDF looks incorrect
- Check the HTML template in `lib/invoiceTemplate.ts`
- Verify fonts are system-safe (Arial, sans-serif)
- Test with different invoice data

## File Structure

```
lib/
  firebase/
    firebaseAdmin.ts      # Firebase Admin SDK initialization
  renderInvoicePdf.ts     # Puppeteer PDF generation
  uploadInvoicePdf.ts    # Firebase Storage upload
  invoiceTemplate.ts     # HTML invoice template

app/
  api/
    invoices/
      generate/
        route.ts         # API endpoint for invoice generation
```

## Security Notes

1. **Private PDFs**: All invoices are stored privately in Firebase Storage
2. **Signed URLs**: Download URLs expire after 15 minutes
3. **Server-Side Only**: PDF generation happens server-side, never in the browser
4. **Access Control**: Only customers can generate invoices for their own estimates

## Next Steps

- [ ] Add invoice numbering system
- [ ] Add tax calculation
- [ ] Add payment terms and notes
- [ ] Add company logo to PDF
- [ ] Add email delivery option

