/**
 * Inside The Sphere — Tax Expense Tracker: Google Sheets bridge
 *
 * Receives expenses from tax-expenses/index.html and writes each one into the
 * yearly tax workbook (the TAXES_BLANK real-estate template, converted to a
 * Google Sheet): right tab, right column, under the right month heading, in
 * date order, with the template's GST and Total formulas.
 *
 * Nothing personal lives in this file. Everything account-specific is kept in
 * Project Settings → Script properties:
 *
 *   PASSCODE            required. The page sends it with every request.
 *   SHEET_2026          required, one per tax year: the Google Sheet's ID
 *                       (the long string between /d/ and /edit in its URL).
 *   ANTHROPIC_API_KEY   optional. Turns on receipt-photo reading.
 *   CLAUDE_MODEL        optional. Defaults to claude-sonnet-5-5.
 *   SEED_SHEET_ID       optional. A past year's completed sheet, read once by
 *                       importRulesFromSheet() to learn vendor → column.
 *
 * Deploy: Deploy → New deployment → Web app, Execute as: Me,
 * Who has access: Anyone. The passcode is what keeps strangers out.
 */

var META_KEY = 'taxTrackerId';
var MONTHS = ['January','February','March','April','May','June','July',
              'August','September','October','November','December'];

/* Layout of each tab in the template. Column letters are the template's own. */
var SPECS = {
  'Basic Books': {
    months: true, inclusive: false, first: 'C', last: 'R',
    taxable: 'CDEFHIJKLMNOP', gstCol: 'S', totalCol: 'T',
    formulas: { S: '=(SUM(C{r}:E{r})+F{r}+SUM(H{r}:P{r}))*0.05', T: '=SUM(C{r}:S{r})' }
  },
  'Home Office Expenses': {
    months: false, inclusive: false, first: 'C', last: 'I',
    taxable: 'CDF', gstCol: 'J', totalCol: 'K',
    formulas: { J: '=(SUM(C{r}:D{r})+F{r})*0.05', K: '=SUM(C{r}:J{r})' }
  },
  'Vehicle Gas': {
    months: true, inclusive: true, first: 'C', last: 'C',
    taxable: 'C', gstCol: 'D', totalCol: 'C',
    formulas: { D: '=C{r}*5/105', E: '=C{r}-D{r}' }
  },
  'Other Vehicle Expenses': {
    months: true, inclusive: false, first: 'C', last: 'I',
    taxable: 'DEFHI', gstCol: 'J', totalCol: 'K',
    formulas: { J: '=(SUM(D{r}:I{r})-G{r})*0.05', K: '=SUM(C{r}:J{r})' }
  },
  'Capital Purchases': {
    months: false, inclusive: false, first: 'C', last: 'C',
    taxable: 'C', gstCol: 'D', totalCol: 'E',
    formulas: { D: '=SUM(C{r})*0.05', E: '=SUM(C{r}:D{r})' }
  }
};

/* ── Web app entry points ─────────────────────────────────────────────── */

function doGet() {
  return out({ ok: true, message: 'Tax expense tracker is running. Use the Inside The Sphere page to send expenses.' });
}

function doPost(e) {
  var req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return out({ ok: false, error: 'The request could not be read.' });
  }
  try {
    var props = PropertiesService.getScriptProperties();
    var pass = props.getProperty('PASSCODE');
    if (!pass) throw new Error('PASSCODE is not set. In Apps Script open Project Settings → Script properties and add it.');
    if (String(req.passcode || '') !== pass) return out({ ok: false, code: 'bad_passcode', error: 'Wrong passcode.' });

    switch (req.action) {
      case 'ping':   return out(ping());
      case 'list':   return out(listYear(Number(req.year)));
      case 'add':    return out(withLock(function () { return addEntry(req.entry, req.mode); }));
      case 'update': return out(withLock(function () { return updateEntry(req.id, req.entry, req.mode); }));
      case 'delete': return out(withLock(function () { return deleteEntry(req.id, Number(req.year)); }));
      case 'read':   return out(readReceipt(req));
      default:       return out({ ok: false, error: 'Unknown action: ' + req.action });
    }
  } catch (err) {
    console.error(err && err.stack || err);
    return out({ ok: false, error: String(err && err.message || err) });
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function withLock(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('The sheet is busy with another save. Try again in a few seconds.');
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ── Actions ──────────────────────────────────────────────────────────── */

function ping() {
  var props = PropertiesService.getScriptProperties().getProperties();
  var years = [];
  Object.keys(props).forEach(function (k) {
    var m = k.match(/^SHEET_(\d{4})$/);
    if (m) {
      var url = '';
      try { url = SpreadsheetApp.openById(props[k]).getUrl(); }
      catch (err) { url = ''; }
      years.push({ year: Number(m[1]), url: url, ok: !!url });
    }
  });
  years.sort(function (a, b) { return b.year - a.year; });
  return { ok: true, ai: !!props.ANTHROPIC_API_KEY, years: years, rules: loadRules() };
}

function listYear(year) {
  var ss = book(year);
  var tz = ss.getSpreadsheetTimeZone();
  var ids = idMap(ss);
  var entries = [];
  Object.keys(SPECS).forEach(function (name) {
    var sp = SPECS[name], sh = sheetOf(ss, name);
    var T = totalsRow(sh), n = T - 2;
    if (n < 1) return;
    var lastCol = colNum(sp.totalCol) > colNum(sp.gstCol) ? colNum(sp.totalCol) : colNum(sp.gstCol);
    var vals = sh.getRange(2, 1, n, lastCol).getValues();
    vals.forEach(function (row, i) {
      if (!(row[0] instanceof Date)) return;
      var col = null, amount = 0;
      for (var c = colNum(sp.first); c <= colNum(sp.last); c++) {
        var v = row[c - 1];
        if (typeof v === 'number' && v !== 0) { col = colLetter(c); amount = v; break; }
      }
      if (!col) return;
      var gst = Number(row[colNum(sp.gstCol) - 1]) || 0;
      var total = sp.inclusive ? amount : (Number(row[colNum(sp.totalCol) - 1]) || amount + gst);
      var r = i + 2;
      entries.push({
        id: ids[name + '#' + r] || null,
        sheet: name, col: col, row: r,
        date: Utilities.formatDate(row[0], tz, 'yyyy-MM-dd'),
        vendor: String(row[1] || ''),
        amount: round2(amount), gst: round2(gst), total: round2(total)
      });
    });
  });
  return { ok: true, year: year, url: ss.getUrl(), entries: entries };
}

function addEntry(entry, mode) {
  var e = cleanEntry(entry);
  var ss = book(Number(e.date.slice(0, 4)));
  var sh = sheetOf(ss, e.sheet);
  var sp = SPECS[e.sheet];
  var r = placeEntry(ss, sh, sp, e, mode || 'pretax');
  var id = 'exp-' + Utilities.getUuid().slice(0, 12);
  sh.getRange(r + ':' + r).addDeveloperMetadata(META_KEY, id);
  learnRule(e.vendorOnly, e.sheet, e.col);
  return { ok: true, id: id, sheet: e.sheet, row: r, url: ss.getUrl() };
}

function updateEntry(id, entry, mode) {
  var e = cleanEntry(entry);
  var found = findById(id);
  if (!found) throw new Error('That expense is no longer in the sheet. It may have been deleted there. Reload the list.');
  removeRow(found.sheet, found.row);
  return addEntry(entry, mode);
}

function deleteEntry(id) {
  var found = findById(id);
  if (!found) throw new Error('That expense is no longer in the sheet. Reload the list.');
  removeRow(found.sheet, found.row);
  return { ok: true };
}

/* ── Placing a row ────────────────────────────────────────────────────── */

function placeEntry(ss, sh, sp, e, mode) {
  var tz = ss.getSpreadsheetTimeZone();
  var month = Number(e.date.slice(5, 7)) - 1;
  var rows = classify(sh, sp);
  var pos;

  if (sp.months) {
    var h = findHeader(rows, month);
    if (h < 0) {
      // New month heading goes before the first row that belongs to a later month.
      var hp = firstRowAfterMonth(rows, month);
      writeHeader(sh, sp, hp, month);
      rows = classify(sh, sp);
      h = findHeader(rows, month);
    }
    pos = rows[h].r + 1;
    for (var i = h + 1; i < rows.length; i++) {
      if (rows[i].kind !== 'entry' || rows[i].date > e.date) break;
      pos = rows[i].r + 1;
    }
  } else {
    pos = null;
    for (var j = 0; j < rows.length; j++) {
      if (rows[j].kind === 'entry' && rows[j].date > e.date) { pos = rows[j].r; break; }
      if (rows[j].kind === 'blank') { pos = rows[j].r; break; }
    }
    if (pos === null) pos = totalsRow(sh);
  }

  var r = useOrInsert(sh, sp, pos);
  var dateCell = sh.getRange(r, 1);
  dateCell.setValue(Utilities.parseDate(e.date + ' 00:00', tz, 'yyyy-MM-dd HH:mm'));
  dateCell.setNumberFormat('mm/dd/yy');
  sh.getRange(r, 2).setValue(e.detail ? e.vendorOnly + ' - ' + e.detail : e.vendorOnly);
  var a = amountFor(sp, e, mode);
  sh.getRange(r, colNum(e.col)).setValue(a.amount);
  writeFormulas(sh, sp, r);
  if (a.gstOverride !== null) sh.getRange(r, colNum(sp.gstCol)).setValue(a.gstOverride);
  fixTotals(sh, sp);
  return r;
}

/* Use row pos if it is an empty template row; otherwise open a new row there. */
function useOrInsert(sh, sp, pos) {
  var T = totalsRow(sh);
  if (pos < T && isBlankRow(sh, sp, pos)) return pos;
  sh.insertRowBefore(pos);
  T = totalsRow(sh);
  // Keep the sheet the same length: drop one spare empty row from the bottom.
  if (T - 1 > pos + 1 && isBlankRow(sh, sp, T - 1)) sh.deleteRow(T - 1);
  sh.getRange(pos, 3, 1, colNum(sp.totalCol) - 2).setNumberFormat('"$"#,##0.00');
  return pos;
}

function writeHeader(sh, sp, pos, month) {
  var r = useOrInsert(sh, sp, pos);
  sh.getRange(r, 1).setValue(MONTHS[month]);
  writeFormulas(sh, sp, r);
  fixTotals(sh, sp);
}

function writeFormulas(sh, sp, r) {
  Object.keys(sp.formulas).forEach(function (L) {
    sh.getRange(r, colNum(L)).setFormula(sp.formulas[L].replace(/\{r\}/g, r));
  });
}

/* Every SUM in the Totals row covers row 2 through the row above Totals. */
function fixTotals(sh, sp) {
  var T = totalsRow(sh), last = T - 1;
  var lastCol = sh.getLastColumn();
  var range = sh.getRange(T, 1, 1, lastCol);
  var f = range.getFormulas()[0];
  for (var c = 0; c < f.length; c++) {
    if (!f[c]) continue;
    var nf = f[c].replace(/\b([A-Z]{1,2})(\d+):([A-Z]{1,2})(\d+)\b/g, function (m, L1, n1, L2, n2) {
      if (Number(n1) === Number(n2)) return L1 + T + ':' + L2 + T;   // horizontal sum on the Totals row
      return L1 + '2:' + L2 + last;
    });
    if (nf !== f[c]) sh.getRange(T, c + 1).setFormula(nf);
  }
}

function removeRow(sh, r) {
  sh.deleteRow(r);
  var sp = SPECS[sh.getName()];
  if (sp) fixTotals(sh, sp);
}

/* ── Reading the sheet ────────────────────────────────────────────────── */

function classify(sh, sp) {
  var T = totalsRow(sh), n = T - 2, rows = [];
  if (n < 1) return rows;
  var tz = sh.getParent().getSpreadsheetTimeZone();
  var vals = sh.getRange(2, 1, n, colNum(sp.last)).getValues();
  vals.forEach(function (row, i) {
    var r = i + 2, a = row[0];
    if (a instanceof Date) {
      rows.push({ r: r, kind: 'entry', date: Utilities.formatDate(a, tz, 'yyyy-MM-dd') });
    } else if (typeof a === 'string' && monthIndex(a) >= 0) {
      rows.push({ r: r, kind: 'header', month: monthIndex(a) });
    } else if (isBlankValues(row, sp)) {
      rows.push({ r: r, kind: 'blank' });
    } else {
      rows.push({ r: r, kind: 'other' });
    }
  });
  return rows;
}

function isBlankValues(row, sp) {
  if (row[0] !== '' || row[1] !== '') return false;
  for (var c = colNum(sp.first); c <= colNum(sp.last); c++) if (row[c - 1] !== '' && row[c - 1] !== 0) return false;
  return true;
}
function isBlankRow(sh, sp, r) {
  return isBlankValues(sh.getRange(r, 1, 1, colNum(sp.last)).getValues()[0], sp);
}

function monthIndex(s) {
  var t = String(s).trim().toLowerCase().slice(0, 3);
  if (!t) return -1;
  for (var i = 0; i < 12; i++) if (MONTHS[i].toLowerCase().slice(0, 3) === t) return i;
  return -1;
}

function findHeader(rows, month) {
  for (var i = 0; i < rows.length; i++) if (rows[i].kind === 'header' && rows[i].month === month) return i;
  return -1;
}

function firstRowAfterMonth(rows, month) {
  for (var i = 0; i < rows.length; i++) {
    var x = rows[i];
    if (x.kind === 'header' && x.month > month) return x.r;
    if (x.kind === 'entry' && Number(x.date.slice(5, 7)) - 1 > month) return x.r;
    if (x.kind === 'blank') {
      // First blank row after all content: put the heading here.
      var rest = rows.slice(i).every(function (y) { return y.kind === 'blank'; });
      if (rest) return x.r;
    }
  }
  return rows.length ? rows[rows.length - 1].r + 1 : 2;
}

function totalsRow(sh) {
  var last = sh.getLastRow();
  var vals = sh.getRange(1, 1, last, 2).getValues();
  for (var i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === 'Totals' || String(vals[i][1]).trim() === 'Totals') return i + 1;
  }
  throw new Error('No "Totals" row found on the ' + sh.getName() + ' tab. Is this the TAXES_BLANK template?');
}

function idMap(ss) {
  var map = {};
  ss.createDeveloperMetadataFinder().withKey(META_KEY).find().forEach(function (md) {
    var loc = md.getLocation();
    if (loc.getLocationType() !== SpreadsheetApp.DeveloperMetadataLocationType.ROW) return;
    var rg = loc.getRow();
    map[rg.getSheet().getName() + '#' + rg.getRow()] = md.getValue();
  });
  return map;
}

function findById(id) {
  if (!id) return null;
  var props = PropertiesService.getScriptProperties().getProperties();
  var keys = Object.keys(props).filter(function (k) { return /^SHEET_\d{4}$/.test(k); });
  for (var i = 0; i < keys.length; i++) {
    var ss;
    try { ss = SpreadsheetApp.openById(props[keys[i]]); } catch (err) { continue; }
    var hits = ss.createDeveloperMetadataFinder().withKey(META_KEY).withValue(String(id)).find();
    if (hits.length) {
      var rg = hits[0].getLocation().getRow();
      return { sheet: rg.getSheet(), row: rg.getRow() };
    }
  }
  return null;
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function book(year) {
  if (!year) throw new Error('No tax year given.');
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_' + year);
  if (!id) throw new Error('No sheet is set up for ' + year + '. Add SHEET_' + year + ' in Script properties with that year\'s Google Sheet ID.');
  try { return SpreadsheetApp.openById(id); }
  catch (err) { throw new Error('Could not open the ' + year + ' sheet. Check that SHEET_' + year + ' holds the right ID.'); }
}

function sheetOf(ss, name) {
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('The workbook has no tab named "' + name + '". Keep the template\'s tab names.');
  return sh;
}

function cleanEntry(e) {
  if (!e) throw new Error('No expense was sent.');
  var sp = SPECS[e.sheet];
  if (!sp) throw new Error('Unknown tab: ' + e.sheet);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(e.date))) throw new Error('The date must look like 2026-03-14.');
  var c = colNum(String(e.col || ''));
  if (!c || c < colNum(sp.first) || c > colNum(sp.last)) throw new Error('Column ' + e.col + ' is not an expense column on ' + e.sheet + '.');
  var total = Number(e.total), gst = Number(e.gst || 0);
  if (!(total > 0)) throw new Error('The total must be more than zero.');
  if (!(gst >= 0) || gst >= total) throw new Error('GST must be zero or more, and less than the total.');
  var vendor = String(e.vendor || '').trim().slice(0, 80);
  if (!vendor) throw new Error('Add who you paid.');
  return { date: e.date, sheet: e.sheet, col: String(e.col), total: round2(total), gst: round2(gst),
           vendorOnly: vendor, detail: String(e.detail || '').trim().slice(0, 80) };
}

/* What goes in the amount cell, and whether the GST cell needs the receipt's real figure. */
function amountFor(sp, e, mode) {
  var total = e.total, gst = e.gst;
  if (sp.inclusive || mode === 'asis') return { amount: total, gstOverride: null };
  var sub = round2(total - gst);
  if (sp.taxable.indexOf(e.col) >= 0) {
    return { amount: sub, gstOverride: Math.abs(round2(sub * 0.05) - gst) > 0.05 ? gst : null };
  }
  return gst > 0 ? { amount: sub, gstOverride: gst } : { amount: total, gstOverride: null };
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
function colNum(L) { var n = 0; for (var i = 0; i < L.length; i++) n = n * 26 + (L.charCodeAt(i) - 64); return n; }
function colLetter(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

/* ── Vendor rules: vendor → tab and column ────────────────────────────── */

function loadRules() {
  var all = PropertiesService.getScriptProperties().getProperties(), rules = {};
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('rule:') !== 0) return;
    try { rules[k.slice(5)] = JSON.parse(all[k]); } catch (err) {}
  });
  return rules;
}

function learnRule(vendor, sheet, col) {
  var k = norm(vendor);
  if (!k) return;
  PropertiesService.getScriptProperties().setProperty('rule:' + k.slice(0, 80), JSON.stringify({ name: vendor, sheet: sheet, col: col }));
}

/**
 * Run once from the editor (select it in the toolbar, click Run) after setting
 * SEED_SHEET_ID to a completed past-year sheet. Learns which column each vendor
 * went in, so new receipts from the same vendors are sorted automatically.
 */
function importRulesFromSheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SEED_SHEET_ID');
  if (!id) throw new Error('Set SEED_SHEET_ID in Script properties first.');
  var ss = SpreadsheetApp.openById(id), counts = {};
  Object.keys(SPECS).forEach(function (name) {
    var sp = SPECS[name], sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 2) return;
    var vals = sh.getRange(2, 1, sh.getLastRow() - 1, colNum(sp.last)).getValues();
    vals.forEach(function (row) {
      if (!(row[0] instanceof Date) || !row[1]) return;
      for (var c = colNum(sp.first); c <= colNum(sp.last); c++) {
        if (typeof row[c - 1] === 'number' && row[c - 1] !== 0) {
          var k = norm(row[1]), key = name + '|' + colLetter(c);
          counts[k] = counts[k] || { name: String(row[1]).trim(), n: {} };
          counts[k].n[key] = (counts[k].n[key] || 0) + 1;
          break;
        }
      }
    });
  });
  var props = PropertiesService.getScriptProperties(), made = 0;
  Object.keys(counts).forEach(function (k) {
    var best = Object.keys(counts[k].n).sort(function (a, b) { return counts[k].n[b] - counts[k].n[a]; })[0];
    var p = best.split('|');
    props.setProperty('rule:' + k.slice(0, 80), JSON.stringify({ name: counts[k].name, sheet: p[0], col: p[1] }));
    made++;
  });
  console.log('Learned ' + made + ' vendors from ' + ss.getName());
}

/* ── Optional: read a receipt photo with Claude ───────────────────────── */

var CATEGORY_CODES = [
  'Basic Books|C = Advertising & Client Gifts', 'Basic Books|D = Business Tax, Fees, Dues',
  'Basic Books|E = Delivery, Freight', 'Basic Books|F = Insurance', 'Basic Books|G = Interest & Bank Charges',
  'Basic Books|H = Management or Admin Fees', 'Basic Books|I = Meals & Entertainment',
  'Basic Books|J = Office Expenses', 'Basic Books|K = Supplies',
  'Basic Books|L = Legal, Accounting & Professional Fees', 'Basic Books|M = Rent',
  'Basic Books|N = Salaries, Wages, Benefits', 'Basic Books|O = Travel', 'Basic Books|P = Cell Phone',
  'Basic Books|Q = Group Medical Premiums', 'Basic Books|R = Other',
  'Vehicle Gas|C = Fuel & Oil',
  'Other Vehicle Expenses|C = Insurance', 'Other Vehicle Expenses|D = License & Registration',
  'Other Vehicle Expenses|E = Maintenance & Repairs', 'Other Vehicle Expenses|F = Lease Cost',
  'Other Vehicle Expenses|G = Interest on Loan', 'Other Vehicle Expenses|H = Parking',
  'Other Vehicle Expenses|I = Other',
  'Home Office Expenses|C = Heat', 'Home Office Expenses|D = Electric', 'Home Office Expenses|E = Insurance',
  'Home Office Expenses|F = Maintenance', 'Home Office Expenses|G = Mortgage Interest',
  'Home Office Expenses|H = Property Taxes', 'Home Office Expenses|I = Other',
  'Capital Purchases|C = Capital purchase over $1,000'
];

function readReceipt(req) {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('ANTHROPIC_API_KEY');
  if (!key) return { ok: false, code: 'ai_off', error: 'Photo reading is off. Add ANTHROPIC_API_KEY in Script properties to turn it on.' };
  var media = String(req.mediaType || 'image/jpeg');
  if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].indexOf(media) < 0) throw new Error('Unsupported image type: ' + media);
  if (!req.image) throw new Error('No image was sent.');

  var rules = loadRules();
  var past = Object.keys(rules).slice(0, 150).map(function (k) { return rules[k].name + ' -> ' + rules[k].sheet + '|' + rules[k].col; });
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var prompt = [
    'This is a photo or screenshot of a receipt or invoice for the business expense records of a real estate agent in Alberta, Canada.',
    'Alberta charges 5% GST and no PST. Today is ' + today + '.',
    '',
    'Reply with only a JSON object, no other text, in exactly this shape:',
    '{"vendor": "Staples", "date": "2026-03-14", "total": 21.36, "gst": 1.02, "detail": "printer paper", "category": "Basic Books|J", "readable": true, "note": ""}',
    '',
    'Rules:',
    '- vendor: the business name as people say it, not the legal name or address.',
    '- date: the transaction date as YYYY-MM-DD, or null if none is visible. If the year is missing, use ' + (req.year || today.slice(0, 4)) + '.',
    '- total: the final amount paid, including tax and tip, as a number.',
    '- gst: the GST or HST amount printed on the receipt. Use 0 if none is shown. Do not calculate it.',
    '- detail: up to 6 words on what was bought.',
    '- category: exactly one code from the list below. Vehicle fuel is Vehicle Gas|C; car washes, tires and repairs are Other Vehicle Expenses|E. If the vendor is in the past-vendors list, use the same code unless the receipt clearly shows something different.',
    '- readable: false if this is not a receipt or the total cannot be read.',
    '- note: one short sentence if something is unclear, otherwise "".',
    '',
    'Category codes:', CATEGORY_CODES.join('\n'), '',
    'Past vendors:', past.join('\n') || '(none yet)'
  ].join('\n');

  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify({
      model: props.getProperty('CLAUDE_MODEL') || 'claude-sonnet-5-5',
      max_tokens: 600,
      messages: [{ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: media, data: req.image } },
        { type: 'text', text: prompt }
      ] }]
    })
  });
  var code = res.getResponseCode(), body = res.getContentText();
  if (code !== 200) {
    var msg = body;
    try { msg = JSON.parse(body).error.message; } catch (err) {}
    throw new Error('Claude could not read the receipt (' + code + '): ' + msg);
  }
  var text = (JSON.parse(body).content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
  var a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('The receipt could not be read clearly. Try another photo or type it in.');
  return { ok: true, reading: JSON.parse(text.slice(a, b + 1)) };
}
