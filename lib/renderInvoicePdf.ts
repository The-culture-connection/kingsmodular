import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { existsSync } from "fs";
import { platform } from "os";

// Determine if we're running in a serverless environment
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_TARGET);

/**
 * Find Chrome executable path for local development
 */
function findChromePath(): string | null {
  const currentPlatform = platform();
  
  if (currentPlatform === 'win32') {
    // Windows common paths
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    ];
    
    for (const path of possiblePaths) {
      if (path && existsSync(path)) {
        return path;
      }
    }
  } else if (currentPlatform === 'darwin') {
    // macOS
    const macPath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (existsSync(macPath)) {
      return macPath;
    }
  } else {
    // Linux
    const linuxPaths = ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'];
    for (const path of linuxPaths) {
      if (existsSync(path)) {
        return path;
      }
    }
  }
  
  return null;
}

export async function renderInvoicePdf(html: string): Promise<Buffer> {
  let browser;
  
  try {
    // Determine executable path and launch args based on environment
    let executablePath: string | undefined;
    let launchArgs: string[];
    let defaultViewport: { width: number; height: number } | undefined;
    let headless: boolean;

    if (isServerless) {
      // Serverless environment: use @sparticuz/chromium
      executablePath = await chromium.executablePath();
      launchArgs = chromium.args || [];
      defaultViewport = { width: 1280, height: 720 };
      headless = true; // Always headless in serverless
      console.log('Using serverless Chromium');
    } else {
      // Local development: try to use system Chrome/Chromium
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        // Use custom path if provided
        executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        console.log('Using custom Puppeteer executable path');
      } else {
        // Try to find Chrome in common locations
        const chromePath = findChromePath();
        
        if (chromePath) {
          executablePath = chromePath;
          console.log('Using system Chrome:', chromePath);
        } else {
          // Fallback to Chromium if Chrome not found
          executablePath = await chromium.executablePath();
          console.log('Chrome not found, using Chromium fallback');
        }
      }
      
      // Local development args (less restrictive)
      launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ];
      
      defaultViewport = { width: 1280, height: 720 };
      headless = true;
    }

    console.log(`Launching Puppeteer in ${isServerless ? 'serverless' : 'local'} mode...`);
    console.log(`Executable path: ${executablePath}`);
    console.log(`Launch args:`, launchArgs);

    try {
      browser = await puppeteer.launch({
        args: launchArgs,
        defaultViewport: defaultViewport,
        executablePath: executablePath,
        headless: headless,
      });
      console.log("Puppeteer browser launched successfully");
    } catch (launchError: any) {
      console.error("Puppeteer launch failed:", launchError);
      throw new Error(`Failed to launch browser: ${launchError.message}. Make sure Chrome/Chromium is installed or set PUPPETEER_EXECUTABLE_PATH.`);
    }

    const page = await browser.newPage();
    
    // Set content with timeout
    await page.setContent(html, { 
      waitUntil: "networkidle0",
      timeout: 30000, // 30 second timeout
    });

    // Generate PDF
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "24px", right: "24px", bottom: "24px", left: "24px" },
    });

    return Buffer.from(pdf);
  } catch (error: any) {
    console.error("Puppeteer error:", error);
    throw new Error(`PDF generation failed: ${error.message || "Unknown error"}`);
  } finally {
    if (browser) {
      await browser.close().catch((err) => {
        console.error("Error closing browser:", err);
      });
    }
  }
}

