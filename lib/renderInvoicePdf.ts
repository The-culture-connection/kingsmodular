import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

/**
 * Render HTML content to PDF buffer using Puppeteer
 */
export async function renderInvoicePdf(htmlContent: string): Promise<Buffer> {
  let browser: any = null

  try {
    // Detect if we're in a serverless environment
    const isServerless = 
      process.env.VERCEL || 
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_SERVICE_NAME

    console.log('[renderInvoicePdf] Environment:', {
      isServerless,
      vercel: !!process.env.VERCEL,
      railway: !!process.env.RAILWAY_ENVIRONMENT,
    })

    let executablePath: string | undefined
    let launchArgs: string[] = []

    if (isServerless) {
      // Use @sparticuz/chromium for serverless environments
      executablePath = await chromium.executablePath()
      launchArgs = [
        ...chromium.args,
        '--hide-scrollbars',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ]
    } else {
      // Local development - try to find Chrome
      const possiblePaths = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
      ]

      executablePath = possiblePaths.find(path => path && require('fs').existsSync(path))

      if (!executablePath) {
        // Fallback to @sparticuz/chromium if Chrome not found
        console.log('[renderInvoicePdf] Chrome not found, using @sparticuz/chromium')
        executablePath = await chromium.executablePath()
        launchArgs = [
          ...chromium.args,
          '--hide-scrollbars',
          '--disable-web-security',
        ]
      } else {
        launchArgs = [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--hide-scrollbars',
          '--disable-web-security',
        ]
      }
    }

    console.log('[renderInvoicePdf] Launching browser with executable:', executablePath)

    browser = await puppeteer.launch({
      executablePath,
      args: launchArgs,
      headless: true,
    })

    const page = await browser.newPage()
    
    // Set content and wait for it to load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    })

    console.log('[renderInvoicePdf] PDF generated, size:', pdfBuffer.length, 'bytes')

    return Buffer.from(pdfBuffer)
  } catch (error: any) {
    console.error('[renderInvoicePdf] Error:', error)
    throw new Error(`Failed to generate PDF: ${error.message}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

