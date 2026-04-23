export interface ReportKpis {
  gross: number;
  expenses: number;
  net: number;
  margin: number;
  paidInvoices: number;
  pendingAmount: number;
  overdueAmount: number;
}

export interface RevenuePoint {
  name: string;
  current: number;
  previous: number;
}

export interface ServiceSplitPoint {
  name: string;
  value: number;
  color: string;
}

export interface LedgerRow {
  id: string;
  date: string;
  customer: string;
  plate: string;
  service: string;
  status: string;
  amount: number;
}

export interface ReportPrintData {
  kpis: ReportKpis;
  revenueData: RevenuePoint[];
  serviceSplit: ServiceSplitPoint[];
  ledgerRows: LedgerRow[];
  generatedAt: string;
}

export const formatReportCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const renderRows = (rows: LedgerRow[]) => {
  if (rows.length === 0) {
    return '<tr><td colspan="7" class="empty">No invoice records found for this report.</td></tr>';
  }

  return rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.id.slice(0, 8).toUpperCase())}</td>
      <td>${escapeHtml(row.date)}</td>
      <td>${escapeHtml(row.customer)}</td>
      <td>${escapeHtml(row.plate)}</td>
      <td>${escapeHtml(row.service)}</td>
      <td><span class="status status-${escapeHtml(row.status.toLowerCase())}">${escapeHtml(row.status.toUpperCase())}</span></td>
      <td class="right">${escapeHtml(formatReportCurrency(row.amount))}</td>
    </tr>
  `).join('');
};

const renderRevenueRows = (rows: RevenuePoint[]) =>
  rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.name)}</td>
      <td class="right">${escapeHtml(formatReportCurrency(row.current))}</td>
      <td class="right">${escapeHtml(formatReportCurrency(row.previous))}</td>
    </tr>
  `).join('');

const renderServiceRows = (rows: ServiceSplitPoint[]) => {
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return rows.map((row) => {
    const percentage = total > 0 ? (row.value / total) * 100 : 0;

    return `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td class="right">${escapeHtml(row.value)}</td>
        <td class="right">${percentage.toFixed(1)}%</td>
      </tr>
    `;
  }).join('');
};

export const buildReportLedgerHtml = ({
  kpis,
  revenueData,
  serviceSplit,
  ledgerRows,
  generatedAt,
}: ReportPrintData) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Karigar Financial Ledger</title>
  <style>
    @page { size: A4; margin: 13mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.4;
    }
    .ledger {
      width: 100%;
    }
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 28px;
      border-bottom: 3px solid #111827;
      padding-bottom: 18px;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 30px;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .eyebrow {
      color: #4b5563;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .14em;
      text-transform: uppercase;
      margin: 0 0 6px;
    }
    h1 {
      margin: 0;
      text-align: right;
      font-size: 26px;
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    .generated {
      margin-top: 8px;
      text-align: right;
      color: #4b5563;
      font-weight: 700;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .metric {
      border: 1.5px solid #111827;
      padding: 10px;
      min-height: 76px;
    }
    .metric span {
      display: block;
      color: #4b5563;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    .metric strong {
      display: block;
      margin-top: 7px;
      font-size: 18px;
      overflow-wrap: anywhere;
    }
    .section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 18px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 13px;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #111827;
      color: #ffffff;
      padding: 8px;
      text-align: left;
      font-size: 9px;
      letter-spacing: .11em;
      text-transform: uppercase;
    }
    td {
      border: 1px solid #d1d5db;
      padding: 8px;
      vertical-align: top;
    }
    tbody tr:nth-child(even) td {
      background: #f9fafb;
    }
    .right {
      text-align: right;
      white-space: nowrap;
    }
    .status {
      display: inline-block;
      border: 1px solid #111827;
      padding: 2px 6px;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: .1em;
    }
    .status-paid { background: #dcfce7; }
    .status-pending { background: #fef9c3; }
    .status-overdue { background: #fee2e2; }
    .empty {
      text-align: center;
      color: #6b7280;
      font-weight: 800;
      padding: 18px;
    }
    .note {
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1.5px solid #111827;
      color: #4b5563;
      font-size: 11px;
      font-weight: 700;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page-break { break-before: page; }
    }
  </style>
</head>
<body>
  <main class="ledger">
    <section class="header">
      <div>
        <div class="brand">Karigar</div>
        <p class="eyebrow">Admin finance report</p>
        <p>Professional ledger generated from invoice, payout, and work-order records.</p>
      </div>
      <div>
        <h1>Financial Ledger</h1>
        <p class="generated">Generated: ${escapeHtml(generatedAt)}</p>
      </div>
    </section>

    <section class="summary">
      <div class="metric"><span>Paid Revenue</span><strong>${escapeHtml(formatReportCurrency(kpis.gross))}</strong></div>
      <div class="metric"><span>Recorded Payouts</span><strong>${escapeHtml(formatReportCurrency(kpis.expenses))}</strong></div>
      <div class="metric"><span>Net Position</span><strong>${escapeHtml(formatReportCurrency(kpis.net))}</strong></div>
      <div class="metric"><span>Margin</span><strong>${kpis.margin.toFixed(1)}%</strong></div>
    </section>

    <section class="section-grid">
      <div>
        <h2>Revenue By Week</h2>
        <table>
          <thead><tr><th>Period</th><th class="right">Current</th><th class="right">Previous</th></tr></thead>
          <tbody>${renderRevenueRows(revenueData)}</tbody>
        </table>
      </div>
      <div>
        <h2>Service Distribution</h2>
        <table>
          <thead><tr><th>Service</th><th class="right">Jobs</th><th class="right">Share</th></tr></thead>
          <tbody>${renderServiceRows(serviceSplit)}</tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Invoice Ledger</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Plate</th>
            <th>Service</th>
            <th>Status</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>${renderRows(ledgerRows)}</tbody>
      </table>
    </section>

    <p class="note">
      Pending balance: ${escapeHtml(formatReportCurrency(kpis.pendingAmount))}.
      Overdue balance: ${escapeHtml(formatReportCurrency(kpis.overdueAmount))}.
      This document is generated from original application data available at print time.
    </p>
  </main>
</body>
</html>`;

export const printReportLedger = (data: ReportPrintData) => {
  const printWindow = window.open('', '_blank', 'width=1000,height=1200');

  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildReportLedgerHtml(data));
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => {
    printWindow.print();
  }, 250);
};

export const downloadLedgerCsv = (rows: LedgerRow[]) => {
  const header = ['invoice_id', 'date', 'customer', 'plate', 'service', 'status', 'amount'];
  const csvRows = rows.map((row) => [
    row.id,
    row.date,
    row.customer,
    row.plate,
    row.service,
    row.status,
    row.amount.toFixed(2),
  ]);
  const csv = [header, ...csvRows]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'karigar-financial-ledger.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
