import { NextResponse } from "next/server";
import { renderInvoicePdf } from "@/lib/renderInvoicePdf";
import { uploadInvoicePdf } from "@/lib/uploadInvoicePdf";
import { invoiceHtml } from "@/lib/invoiceTemplate";
import { getCustomerPendingEstimatesAdmin } from "@/lib/firebase/firestoreAdmin";

export async function POST(req: Request) {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log("=== Invoice Generation API Called ===");
  console.log(`[${requestId}] Request started at:`, new Date().toISOString());
  console.log(`[${requestId}] Request URL:`, req.url);
  console.log(`[${requestId}] Request method:`, req.method);
  
  try {
    // Parse request body
    let body;
    try {
      const bodyText = await req.text();
      console.log(`[${requestId}] Raw request body (first 500 chars):`, bodyText.substring(0, 500));
      body = JSON.parse(bodyText);
      console.log(`[${requestId}] Request body parsed successfully:`, { 
        estimateId: body.estimateId, 
        customerId: body.customerId,
        jobNumber: body.jobNumber,
        companyName: body.companyName,
        hasAllFields: !!(body.estimateId && body.customerId)
      });
    } catch (parseError: any) {
      console.error(`[${requestId}] Request body parse error:`, parseError);
      console.error(`[${requestId}] Parse error stack:`, parseError.stack);
      return NextResponse.json(
        { error: "Invalid request body", message: parseError.message },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const { estimateId, customerId, jobNumber, companyName } = body;

    console.log(`[${requestId}] Extracted parameters:`, {
      estimateId: estimateId || 'MISSING',
      customerId: customerId || 'MISSING',
      jobNumber: jobNumber || 'not provided',
      companyName: companyName || 'not provided'
    });

    if (!estimateId || !customerId) {
      console.error(`[${requestId}] Missing required parameters:`, {
        hasEstimateId: !!estimateId,
        hasCustomerId: !!customerId
      });
      return NextResponse.json(
        { error: "Estimate ID and Customer ID are required" },
        { status: 400 }
      );
    }

    // Fetch the estimate from Firestore using Admin SDK (server-side)
    let estimates;
    try {
      console.log(`[${requestId}] Fetching estimates using Admin SDK for customer:`, customerId);
      console.log(`[${requestId}] Looking for estimate ID:`, estimateId);
      const startTime = Date.now();
      estimates = await getCustomerPendingEstimatesAdmin(customerId);
      const fetchDuration = Date.now() - startTime;
      console.log(`[${requestId}] Successfully fetched ${estimates.length} estimates in ${fetchDuration}ms`);
      console.log(`[${requestId}] Estimate IDs found:`, estimates.map(e => e.id));
      console.log(`[${requestId}] Estimate statuses:`, estimates.map(e => ({ id: e.id, status: e.status })));
    } catch (firestoreError: any) {
      console.error(`[${requestId}] Firestore Admin error:`, firestoreError);
      console.error(`[${requestId}] Error name:`, firestoreError.name);
      console.error(`[${requestId}] Error message:`, firestoreError.message);
      console.error(`[${requestId}] Error stack:`, firestoreError.stack);
      console.error(`[${requestId}] Full error object:`, JSON.stringify(firestoreError, Object.getOwnPropertyNames(firestoreError)));
      return NextResponse.json(
        {
          error: "Failed to fetch estimate",
          message: firestoreError.message || "Database error",
          details: process.env.NODE_ENV === "development" ? firestoreError.stack : undefined,
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[${requestId}] Searching for estimate with ID:`, estimateId);
    const estimate = estimates.find((est) => est.id === estimateId);
    console.log(`[${requestId}] Estimate found:`, estimate ? 'YES' : 'NO');
    if (estimate) {
      console.log(`[${requestId}] Found estimate details:`, {
        id: estimate.id,
        status: estimate.status,
        totalPrice: estimate.totalPrice,
        jobsCount: estimate.jobs?.length || 0,
        customerId: estimate.customerId,
        customerEmail: estimate.customerEmail
      });
    } else {
      console.log(`[${requestId}] Available estimate IDs for comparison:`, estimates.map(e => ({
        id: e.id,
        matches: e.id === estimateId,
        type: typeof e.id,
        typeOfSearch: typeof estimateId
      })));
    }

    if (!estimate) {
      console.error(`[${requestId}] Estimate not found!`, {
        searchedId: estimateId,
        availableIds: estimates.map(e => e.id),
        availableCount: estimates.length
      });
      return NextResponse.json(
        { 
          error: "Estimate not found",
          searchedId: estimateId,
          availableIds: estimates.map(e => e.id)
        },
        { status: 404 }
      );
    }

    // Only allow PDF generation for certain statuses
    const allowedStatuses = ["approved", "outstanding", "in_progress", "paid"];
    const normalizedStatus = String(estimate.status).toLowerCase().trim();
    console.log(`[${requestId}] Checking status:`, {
      rawStatus: estimate.status,
      normalizedStatus: normalizedStatus,
      isAllowed: allowedStatuses.includes(normalizedStatus),
      allowedStatuses: allowedStatuses
    });
    
    if (!allowedStatuses.includes(normalizedStatus)) {
      console.error(`[${requestId}] Status not allowed for invoice generation:`, normalizedStatus);
      return NextResponse.json(
        { 
          error: "Invoice can only be generated for approved, outstanding, in-progress, or paid estimates",
          currentStatus: estimate.status,
          normalizedStatus: normalizedStatus
        },
        { status: 400 }
      );
    }

    // Generate HTML with optional custom inputs
    console.log(`[${requestId}] Generating HTML template...`);
    let html: string;
    try {
      const htmlParams = {
        invoice: estimate,
        jobNumber: jobNumber || estimate.id?.slice(0, 8).toUpperCase(),
        companyName: companyName || estimate.customerCompanyName,
      };
      console.log(`[${requestId}] HTML generation parameters:`, {
        jobNumber: htmlParams.jobNumber,
        companyName: htmlParams.companyName,
        estimateId: estimate.id,
        jobsCount: estimate.jobs?.length || 0
      });
      html = invoiceHtml(htmlParams);
      console.log(`[${requestId}] HTML template generated successfully, length:`, html.length, "characters");
    } catch (htmlError: any) {
      console.error(`[${requestId}] HTML generation error:`, htmlError);
      console.error(`[${requestId}] HTML error stack:`, htmlError.stack);
      return NextResponse.json(
        {
          error: "Failed to generate HTML template",
          message: htmlError.message || "HTML generation failed",
        },
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate PDF
    console.log(`[${requestId}] Starting PDF generation with Puppeteer...`);
    let pdfBuffer: Buffer;
    try {
      const pdfStartTime = Date.now();
      pdfBuffer = await renderInvoicePdf(html);
      const pdfDuration = Date.now() - pdfStartTime;
      console.log(`[${requestId}] PDF generated successfully in ${pdfDuration}ms, size:`, pdfBuffer.length, "bytes");
    } catch (pdfError: any) {
      console.error(`[${requestId}] PDF generation error:`, pdfError);
      console.error(`[${requestId}] PDF error name:`, pdfError.name);
      console.error(`[${requestId}] PDF error message:`, pdfError.message);
      console.error(`[${requestId}] PDF error stack:`, pdfError.stack);
      return NextResponse.json(
        {
          error: "Failed to generate PDF",
          message: pdfError.message || "PDF generation failed. Please check server logs.",
          details: process.env.NODE_ENV === "development" ? pdfError.stack : undefined,
        },
        { 
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Try to upload to Firebase Storage, but fallback to direct PDF return if it fails
    let signedUrl: string | null = null;
    let filePath: string | null = null;
    
    try {
      const invoiceNumber = estimate.id?.slice(0, 8).toUpperCase() || "INV-" + Date.now();
      console.log(`[${requestId}] Attempting to upload PDF to Firebase Storage...`, {
        invoiceNumber: invoiceNumber,
        pdfSize: pdfBuffer.length,
        customerId: customerId
      });
      const uploadStartTime = Date.now();
      const uploadResult = await uploadInvoicePdf({
        invoiceNumber,
        pdfBuffer,
        customerId,
      });
      const uploadDuration = Date.now() - uploadStartTime;
      signedUrl = uploadResult.signedUrl;
      filePath = uploadResult.filePath;
      console.log(`[${requestId}] PDF uploaded successfully in ${uploadDuration}ms:`, {
        filePath: filePath,
        hasSignedUrl: !!signedUrl
      });
    } catch (uploadError: any) {
      console.warn(`[${requestId}] Upload error (will return PDF directly):`, uploadError);
      console.warn(`[${requestId}] Upload error message:`, uploadError.message);
      console.warn(`[${requestId}] Upload error stack:`, uploadError.stack);
      // If upload fails, we'll return the PDF directly as base64
    }

    // If upload succeeded, return the signed URL
    if (signedUrl) {
      console.log(`[${requestId}] Returning signed URL response`);
      const totalDuration = Date.now() - parseInt(requestId.split('-')[1]);
      console.log(`[${requestId}] Request completed successfully in ${totalDuration}ms`);
      return NextResponse.json(
        {
          success: true,
          filePath,
          signedUrl,
          invoiceNumber: estimate.id?.slice(0, 8).toUpperCase() || "N/A",
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fallback: Return PDF directly as base64
    console.log(`[${requestId}] Returning PDF as base64 (Firebase Storage not available)`);
    const invoiceNumber = estimate.id?.slice(0, 8).toUpperCase() || "INV-" + Date.now();
    const base64StartTime = Date.now();
    const base64Pdf = pdfBuffer.toString('base64');
    const base64Duration = Date.now() - base64StartTime;
    console.log(`[${requestId}] Base64 encoding completed in ${base64Duration}ms, length:`, base64Pdf.length);
    const totalDuration = Date.now() - parseInt(requestId.split('-')[1]);
    console.log(`[${requestId}] Request completed successfully in ${totalDuration}ms`);
    
    return NextResponse.json(
      {
        success: true,
        pdfBase64: base64Pdf,
        invoiceNumber,
        message: "PDF generated successfully (Firebase Storage not configured, returning PDF directly)",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    const requestId = `req-${Date.now()}`;
    console.error(`[${requestId}] === UNHANDLED ERROR IN INVOICE GENERATION ===`);
    console.error(`[${requestId}] Error message:`, error.message);
    console.error(`[${requestId}] Error name:`, error.name);
    console.error(`[${requestId}] Error stack:`, error.stack);
    console.error(`[${requestId}] Full error:`, error);
    console.error(`[${requestId}] Error keys:`, Object.keys(error));
    
    // Ensure we always return JSON, never HTML
    return NextResponse.json(
      {
        error: "Failed to generate invoice",
        message: error.message || "Unknown error occurred",
        errorName: error.name,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { 
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "X-Error-Type": error.name || "Unknown",
        },
      }
    );
  }
}

