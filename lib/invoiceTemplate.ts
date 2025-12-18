import { PendingEstimate } from "./firebase/firestore";

export interface InvoiceTemplateParams {
  invoice: PendingEstimate;
  jobNumber?: string; // First 8 digits of document ID (optional override)
  companyName?: string; // Custom company name (optional override)
}

export function invoiceHtml(params: InvoiceTemplateParams): string {
  const { invoice, jobNumber, companyName } = params;
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Use provided job number or default to first 8 digits of document ID
  const invoiceNumber = jobNumber || invoice.id?.slice(0, 8).toUpperCase() || "N/A";
  
  // Use provided company name or default to customer company name or email
  const billToCompanyName = companyName || invoice.customerCompanyName || invoice.customerEmail;
  const issueDate = invoice.createdAt
    ? formatDate(
        invoice.createdAt instanceof Date
          ? invoice.createdAt.toISOString()
          : invoice.createdAt
      )
    : formatDate(new Date().toISOString());
  const dueDate = invoice.dateRange.end
    ? formatDate(invoice.dateRange.end)
    : "N/A";

  const subtotal = invoice.totalPrice || 0;
  const tax = 0; // Add tax calculation if needed
  const total = subtotal + tax;

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
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
        padding: 0;
        margin: 0;
        line-height: 1.6;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 40px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 3px solid #aa9550;
      }
      .header-left {
        flex: 1;
      }
      .header-left h1 {
        font-size: 36px;
        color: #aa9550;
        margin-bottom: 5px;
        font-weight: bold;
        letter-spacing: 1px;
      }
      .header-left .tagline {
        font-size: 14px;
        color: #666;
        margin-top: 5px;
      }
      .header-right {
        text-align: right;
        flex: 1;
      }
      .invoice-title {
        font-size: 28px;
        font-weight: bold;
        color: #000;
        margin-bottom: 20px;
      }
      .invoice-details {
        margin-top: 10px;
      }
      .invoice-details div {
        margin-bottom: 8px;
        font-size: 14px;
      }
      .invoice-details strong {
        color: #000;
        min-width: 100px;
        display: inline-block;
      }
      .card {
        border: 1px solid #ddd;
        padding: 20px;
        border-radius: 4px;
        margin-bottom: 30px;
        background: #fafafa;
      }
      .card h3 {
        margin-bottom: 15px;
        color: #000;
        font-size: 16px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .card-content {
        font-size: 14px;
        line-height: 1.8;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 30px;
        margin-bottom: 20px;
      }
      th,
      td {
        border: 1px solid #ddd;
        padding: 12px;
        text-align: left;
      }
      th {
        background: #aa9550;
        color: #fff;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.5px;
      }
      tbody tr {
        background: #fff;
      }
      tbody tr:nth-child(even) {
        background: #f9f9f9;
      }
      .totals {
        margin-top: 30px;
        display: flex;
        justify-content: flex-end;
      }
      .totals-container {
        width: 350px;
        border: 2px solid #aa9550;
        padding: 20px;
        background: #fafafa;
      }
      .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        font-size: 14px;
      }
      .totals-row.subtotal {
        border-bottom: 1px solid #ddd;
        padding-bottom: 12px;
        margin-bottom: 8px;
      }
      .totals-row.total {
        font-weight: bold;
        font-size: 20px;
        border-top: 2px solid #aa9550;
        margin-top: 12px;
        padding-top: 15px;
        color: #000;
      }
      .totals-label {
        font-weight: 600;
      }
      .totals-amount {
        font-weight: 600;
        color: #000;
      }
      .footer {
        margin-top: 50px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        text-align: center;
        color: #666;
        font-size: 12px;
      }
      .status-badge {
        display: inline-block;
        padding: 5px 15px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin-top: 10px;
      }
      .status-approved {
        background: #d4edda;
        color: #155724;
      }
      .status-outstanding {
        background: #f8d7da;
        color: #721c24;
      }
      .status-in-progress {
        background: #d1ecf1;
        color: #0c5460;
      }
      .status-paid {
        background: #d4edda;
        color: #155724;
      }
      @media print {
        body {
          padding: 20px;
        }
        .no-print {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="header-left">
          <h1>KINGS MODULAR LLC</h1>
          <div class="tagline">Modular Construction Services</div>
        </div>
        <div class="header-right">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-details">
            <div><strong>Job #:</strong> ${invoiceNumber}</div>
            <div><strong>Date:</strong> ${issueDate}</div>
            <div><strong>Due Date:</strong> ${dueDate}</div>
          </div>
        </div>
      </div>

    <div class="card">
      <h3>Bill To</h3>
      <div class="card-content">
        <strong>${billToCompanyName}</strong><br />
        ${invoice.customerEmail}<br />
        ${invoice.location || "N/A"}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 50px; text-align: center;">#</th>
          <th>Job Description</th>
          <th style="width: 150px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.jobs
          .map(
            (job, index) => `
          <tr>
            <td style="text-align: center; font-weight: 600;">${index + 1}</td>
            <td>
              <strong>${job.name}</strong><br />
              <span style="color: #666; font-size: 12px;">${job.description || "N/A"}</span>
            </td>
            <td style="text-align: right; font-weight: 600;">$${job.price.toLocaleString()}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-container">
        <div class="totals-row subtotal">
          <span class="totals-label">Subtotal:</span>
          <span class="totals-amount">$${subtotal.toLocaleString()}</span>
        </div>
        ${tax > 0 ? `
        <div class="totals-row">
          <span class="totals-label">Tax:</span>
          <span class="totals-amount">$${tax.toFixed(2)}</span>
        </div>
        ` : ""}
        <div class="totals-row total">
          <span class="totals-label">Total:</span>
          <span class="totals-amount">$${total.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
      <p style="margin-top: 10px;">Kings Modular LLC - Modular Construction Services</p>
    </div>
    </div>
  </body>
</html>
  `.trim();
}

