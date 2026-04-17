/**
 * THE CUSTOMIZED – Google Apps Script
 * ─────────────────────────────────────────────────────────────
 * SETUP INSTRUCTIONS:
 *  1. Go to https://script.google.com → New Project → paste this code.
 *  2. Replace SPREADSHEET_ID below with your Google Sheet ID
 *     (found in the sheet URL: …/d/SPREADSHEET_ID/edit).
 *  3. Click Deploy → New Deployment → Web App.
 *     - Execute as: Me
 *     - Who has access: Anyone (or Anyone with Google account)
 *  4. Copy the Web App URL and paste it into the Sync Bar in admin.html.
 *  5. Every time you click "Sync Now" in the app, data is pushed here.
 * ─────────────────────────────────────────────────────────────
 */

const SPREADSHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // ← REPLACE THIS

/* Sheet tab names */
const SHEETS = {
  products: 'Products',
  orders:   'Orders',
  invoices: 'Invoices',
  log:      'Sync Log',
};

/* ─── Headers for each sheet ─── */
const HEADERS = {
  products: ['ID','Name','SKU','Category','Price ($)','Stock Qty','Stock Status','Icon','Customization Options','Description','Last Updated'],
  orders:   ['Order ID','Customer Name','Customer Email','Product','Product ID','Qty','Unit Price ($)','Total ($)','Status','Order Date','Customization Note','Shipping Address','Last Updated'],
  invoices: ['Invoice ID','Order ID','Customer Name','Customer Email','Subtotal ($)','Tax (%)','Grand Total ($)','Due Date','Status','Notes','Created Date','Last Updated'],
};

/* ════════════════════════════════════════════
   HTTP ENTRY POINTS
════════════════════════════════════════════ */

/**
 * Handles POST from admin.html (Sync Now button).
 * Expects JSON body: { products: [...], orders: [...], invoices: [...] }
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (data.products) writeSheet(ss, SHEETS.products, HEADERS.products, data.products, formatProduct);
    if (data.orders)   writeSheet(ss, SHEETS.orders,   HEADERS.orders,   data.orders,   formatOrder);
    if (data.invoices) writeSheet(ss, SHEETS.invoices, HEADERS.invoices, data.invoices, formatInvoice);

    writeLog(ss, 'POST sync', data.products?.length||0, data.orders?.length||0, data.invoices?.length||0);

    return jsonResponse({ success: true, message: 'Synced successfully.', timestamp: new Date().toISOString() });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

/**
 * Handles GET – returns all data from the sheet as JSON.
 * admin.html can call this on load to pull latest data back.
 * Usage: fetch(SCRIPT_URL + '?action=getAll')
 */
function doGet(e) {
  try {
    const action = e.parameter.action || '';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'getAll') {
      return jsonResponse({
        success:  true,
        products: readSheet(ss, SHEETS.products),
        orders:   readSheet(ss, SHEETS.orders),
        invoices: readSheet(ss, SHEETS.invoices),
      });
    }

    // Default: return status info
    return jsonResponse({ success: true, status: 'The Customized Admin Script is running.' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

/* ════════════════════════════════════════════
   SHEET WRITE / READ HELPERS
════════════════════════════════════════════ */

/**
 * Clears a sheet (keeping header row) and rewrites all rows.
 */
function writeSheet(ss, sheetName, headers, records, formatter) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.clearContents();

  // Write headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  styleHeaderRow(headerRange);

  if (!records || records.length === 0) return;

  // Write data rows
  const now = new Date().toLocaleString();
  const rows = records.map(r => formatter(r, now));
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  // Auto-resize columns
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

/**
 * Reads a sheet and returns array of objects keyed by header row.
 */
function readSheet(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

/* ════════════════════════════════════════════
   ROW FORMATTERS
════════════════════════════════════════════ */

function stockStatus(qty) {
  if (qty <= 0)  return 'Out of Stock';
  if (qty <= 10) return 'Low Stock';
  return 'In Stock';
}

function formatProduct(p, now) {
  return [
    p.id        || '',
    p.name      || '',
    p.sku       || '',
    p.category  || '',
    Number(p.price  || 0),
    Number(p.stock  || 0),
    stockStatus(Number(p.stock || 0)),
    p.icon      || '',
    p.custom    || '',
    p.desc      || '',
    now,
  ];
}

function formatOrder(o, now) {
  return [
    o.id         || '',
    o.customer   || '',
    o.email      || '',
    o.product    || '',
    o.productId  || '',
    Number(o.qty       || 0),
    Number(o.unitPrice || 0),
    Number(o.total     || 0),
    o.status     || '',
    o.date       || '',
    o.note       || '',
    o.address    || '',
    now,
  ];
}

function formatInvoice(inv, now) {
  return [
    inv.id          || '',
    inv.orderId     || '',
    inv.customer    || '',
    inv.email       || '',
    Number(inv.amount || 0),
    Number(inv.tax    || 0),
    Number(inv.grand  || 0),
    inv.dueDate     || '',
    inv.status      || '',
    inv.notes       || '',
    inv.createdDate || '',
    now,
  ];
}

/* ════════════════════════════════════════════
   SYNC LOG
════════════════════════════════════════════ */

function writeLog(ss, event, productCount, orderCount, invoiceCount) {
  let log = ss.getSheetByName(SHEETS.log);
  if (!log) {
    log = ss.insertSheet(SHEETS.log);
    log.getRange(1, 1, 1, 5).setValues([['Timestamp', 'Event', 'Products', 'Orders', 'Invoices']]);
    styleHeaderRow(log.getRange(1, 1, 1, 5));
  }
  log.appendRow([new Date().toLocaleString(), event, productCount, orderCount, invoiceCount]);
}

/* ════════════════════════════════════════════
   STYLING
════════════════════════════════════════════ */

function styleHeaderRow(range) {
  range
    .setBackground('#1a1a1a')
    .setFontColor('#c9a84c')
    .setFontWeight('bold')
    .setFontSize(10);
}

/* ════════════════════════════════════════════
   RESPONSE HELPER
════════════════════════════════════════════ */

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ════════════════════════════════════════════
   MANUAL TRIGGER (optional)
   Run this from Apps Script editor to create
   the sheet structure without a POST request.
════════════════════════════════════════════ */

function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const now = new Date().toLocaleString();

  writeSheet(ss, SHEETS.products, HEADERS.products, [], formatProduct);
  writeSheet(ss, SHEETS.orders,   HEADERS.orders,   [], formatOrder);
  writeSheet(ss, SHEETS.invoices, HEADERS.invoices, [], formatInvoice);
  writeLog(ss, 'Sheet setup', 0, 0, 0);

  SpreadsheetApp.getUi().alert('✅ Sheets created successfully!');
}
