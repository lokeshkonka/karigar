export type Related<T> = T | T[] | null | undefined;

export interface InvoiceDocumentRow {
  id: string;
  amount: number | string | null;
  status?: string | null;
  created_at?: string | null;
  due_date?: string | null;
  customers?: Related<{
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  }>;
  work_orders?: Related<{
    id?: string | null;
    plate?: string | null;
    customer_name?: string | null;
    type?: string | null;
    assigned_mechanic_id?: string | null;
    issue_description?: string | null;
    notes?: string | null;
    customers?: Related<{
      name?: string | null;
      phone?: string | null;
      email?: string | null;
    }>;
    vehicles?: Related<{
      plate?: string | null;
      make?: string | null;
      model?: string | null;
      year?: number | string | null;
      fuel?: string | null;
    }>;
  }>;
}

export interface InvoiceViewModel {
  id: string;
  shortId: string;
  amount: number;
  status: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  plate: string;
  vehicle: string;
  serviceType: string;
  notes: string;
  subtotal: number;
  gst: number;
  total: number;
}

const getOne = <T>(value: Related<T>): T | undefined => {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);

export const formatInvoiceDate = (value?: string | null) => {
  if (!value) return 'Upon receipt';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Upon receipt';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const getInvoiceViewModel = (invoice: InvoiceDocumentRow): InvoiceViewModel => {
  const workOrder = getOne(invoice.work_orders);
  const directCustomer = getOne(invoice.customers);
  const workOrderCustomer = getOne(workOrder?.customers);
  const vehicle = getOne(workOrder?.vehicles);
  const total = Number(invoice.amount) || 0;
  const subtotal = total / 1.18;
  const gst = total - subtotal;
  const vehicleParts = [vehicle?.year, vehicle?.make, vehicle?.model, vehicle?.fuel].filter(Boolean);

  return {
    id: invoice.id,
    shortId: invoice.id ? invoice.id.slice(0, 8).toUpperCase() : 'INVOICE',
    amount: total,
    status: (invoice.status || 'pending').toLowerCase(),
    date: formatInvoiceDate(invoice.created_at),
    dueDate: invoice.due_date ? formatInvoiceDate(invoice.due_date) : 'Upon receipt',
    customerName:
      directCustomer?.name ||
      workOrderCustomer?.name ||
      workOrder?.customer_name ||
      'Walk-in Customer',
    customerPhone: directCustomer?.phone || workOrderCustomer?.phone || 'Not available',
    customerEmail: directCustomer?.email || workOrderCustomer?.email || 'Not available',
    plate: workOrder?.plate || vehicle?.plate || 'Not available',
    vehicle: vehicleParts.length ? vehicleParts.join(' ') : 'Vehicle details not available',
    serviceType: workOrder?.type || 'Automotive service',
    notes: workOrder?.issue_description || workOrder?.notes || '',
    subtotal,
    gst,
    total,
  };
};

const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const buildInvoiceHtml = (invoice: InvoiceDocumentRow) => {
  const vm = getInvoiceViewModel(invoice);
  const statusLabel = vm.status.toUpperCase();
  const notesRow = vm.notes
    ? `<p><strong>Service notes:</strong> ${escapeHtml(vm.notes)}</p>`
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(vm.shortId)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      line-height: 1.45;
    }
    .invoice {
      width: 100%;
      min-height: 267mm;
      padding: 0;
    }
    .top {
      display: flex;
      justify-content: space-between;
      gap: 32px;
      border-bottom: 3px solid #111827;
      padding-bottom: 22px;
      margin-bottom: 26px;
    }
    .brand {
      font-size: 34px;
      font-weight: 900;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .subtle {
      color: #4b5563;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-size: 10px;
    }
    .title {
      text-align: right;
    }
    .title h1 {
      margin: 0 0 12px;
      font-size: 30px;
      letter-spacing: .08em;
    }
    .status {
      display: inline-block;
      border: 2px solid #111827;
      padding: 6px 10px;
      font-weight: 900;
      letter-spacing: .12em;
      color: #111827;
      background: ${vm.status === 'paid' ? '#d9f99d' : vm.status === 'overdue' ? '#fecaca' : '#fef08a'};
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }
    .box {
      border: 1.5px solid #111827;
      padding: 12px;
      min-height: 86px;
    }
    .box h2 {
      margin: 0 0 8px;
      font-size: 11px;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: #374151;
    }
    .box p {
      margin: 3px 0;
      overflow-wrap: anywhere;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background: #111827;
      color: #ffffff;
      padding: 11px;
      text-align: left;
      font-size: 11px;
      letter-spacing: .12em;
      text-transform: uppercase;
    }
    td {
      border: 1px solid #111827;
      padding: 12px;
      vertical-align: top;
    }
    .right { text-align: right; }
    .center { text-align: center; }
    .totals {
      width: 340px;
      margin-left: auto;
      margin-top: 24px;
      border: 2px solid #111827;
    }
    .totals div {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 14px;
      border-bottom: 1px solid #d1d5db;
      font-weight: 700;
    }
    .totals .grand {
      border-bottom: 0;
      background: #fef08a;
      color: #111827;
      font-size: 20px;
      font-weight: 900;
    }
    .terms {
      margin-top: 28px;
      border-top: 1.5px solid #111827;
      padding-top: 14px;
      color: #374151;
    }
    .footer {
      margin-top: 42px;
      text-align: center;
      font-size: 11px;
      color: #4b5563;
      border-top: 1px solid #d1d5db;
      padding-top: 14px;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <main class="invoice">
    <section class="top">
      <div>
        <div class="brand">Karigar</div>
        <p class="subtle">Automotive service billing</p>
        <p>Original invoice data from service record</p>
      </div>
      <div class="title">
        <h1>TAX INVOICE</h1>
        <span class="status">${escapeHtml(statusLabel)}</span>
      </div>
    </section>

    <section class="meta">
      <div class="box">
        <h2>Invoice</h2>
        <p><strong>Bill No:</strong> ${escapeHtml(vm.shortId)}</p>
        <p><strong>Record ID:</strong> ${escapeHtml(vm.id)}</p>
        <p><strong>Date:</strong> ${escapeHtml(vm.date)}</p>
        <p><strong>Due:</strong> ${escapeHtml(vm.dueDate)}</p>
      </div>
      <div class="box">
        <h2>Bill To</h2>
        <p><strong>${escapeHtml(vm.customerName)}</strong></p>
        <p>Phone: ${escapeHtml(vm.customerPhone)}</p>
        <p>Email: ${escapeHtml(vm.customerEmail)}</p>
      </div>
      <div class="box">
        <h2>Vehicle</h2>
        <p><strong>Plate:</strong> ${escapeHtml(vm.plate)}</p>
        <p>${escapeHtml(vm.vehicle)}</p>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th class="center">#</th>
          <th>Description</th>
          <th class="center">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="center">1</td>
          <td>
            <strong>${escapeHtml(vm.serviceType)}</strong>
            ${notesRow}
          </td>
          <td class="center">1</td>
          <td class="right">${escapeHtml(formatCurrency(vm.subtotal))}</td>
          <td class="right">${escapeHtml(formatCurrency(vm.subtotal))}</td>
        </tr>
      </tbody>
    </table>

    <section class="totals">
      <div><span>Subtotal</span><span>${escapeHtml(formatCurrency(vm.subtotal))}</span></div>
      <div><span>GST 18%</span><span>${escapeHtml(formatCurrency(vm.gst))}</span></div>
      <div class="grand"><span>Total</span><span>${escapeHtml(formatCurrency(vm.total))}</span></div>
    </section>

    <section class="terms">
      <p><strong>Payment status:</strong> ${escapeHtml(statusLabel)}</p>
      <p>This bill reflects the original invoice amount, linked customer, vehicle, and work order data stored in Karigar.</p>
    </section>

    <footer class="footer">Thank you for choosing Karigar.</footer>
  </main>
</body>
</html>`;
};

export const printInvoice = (invoice: InvoiceDocumentRow) => {
  const html = buildInvoiceHtml(invoice);
  const printWindow = window.open('', '_blank', 'width=900,height=1200');

  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => {
    printWindow.print();
  }, 250);
};

export const downloadInvoiceHtml = (invoice: InvoiceDocumentRow) => {
  const vm = getInvoiceViewModel(invoice);
  const blob = new Blob([buildInvoiceHtml(invoice)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `invoice-${vm.shortId}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
