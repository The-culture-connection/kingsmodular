/**
 * Generate HTML invoice template
 */
export function invoiceHtml(params: {
  invoice: any
  jobNumber: string
  companyName: string
}): string {
  const { invoice, jobNumber, companyName } = params

  // Extract job details
  const jobs = invoice.jobs || []
  const totalPrice = invoice.totalPrice || 0
  const location = invoice.location || ''
  const dateRange = invoice.dateRange || {}
  const startDate = dateRange.start || ''
  const endDate = dateRange.end || ''

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${jobNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      color: #000;
      background: #fff;
      padding: 40px;
      line-height: 1.6;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    .header {
      border-bottom: 3px solid #aa9550;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #aa9550;
      font-size: 32px;
      margin-bottom: 10px;
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
    .invoice-info div {
      flex: 1;
    }
    .invoice-info h3 {
      color: #000;
      font-size: 14px;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .invoice-info p {
      color: #333;
      font-size: 14px;
    }
    .job-details {
      margin: 30px 0;
    }
    .job-details h2 {
      color: #aa9550;
      font-size: 20px;
      margin-bottom: 15px;
      border-bottom: 2px solid #aa9550;
      padding-bottom: 5px;
    }
    .job-item {
      margin-bottom: 15px;
      padding: 15px;
      background: #f9f9f9;
      border-left: 4px solid #aa9550;
    }
    .job-item h3 {
      color: #000;
      font-size: 16px;
      margin-bottom: 5px;
    }
    .job-item p {
      color: #666;
      font-size: 14px;
      margin: 5px 0;
    }
    .job-item .price {
      color: #000;
      font-size: 18px;
      font-weight: bold;
      margin-top: 10px;
    }
    .total-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #aa9550;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 16px;
    }
    .total-row.total {
      font-size: 24px;
      font-weight: bold;
      color: #000;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #aa9550;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>INVOICE</h1>
      <div class="invoice-info">
        <div>
          <h3>Invoice Number</h3>
          <p>${jobNumber}</p>
        </div>
        <div>
          <h3>Date</h3>
          <p>${formatDate(new Date().toISOString())}</p>
        </div>
        <div>
          <h3>Company</h3>
          <p>${companyName || 'N/A'}</p>
        </div>
      </div>
    </div>

    <div class="job-details">
      <h2>Job Details</h2>
      ${location ? `<p style="margin-bottom: 15px;"><strong>Location:</strong> ${location}</p>` : ''}
      ${startDate || endDate ? `<p style="margin-bottom: 15px;"><strong>Date Range:</strong> ${formatDate(startDate)}${endDate ? ' - ' + formatDate(endDate) : ''}</p>` : ''}
      
      ${jobs.map((job: any, index: number) => `
        <div class="job-item">
          <h3>${job.name || `Job ${index + 1}`}</h3>
          ${job.description ? `<p>${job.description}</p>` : ''}
          <div class="price">$${(job.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
      `).join('')}
    </div>

    <div class="total-section">
      <div class="total-row total">
        <span>Total Amount Due:</span>
        <span>$${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

