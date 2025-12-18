import { getBucket } from "./firebase/firebaseAdmin";

export async function uploadInvoicePdf(params: {
  invoiceNumber: string;
  pdfBuffer: Buffer;
  customerId: string;
}) {
  const { invoiceNumber, pdfBuffer, customerId } = params;

  const bucket = getBucket();
  if (!bucket) {
    throw new Error("Firebase Storage bucket is not initialized. Please check your Firebase Admin configuration.");
  }

  // Path convention: invoices/{customerId}/{invoiceNumber}.pdf
  const filePath = `invoices/${customerId}/${invoiceNumber}.pdf`;
  const file = bucket.file(filePath);

  try {
    await file.save(pdfBuffer, {
      contentType: "application/pdf",
      resumable: false,
      metadata: {
        cacheControl: "private, max-age=0, no-transform",
      },
    });

    // Signed URL for instant download (expires in 15 minutes)
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });

    return { filePath, signedUrl };
  } catch (error: any) {
    console.error("Firebase Storage upload error:", error);
    throw new Error(`Failed to upload PDF to Firebase Storage: ${error.message || "Unknown error"}`);
  }
}

