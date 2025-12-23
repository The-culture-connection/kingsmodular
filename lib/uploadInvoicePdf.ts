import { getFirebaseAdminApp } from './firebase/firebaseAdmin'

/**
 * Upload PDF buffer to Firebase Storage and return signed URL
 */
export async function uploadInvoicePdf(
  pdfBuffer: Buffer,
  fileName: string
): Promise<{ filePath: string; signedUrl: string }> {
  try {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF buffer is empty or undefined')
    }

    console.log('[uploadInvoicePdf] Uploading PDF:', {
      fileName,
      bufferSize: pdfBuffer.length,
    })

    const adminApp = getFirebaseAdminApp()
    const bucket = adminApp.storage().bucket()

    const file = bucket.file(fileName)

    // Upload the buffer
    await file.save(pdfBuffer, {
      metadata: {
        contentType: 'application/pdf',
      },
    })

    console.log('[uploadInvoicePdf] PDF uploaded successfully')

    // Generate a signed URL (valid for 15 minutes)
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    })

    console.log('[uploadInvoicePdf] Generated signed URL')

    return {
      filePath: fileName,
      signedUrl,
    }
  } catch (error: any) {
    console.error('[uploadInvoicePdf] Error:', error)
    throw new Error(`Failed to upload PDF to Firebase Storage: ${error.message}`)
  }
}

