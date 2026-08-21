/**
 * Inside The Sphere — CREB 360 workbook import
 *
 * Shared by the standalone /market-data/ page and the import modal in
 * cma/edit.html section 03. Both write to the same store, so the parser,
 * the display contract and the document builders live here once — the
 * 360 workbook format is exactly the kind of thing that gets a fix in
 * one copy and not the other.
 *
 * This file holds everything that knows about the DATA. Everything that
 * knows about a PAGE — rendering, drop zones, status lines — stays with
 * the page.
 *
 * Nothing here reads page-level state. uid, meta, sourceFile and the
 * parsed object are passed in. `db` and `firebase` are app globals from
 * firebase-config.js and are the only outside references.
 *
 * Requires SheetJS (xlsx) to be loaded before this file.
 *
 *   var MI = window.SphereMarketImport;
 *   var parsed = MI.parseWorkbook(arrayBuffer);
 *   await MI.writeCommunity(parsed, meta, uid, sourceFile);
 */

(function () {
'use strict';

/* ─────────────────────────────────────────────────────────────────────────
   CREB 360 Monthly — parser

   Sheet layout, verified against Cranston (Aug 2026 export):

     r1     community name in column A
     r2     header row  (col B === 'Sales')
     r3-r67 five year-blocks of 13 rows: 12 months + 1 annual rollup
     r68    community name again
     r69    header row again
     r70+   five more year-blocks

   The title and header rows repeat every 67 rows — once per FIVE-year block,
   not once per year. So block boundaries cannot be assumed at a fixed row
   number. Data rows are collected in document order, then walked in groups
   of 13; index 12 of each group is the annual rollup.

   The annual row carries the SAME date serial as that year's January row
   (2017 annual is dated 2017-01-01, identical to Jan-2017). Keying on date
   alone silently overwrites January with the annual figures. Position within
   the 13-row group is the only safe discriminator.

   Trailing months of the current year are present as rows but hold the
   shared string ' ' rather than a blank cell. Number(' ') === 0, so a naive
   numeric coercion writes a $0 benchmark price instead of failing. Every
   cell goes through numOrNull(), which rejects non-numeric cell types.
   ───────────────────────────────────────────────────────────────────────── */

var TYPE_SHEETS = ['Res', 'Det', 'Semi', 'Row', 'Apt'];

/* Column B..R, in order. `frac` marks values stored as fractions (0.043),
   never as percentage strings. */
var FIELDS = [
  { col: 'B', src: 'Sales',            name: 'sales',              kind: 'count' },
  { col: 'C', src: 'Y/Y%',             name: 'salesYoY',           kind: 'frac'  },
  { col: 'D', src: 'New Listings',     name: 'newListings',        kind: 'count' },
  { col: 'E', src: 'Y/Y%',             name: 'newListingsYoY',     kind: 'frac'  },
  { col: 'F', src: 'S/NL Ratio',       name: 'salesToNewListings', kind: 'frac'  },
  { col: 'G', src: 'Inventory',        name: 'inventory',          kind: 'count' },
  { col: 'H', src: 'Y/Y%',             name: 'inventoryYoY',       kind: 'frac'  },
  { col: 'I', src: 'Months of Supply', name: 'monthsOfSupply',     kind: 'num'   },
  { col: 'J', src: 'DOM',              name: 'dom',                kind: 'num'   },
  { col: 'K', src: 'SP/LP',            name: 'spToLp',             kind: 'frac'  },
  { col: 'L', src: 'Benchmark Price',  name: 'benchmarkPrice',     kind: 'cur'   },
  { col: 'M', src: 'Y/Y%',             name: 'benchmarkPriceYoY',  kind: 'frac'  },
  { col: 'N', src: 'Median Price',     name: 'medianPrice',        kind: 'cur'   },
  { col: 'O', src: 'Y/Y%',             name: 'medianPriceYoY',     kind: 'frac'  },
  { col: 'P', src: 'Average Price',    name: 'averagePrice',       kind: 'cur'   },
  { col: 'Q', src: 'Y/Y%',             name: 'averagePriceYoY',    kind: 'frac'  },
  { col: 'R', src: 'Index',            name: 'hpiIndex',           kind: 'num'   }
];

/* ── THIN DATA RULE ─────────────────────────────────────────────────────
   Set 21 Aug 2026.

   At or below THIN_MAX_SALES transactions in a month, the fields in
   SUPPRESS_WHEN_THIN are ABSENT from client-facing output — not caveated,
   not greyed out, not footnoted. Absent. A caveat still puts a number in
   front of a seller, and a number in front of a seller is a number they
   remember.

   ALWAYS_RENDER fields still render at any transaction count, with the
   sales count shown alongside so the basis is visible.

   Why the split: benchmarkPrice and hpiIndex come from CREB's HPI model,
   which is built on the whole community's price history rather than the
   month's sales, so they stay meaningful at low n. medianPrice,
   averagePrice, dom and spToLp are computed directly from that month's
   transactions — at n=2 a median IS one of two numbers.

   Live example in the Cranston export: semi-detached, Jul 2026 —
   benchmark $498,900 on 2 sales.

   Deliberately NOT stored as a flag on month records. `sales` is already
   stored, so the renderer applies this rule at display time and changing
   the threshold needs no re-import. Storing a derived `thin: true` would
   freeze 5 into every document.
   ─────────────────────────────────────────────────────────────────────── */
var THIN_MAX_SALES = 5;
var SUPPRESS_WHEN_THIN = ['medianPrice', 'averagePrice', 'dom', 'spToLp'];
var ALWAYS_RENDER      = ['benchmarkPrice', 'hpiIndex'];

function isThin(rec) {
  return !!rec && rec.sales !== null && rec.sales <= THIN_MAX_SALES;
}

/* ── REQUIRED COMPANIONS ────────────────────────────────────────────────
   Wherever benchmarkPrice renders client-facing, the sales count behind it
   renders in the same visual unit. Not a tooltip, not a footnote, not on
   hover — beside it, in the same breath.

   "Benchmark $498,900" invites a question no agent can answer standing in
   a kitchen. "$498,900, based on 2 sales this month" answers it before it
   is asked, and is still a useful number. At 96% thin months for Cranston
   semi-detached this is the normal case, not an edge case.

   This is a display contract, not a storage rule — both fields are already
   stored. It is written onto the community document so a renderer reads
   the contract from the data rather than importing a constants file that
   may not have been kept in step.
   ─────────────────────────────────────────────────────────────────────── */
var REQUIRED_COMPANIONS = { benchmarkPrice: ['sales'] };

function isCompanionField(name) {
  return Object.keys(REQUIRED_COMPANIONS).some(function (k) {
    return REQUIRED_COMPANIONS[k].indexOf(name) >= 0;
  });
}

function displayContract() {
  return {
    thinMaxSales:       THIN_MAX_SALES,
    suppressWhenThin:   SUPPRESS_WHEN_THIN.slice(),
    alwaysRender:       ALWAYS_RENDER.slice(),
    requiredCompanions: { benchmarkPrice: ['sales'] },
    percentagesAre:     'fraction',
    setOn:              '2026-08-21'
  };
}

/* HPI Summary attribute labels -> stored field names. */
var HPI_FIELDS = {
  'Gross Living Area (Above Ground)': 'grossLivingArea',
  'Lot Size':                         'lotSize',
  'Above Ground Bedrooms':            'bedsAboveGround',
  'Below Ground Bedrooms':            'bedsBelowGround',
  'Year Built':                       'yearBuilt',
  'Full Bathrooms':                   'bathsFull',
  'Half Bathrooms':                   'bathsHalf',
  'Finished Basement':                'basement',
  'Covered Parking Spaces':           'coveredParking'
};


/* ── cell helpers ──────────────────────────────────────────────────────── */

function cellAt(ws, col, row) {
  return ws[col + row] || null;
}

/* Numeric or null. Rejects every non-numeric cell type outright — the
   ' ' placeholders, '-' not-applicable markers and #REF! errors all
   become null rather than 0. */
function numOrNull(c) {
  if (!c) return null;
  if (c.t === 'n' && typeof c.v === 'number' && isFinite(c.v)) return c.v;
  return null;
}

function textOrNull(c) {
  if (!c) return null;
  if (c.t === 'e') return null;
  var v = (c.v === undefined || c.v === null) ? '' : String(c.v);
  v = v.trim();
  if (v === '' || v === '-') return null;
  return v;
}

function isErrorCell(c) { return !!c && c.t === 'e'; }

/* Excel serial -> 'YYYY-MM'. Epoch 1899-12-30 (correct for all dates
   after 1900-03-01, which covers everything in this workbook). */
function serialToMonth(serial) {
  var ms = Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000;
  var d = new Date(ms);
  var m = d.getUTCMonth() + 1;
  return d.getUTCFullYear() + '-' + (m < 10 ? '0' : '') + m;
}
function serialToParts(serial) {
  var ms = Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000;
  var d = new Date(ms);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

/* ── type sheet ────────────────────────────────────────────────────────── */

function parseTypeSheet(wb, sheetName) {
  var ws = wb.Sheets[sheetName];
  if (!ws) throw new Error('Sheet "' + sheetName + '" not found in workbook.');

  var range = XLSX.utils.decode_range(ws['!ref']);
  var community = textOrNull(cellAt(ws, 'A', 1));

  /* Collect data rows in document order: column A numeric, and not a header. */
  var dataRows = [];
  for (var r = range.s.r + 1; r <= range.e.r + 1; r++) {
    var a = cellAt(ws, 'A', r);
    if (!a || a.t !== 'n') continue;                 // title rows, blanks, junk
    if (textOrNull(cellAt(ws, 'B', r)) === 'Sales') continue;  // header row
    dataRows.push({ row: r, serial: a.v });
  }

  var issues = [];
  if (dataRows.length === 0) throw new Error('No data rows found on "' + sheetName + '".');
  if (dataRows.length % 13 !== 0) {
    issues.push('Expected a multiple of 13 data rows (12 months + 1 annual per year). Found ' +
      dataRows.length + '. Block detection may be wrong — do not trust this sheet.');
  }

  var months = {}, annual = {}, monthOrder = [];
  var emptyMonths = [], errorCells = [];
  var groups = Math.floor(dataRows.length / 13);

  for (var g = 0; g < groups; g++) {
    var base = g * 13;
    var janParts = serialToParts(dataRows[base].serial);
    var annualRow = dataRows[base + 12];
    var annParts = serialToParts(annualRow.serial);

    /* The structural assertion: the annual row must repeat January's date. */
    if (annParts.month !== 1 || annParts.year !== janParts.year) {
      issues.push('Year block ' + janParts.year + ': row ' + annualRow.row +
        ' was expected to be the annual rollup dated ' + janParts.year +
        '-01 but is dated ' + serialToMonth(annualRow.serial) +
        '. Positional block assumption broken.');
      continue;
    }

    var populatedInYear = 0;

    for (var i = 0; i < 12; i++) {
      var dr = dataRows[base + i];
      var key = serialToMonth(dr.serial);
      var rec = readRecord(ws, dr.row, errorCells, sheetName);
      if (rec === null) { emptyMonths.push(key); continue; }
      months[key] = rec;
      monthOrder.push(key);
      populatedInYear++;
    }

    var annRec = readRecord(ws, annualRow.row, errorCells, sheetName);
    if (annRec !== null) {
      annRec.monthsCounted = populatedInYear;
      annRec.partial = populatedInYear < 12;
      annual[String(janParts.year)] = annRec;
    }
  }

  monthOrder.sort();

  return {
    sheet: sheetName,
    community: community,
    months: months,
    annual: annual,
    monthCount: monthOrder.length,
    firstMonth: monthOrder[0] || null,
    lastMonth: monthOrder[monthOrder.length - 1] || null,
    emptyMonths: emptyMonths,
    errorCells: errorCells,
    issues: issues,
    dataRowCount: dataRows.length
  };
}

/* A row is 'empty' when Sales is not a number. Returns null in that case. */
function readRecord(ws, row, errorCells, sheetName) {
  var salesCell = cellAt(ws, 'B', row);
  if (numOrNull(salesCell) === null) return null;

  var rec = {};
  for (var i = 0; i < FIELDS.length; i++) {
    var f = FIELDS[i];
    var c = cellAt(ws, f.col, row);
    if (isErrorCell(c)) {
      errorCells.push(sheetName + '!' + f.col + row + ' (' + f.name + ') = ' + (c.w || '#ERR'));
    }
    rec[f.name] = numOrNull(c);
  }
  return rec;
}

/* ── HPI Summary ───────────────────────────────────────────────────────── */

/* The sheet is a grid, not a table. Two vertical blocks:

     block 1 (from r1)   labels in col A -> Detached:  E One Storey, F Two Storey, G Total
                         labels in col H -> Attached:  L Semi-Detached, M Row, N Total
     block 2 (from r17)  labels in col B -> Apartment: F Total
                         labels in col H -> Total Residential: L Total

   Labels are matched by text rather than row number, since the attribute
   set differs per type (Apartment has Covered Parking Spaces and no Lot
   Size or Below Ground Bedrooms). */
function parseHPI(wb) {
  var ws = wb.Sheets['HPI Summary'];
  if (!ws) return { types: {}, issues: ['HPI Summary sheet not found.'], reportMonth: null };

  var range = XLSX.utils.decode_range(ws['!ref']);
  var issues = [];

  var targets = [
    { type: 'det',  labelCol: 'A', valueCol: 'G', label: 'Detached — Total' },
    { type: 'semi', labelCol: 'H', valueCol: 'L', label: 'Semi-Detached' },
    { type: 'row',  labelCol: 'H', valueCol: 'M', label: 'Row' },
    { type: 'apt',  labelCol: 'B', valueCol: 'F', label: 'Apartment — Total' },
    { type: 'res',  labelCol: 'H', valueCol: 'L', label: 'Total Residential', minRow: 17 }
  ];

  var reportMonth = null;
  var out = {};

  targets.forEach(function (t) {
    var rec = {}, found = 0;
    for (var r = (t.minRow || range.s.r + 1); r <= range.e.r + 1; r++) {
      var label = textOrNull(cellAt(ws, t.labelCol, r));
      if (!label) continue;

      /* 'JUL-2026 Benchmark Price' / 'JUL-2026 Index value' carry the month. */
      var bm = label.match(/^([A-Z]{3})-(\d{4})\s+Benchmark Price$/i);
      if (bm) {
        rec.benchmarkPrice = numOrNull(cellAt(ws, t.valueCol, r));
        reportMonth = reportMonth || monthFromLabel(bm[1], bm[2]);
        found++;
        continue;
      }
      if (/^[A-Z]{3}-\d{4}\s+Index value$/i.test(label)) {
        rec.hpiIndex = numOrNull(cellAt(ws, t.valueCol, r));
        found++;
        continue;
      }

      var field = HPI_FIELDS[label];
      if (!field) continue;
      if (rec.hasOwnProperty(field)) continue;   // first match wins, blocks repeat labels

      var c = cellAt(ws, t.valueCol, r);
      /* Finished Basement is descriptive text; everything else is numeric. */
      rec[field] = (field === 'basement') ? textOrNull(c) : numOrNull(c);
      found++;
    }
    if (found === 0) issues.push('No HPI attributes matched for ' + t.label + ' (' + t.type + ').');
    out[t.type] = rec;
  });

  return { types: out, issues: issues, reportMonth: reportMonth };
}

var MONTHS3 = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function monthFromLabel(mon, year) {
  var i = MONTHS3.indexOf(mon.toUpperCase());
  if (i < 0) return null;
  return year + '-' + (i < 9 ? '0' : '') + (i + 1);
}

/* ── orchestration ─────────────────────────────────────────────────────── */

function parseWorkbook(buf) {
  var wb = XLSX.read(new Uint8Array(buf), { type: 'array' });

  var missing = TYPE_SHEETS.filter(function (s) { return !wb.Sheets[s]; });
  if (missing.length) {
    throw new Error('Workbook is missing expected sheet(s): ' + missing.join(', ') +
      '\nSheets present: ' + wb.SheetNames.join(', '));
  }

  var types = {};
  TYPE_SHEETS.forEach(function (s) {
    types[s.toLowerCase()] = parseTypeSheet(wb, s);
  });

  var hpi = parseHPI(wb);

  var communities = {};
  Object.keys(types).forEach(function (k) {
    var c = types[k].community;
    if (c) communities[c] = true;
  });
  var names = Object.keys(communities);

  return {
    sheetNames: wb.SheetNames,
    community: names[0] || null,
    communitySlug: names[0] ? slugify(names[0]) : null,
    communityConflict: names.length > 1 ? names : null,
    types: types,
    hpi: hpi,
    reportMonth: hpi.reportMonth || types.det.lastMonth
  };
}

function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* ── Firestore ─────────────────────────────────────────────────────────
   users/{uid}/communities/{slug}                 community record
   users/{uid}/communities/{slug}/types/{type}    one per property type

   Per-user, so each agent imports their own CREB report and nothing is
   centrally hosted.
   ─────────────────────────────────────────────────────────────────────── */

function communityRef(uid, slug) {
  return db.collection('users').doc(uid).collection('communities').doc(slug);
}

function buildParentDoc(parsed, meta, uid, sourceFile) {
  var det = parsed.types.det;
  return {
    name:           meta.name,
    slug:           meta.slug,
    city:           meta.city,
    source:         'CREB 360 Monthly',
    sourceFile:     sourceFile || null,
    reportMonth:    parsed.reportMonth || null,
    firstMonth:     det.firstMonth,
    lastMonth:      det.lastMonth,
    monthCount:     det.monthCount,
    availableTypes: Object.keys(parsed.types),
    display:        displayContract(),
    /* serverTimestamp() is safe at the top level of a document. It is
       rejected inside arrays — the recurring trap in this codebase. */
    importedAt:     firebase.firestore.FieldValue.serverTimestamp(),
    importedBy:     uid
  };
}

function buildTypeDoc(parsed, k) {
  var t = parsed.types[k];
  return {
    propertyType: k,
    sheet:        t.sheet,
    months:       t.months,
    annual:       t.annual,
    hpi:          (parsed.hpi.types && parsed.hpi.types[k]) || {},
    monthCount:   t.monthCount,
    firstMonth:   t.firstMonth,
    lastMonth:    t.lastMonth,
    updatedAt:    firebase.firestore.FieldValue.serverTimestamp()
  };
}

/* Rough on-the-wire size, to catch a document approaching the 1 MiB cap
   before Firestore rejects it. */
function docBytes(o) {
  return new Blob([JSON.stringify(o)]).size;
}

/* All six documents in one batch — atomic, so a partial import cannot
   leave three property types on the new report and two on the old.
   Returns the paths written. */
function writeCommunity(parsed, meta, uid, sourceFile) {
  var base  = communityRef(uid, meta.slug);
  var batch = db.batch();
  var paths = ['users/' + uid + '/communities/' + meta.slug];

  batch.set(base, buildParentDoc(parsed, meta, uid, sourceFile));
  Object.keys(parsed.types).forEach(function (k) {
    batch.set(base.collection('types').doc(k), buildTypeDoc(parsed, k));
    paths.push('users/' + uid + '/communities/' + meta.slug + '/types/' + k);
  });

  return batch.commit().then(function () { return paths; });
}

window.SphereMarketImport = {
  TYPE_SHEETS:        TYPE_SHEETS,
  FIELDS:             FIELDS,
  HPI_FIELDS:         HPI_FIELDS,
  THIN_MAX_SALES:     THIN_MAX_SALES,
  SUPPRESS_WHEN_THIN: SUPPRESS_WHEN_THIN,
  ALWAYS_RENDER:      ALWAYS_RENDER,
  REQUIRED_COMPANIONS: REQUIRED_COMPANIONS,
  isThin:             isThin,
  isCompanionField:   isCompanionField,
  displayContract:    displayContract,
  parseWorkbook:      parseWorkbook,
  slugify:            slugify,
  communityRef:       communityRef,
  buildParentDoc:     buildParentDoc,
  buildTypeDoc:       buildTypeDoc,
  docBytes:           docBytes,
  writeCommunity:     writeCommunity
};

})();
