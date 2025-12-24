import { NextResponse } from 'next/server'
import { getFirebaseAdminApp, isFirebaseAdminConfigured } from '@/lib/firebase/firebaseAdmin'
import { getCustomerPendingEstimatesAdmin } from '@/lib/firebase/firestoreAdmin'
import { renderInvoicePdf } from '@/lib/renderInvoicePdf'
import { uploadInvoicePdf } from '@/lib/uploadInvoicePdf'
import { invoiceHtml } from '@/lib/invoiceTemplate'

export async function POST(req: Request) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log(`[${requestId}] Starting invoice generation with photos`)

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK is not configured' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { estimateId, customerId, jobNumber, companyName, photoUrls } = body

    console.log(`[${requestId}] Request params:`, { estimateId, customerId, jobNumber, companyName, photoCount: photoUrls?.length || 0 })

    if (!estimateId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required parameters: estimateId and customerId' },
        { status: 400 }
      )
    }

    // Fetch estimate data
    const estimates = await getCustomerPendingEstimatesAdmin(customerId)
    const estimate = estimates.find(e => e.id === estimateId)

    if (!estimate) {
      return NextResponse.json(
        { error: 'Estimate not found' },
        { status: 404 }
      )
    }

    console.log(`[${requestId}] Found estimate:`, estimate.id)

    // Get photos from job if not provided
    const photosToUse = photoUrls && photoUrls.length > 0 
      ? photoUrls 
      : (estimate as any).photos || []

    // Generate HTML with invoice and photos
    const htmlContent = generateInvoiceWithPhotosHtml({
      invoice: estimate,
      jobNumber: jobNumber || (estimate.id ? estimate.id.substring(0, 8) : 'UNKNOWN'),
      companyName: companyName || estimate.customerCompanyName || estimate.customerEmail,
      photoUrls: photosToUse,
    })

    console.log(`[${requestId}] Generated HTML, length:`, htmlContent.length)

    // Generate PDF
    const pdfBuffer = await renderInvoicePdf(htmlContent)
    console.log(`[${requestId}] Generated PDF, size:`, pdfBuffer.length, 'bytes')

    // Upload to Firebase Storage
    const fileName = `invoices/${estimateId}-with-photos.pdf`
    const { filePath, signedUrl } = await uploadInvoicePdf(pdfBuffer, fileName)
    console.log(`[${requestId}] Uploaded PDF to:`, filePath)

    return NextResponse.json({
      success: true,
      filePath,
      signedUrl,
    })
  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate invoice with photos',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

function generateInvoiceWithPhotosHtml(params: {
  invoice: any
  jobNumber: string
  companyName: string
  photoUrls: string[]
}): string {
  const { invoice, jobNumber, companyName, photoUrls } = params
  
  // Generate base invoice HTML
  const invoiceHtmlContent = invoiceHtml({
    invoice,
    jobNumber,
    companyName,
  })

  // Add photos section if photos exist
  if (photoUrls && photoUrls.length > 0) {
    const photosHtml = `
      <div style="page-break-before: always; margin-top: 40px; padding: 20px;">
        <h2 style="color: #aa9550; margin-bottom: 20px; font-size: 24px; font-weight: bold;">Job Photos</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
          ${photoUrls.map((url: string, index: number) => `
            <div style="page-break-inside: avoid; margin-bottom: 20px; border: 2px solid #aa9550; border-radius: 4px; padding: 10px; background: #f9f9f9;">
              <img 
                src="${url}" 
                alt="Job Photo ${index + 1}" 
                style="width: 100%; height: auto; max-height: 400px; object-fit: contain; display: block;"
              />
              <p style="text-align: center; margin-top: 8px; color: #666; font-size: 12px; font-weight: 500;">Photo ${index + 1}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `
    
    // Insert photos before closing body tag
    return invoiceHtmlContent.replace('</body>', `${photosHtml}</body>`)
  }

  return invoiceHtmlContent
}

