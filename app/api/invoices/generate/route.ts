import { NextResponse } from "next/server";
import { renderInvoicePdf } from "@/lib/renderInvoicePdf";
import { uploadInvoicePdf } from "@/lib/uploadInvoicePdf";
import { invoiceHtml } from "@/lib/invoiceTemplate";
import { getCustomerPendingEstimates } from "@/lib/firebase/firestore";

export async function POST(req: Request) {
  console.log("=== Invoice Generation API Called ===");
  
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed:", { estimateId: body.estimateId, customerId: body.customerId });
    } catch (parseError: any) {
      console.error("Request body parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid request body", message: parseError.message },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const { estimateId, customerId, jobNumber, companyName } = body;

    if (!estimateId || !customerId) {
      return NextResponse.json(
        { error: "Estimate ID and Customer ID are required" },
        { status: 400 }
      );
    }

    // Fetch the estimate from Firestore
    let estimates;
    try {
      estimates = await getCustomerPendingEstimates(customerId);
    } catch (firestoreError: any) {
      console.error("Firestore error:", firestoreError);
      return NextResponse.json(
        {
          error: "Failed to fetch estimate",
          message: firestoreError.message || "Database error",
        },
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const estimate = estimates.find((est) => est.id === estimateId);

    if (!estimate) {
      return NextResponse.json(
        { error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Only allow PDF generation for certain statuses
    const allowedStatuses = ["approved", "outstanding", "in_progress", "paid"];
    if (!allowedStatuses.includes(estimate.status)) {
      return NextResponse.json(
        { error: "Invoice can only be generated for approved, outstanding, in-progress, or paid estimates" },
        { status: 400 }
      );
    }

    // Generate HTML with optional custom inputs
    console.log("Generating HTML template...");
    let html: string;
    try {
      html = invoiceHtml({
        invoice: estimate,
        jobNumber: jobNumber || estimate.id?.slice(0, 8).toUpperCase(),
        companyName: companyName || estimate.customerCompanyName,
      });
      console.log("HTML template generated successfully");
    } catch (htmlError: any) {
      console.error("HTML generation error:", htmlError);
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
    console.log("Starting PDF generation with Puppeteer...");
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await renderInvoicePdf(html);
      console.log("PDF generated successfully, size:", pdfBuffer.length, "bytes");
    } catch (pdfError: any) {
      console.error("PDF generation error:", pdfError);
      console.error("PDF error stack:", pdfError.stack);
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
      const uploadResult = await uploadInvoicePdf({
        invoiceNumber,
        pdfBuffer,
        customerId,
      });
      signedUrl = uploadResult.signedUrl;
      filePath = uploadResult.filePath;
    } catch (uploadError: any) {
      console.error("Upload error (will return PDF directly):", uploadError);
      // If upload fails, we'll return the PDF directly as base64
    }

    // If upload succeeded, return the signed URL
    if (signedUrl) {
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
    const invoiceNumber = estimate.id?.slice(0, 8).toUpperCase() || "INV-" + Date.now();
    const base64Pdf = pdfBuffer.toString('base64');
    
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
    console.error("=== UNHANDLED ERROR IN INVOICE GENERATION ===");
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Error stack:", error.stack);
    console.error("Full error:", error);
    
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

