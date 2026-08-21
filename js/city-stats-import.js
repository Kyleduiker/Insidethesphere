/**
 * Inside The Sphere — City of Calgary Monthly Statistics Package parser
 *
 * Reads pages 5 and 6 of the CREB city-wide package: total residential and
 * the four property types.
 *
 * ── Why not page 2 ────────────────────────────────────────────────────
 * The summary dashboard on page 2 is raster graphics. In the July 2026
 * edition that page holds 1.38 MB of content with five text operators and
 * twelve images — every figure is pixels. In earlier editions page 2 is
 * the press-release prose instead. It has already changed format once, and
 * has never been a source for the numbers. Pages 5 and 6 are.
 *
 * ── Two layouts ───────────────────────────────────────────────────────
 * CREB emits the same tables two ways.
 *
 *   glued      "Benchmark Price$581,100$569,200-2.05%$585,943..."
 *   separated  "Benchmark Price" | "$588,300" | "$570,500" | "-3.03%" ...
 *
 * In content-stream order the separated runs do NOT follow display order,
 * which is why naive text extraction looks scrambled. Clustering by y and
 * sorting by x recovers the row exactly — the same approach clusterRows()
 * uses for Matrix sheets. Both layouts then reduce to one label and six
 * numbers, so a single row parser handles them.
 *
 * ── The page 6 labelling problem ──────────────────────────────────────
 * Page 6 stacks the four property types as four identical tables and the
 * type names are NOT in the text layer. Block order is not stable either:
 *
 *   Jul 2026 page 6  Detached, Apartment, Semi, Row
 *   May 2026 page 3  Detached, Semi, Row, Apartment
 *
 * So a positional guess would eventually label an apartment benchmark as
 * detached, which is the kind of error that surfaces in front of a seller.
 * Each block is instead matched to a type BY BENCHMARK VALUE against a
 * page that carries explicit type labels:
 *
 *   older layout  page 3, a labelled summary table
 *   newer layout  pages 13/15/17/19, headed "CITY OF CALGARY <TYPE> ..."
 *
 * If any block cannot be matched, or two match the same type, the parse is
 * marked unverified and the caller must refuse to write.
 */

(function () {
'use strict';

var ROWS = [
  { key: 'sales',              match: /^Total Sales(?!\s*Volume)/i },
  { key: 'salesVolume',        match: /^Total Sales Volume/i },
  { key: 'newListings',        match: /^New Listings/i },
  { key: 'inventory',          match: /^Inventory/i },
  { key: 'monthsOfSupply',     match: /^Months of Supply/i },
  { key: 'salesToNewListings', match: /^Sales to New Listings/i },
  { key: 'salesToListPrice',   match: /^Sales to List Price/i },
  { key: 'dom',                match: /^Days on Market/i },
  { key: 'benchmarkPrice',     match: /^Benchmark Price/i },
  { key: 'medianPrice',        match: /^Median Price/i },
  { key: 'averagePrice',       match: /^Average Price/i },
  { key: 'hpiIndex',           match: /^Index/i }
];

/* Percentages are stored as fractions, matching the CREB 360 importer, so
   the two market sources never need different formatting at render. */
var PCT_ROWS = { salesToNewListings: 1, salesToListPrice: 1 };

var MONTHS3 = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

/* ── row assembly ──────────────────────────────────────────────────────
   Cluster runs into visual rows by y, then order within the row by x.
   Tolerance is deliberately tight: the tables run 12pt apart. */
function toRows(runs, tol) {
  tol = tol || 3;
  var buckets = {};
  runs.forEach(function (r) {
    var k = Math.round(r.y / tol) * tol;
    (buckets[k] = buckets[k] || []).push(r);
  });
  return Object.keys(buckets)
    .map(Number)
    .sort(function (a, b) { return b - a; })          // top of page first
    .map(function (y) {
      var cells = buckets[y].slice().sort(function (a, b) { return a.x - b.x; });
      return { y: y, cells: cells, text: cells.map(function (c) { return c.str; }).join(' ') };
    });
}

/* Every number in a row, in display order.

   The glued layout runs values together with no separator, so the pattern
   has to know where one number ends. Comma grouping is what provides that:
   in "$570,0500.05%" a greedy [\d,]* swallows "570,0500" and the row then
   yields five numbers instead of six, and gets dropped. Requiring groups of
   exactly three digits after each comma stops at "$570,050" and leaves
   "0.05%" for the next match. Same defect ate "$769,8004%" on page 3.

   Parentheses are treated as negative, which CREB uses occasionally. */
var NUM_RE = /\(?-?\$?\s?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s?%?\)?/g;

function numbersIn(text) {
  var out = [];
  var re = new RegExp(NUM_RE.source, 'g');
  var m;
  while ((m = re.exec(text))) {
    var raw = m[0];
    var neg = /^\(/.test(raw) || /^-/.test(raw);
    var v = parseFloat(raw.replace(/[()\-$,%\s]/g, ''));
    if (!isFinite(v)) continue;
    out.push({ value: neg ? -v : v, isPct: /%/.test(raw), raw: raw.trim() });
  }
  return out;
}

/* A table row is label + six numbers:
     [month prior, month current, month Y/Y%, ytd prior, ytd current, ytd Y/Y%] */
function parseMetricRow(rowText, key) {
  var nums = numbersIn(rowText);
  if (nums.length < 6) return null;
  var n = nums.slice(0, 6).map(function (o) { return o.value; });
  var asFraction = function (v) { return v == null ? null : v / 100; };
  var pct = !!PCT_ROWS[key];
  return {
    priorYear:  pct ? asFraction(n[0]) : n[0],
    current:    pct ? asFraction(n[1]) : n[1],
    yoy:        asFraction(n[2]),
    ytdPrior:   pct ? asFraction(n[3]) : n[3],
    ytdCurrent: pct ? asFraction(n[4]) : n[4],
    ytdYoy:     asFraction(n[5])
  };
}

/* Pull one 12-row metric table starting at or below a given y. Returns the
   metrics found and the y of the last row consumed, so page 6's four
   stacked blocks can be walked in order. */
function readTable(rows, startIdx) {
  var out = {}, i = startIdx, lastIdx = startIdx, seen = 0;
  for (; i < rows.length; i++) {
    var text = rows[i].text.trim();
    var hit = null;
    for (var r = 0; r < ROWS.length; r++) {
      if (ROWS[r].match.test(text)) { hit = ROWS[r]; break; }
    }
    if (!hit) {
      /* Allow gaps inside a table, but stop once we are clearly past it. */
      if (seen >= 8 && (rows[startIdx].y - rows[i].y) > 220) break;
      continue;
    }
    if (out[hit.key] !== undefined) break;            // next block has begun
    var parsed = parseMetricRow(text, hit.key);
    if (parsed) { out[hit.key] = parsed; lastIdx = i; seen++; }
  }
  return { metrics: out, nextIdx: lastIdx + 1, count: seen };
}

/* ── report month ──────────────────────────────────────────────────────
   Primary source is the page 5 column header pair, e.g. "May-25" "May-26";
   the current period is the later of the two. When that header block is
   rasterised — as it is in the July 2026 edition — fall back to the month
   printed on page 1. Both are in-document; the filename is never used. */
function monthFromPage5(runs) {
  var best = null;
  runs.forEach(function (r) {
    var m = /\b([A-Z][a-z]{2})[-\s.]?(\d{2})\b/.exec(r.str || '');
    if (!m) return;
    var mi = MONTHS3.indexOf(m[1].toUpperCase());
    if (mi < 0) return;
    var year = 2000 + parseInt(m[2], 10);
    var key = year + '-' + (mi < 9 ? '0' : '') + (mi + 1);
    if (!best || key > best) best = key;
  });
  return best;
}

function monthFromPage1(runs) {
  for (var i = 0; i < runs.length; i++) {
    var m = /\b([A-Z][a-z]{2,8})\.?\s+(\d{4})\b/.exec(runs[i].str || '');
    if (!m) continue;
    var mi = MONTHS3.indexOf(m[1].slice(0, 3).toUpperCase());
    if (mi < 0) continue;
    return m[2] + '-' + (mi < 9 ? '0' : '') + (mi + 1);
  }
  return null;
}

/* ── labelled benchmark sources for the cross-check ────────────────────
   Newer layout: pages 13/15/17/19 are headed with the type and carry a
   two-series benchmark history. The last value of the SECOND series is the
   current month — verified against page 6 on the July 2026 edition. */
var TYPE_PAGES = { 13: 'det', 15: 'apt', 17: 'semi', 19: 'row' };
var TYPE_WORDS = [
  { key: 'semi', match: /SEMI\s*-?\s*DET/i },     // before 'det', it contains it
  { key: 'det',  match: /DETACHED/i },
  { key: 'apt',  match: /APARTMENT/i },
  { key: 'row',  match: /\bROW\b/i }
];

function typeFromHeader(runs) {
  var txt = runs.map(function (r) { return r.str; }).join(' ');
  if (!/CITY OF CALGARY/i.test(txt)) return null;
  for (var i = 0; i < TYPE_WORDS.length; i++) {
    if (TYPE_WORDS[i].match.test(txt)) return TYPE_WORDS[i].key;
  }
  return null;
}

function benchmarksFromTypePage(runs) {
  var rows = toRows(runs);
  var series = [];
  rows.forEach(function (r) {
    if (!/^Benchmark Price/i.test(r.text.trim())) return;
    var nums = numbersIn(r.text);
    if (nums.length) series.push(nums[nums.length - 1].value);
  });
  /* Two series: prior year then current. The current month is the last
     value of the second. */
  return series.length >= 2 ? series[1] : (series[0] || null);
}

/* Older layout: page 3 is a labelled summary whose rows begin with the
   type name and end with that type's benchmark price. */
var P3_LABELS = [
  { key: 'semi', match: /^Semi\b/i },
  { key: 'det',  match: /^Detached\b/i },
  { key: 'apt',  match: /^Apartment\b/i },
  { key: 'row',  match: /^Row\b/i }
];

function benchmarksFromPage3(runs) {
  if (!runs || !runs.length) return {};
  var out = {};
  toRows(runs).forEach(function (r) {
    var text = r.text.trim();
    for (var i = 0; i < P3_LABELS.length; i++) {
      if (!P3_LABELS[i].match.test(text)) continue;
      var key = P3_LABELS[i].key;
      if (out[key] !== undefined) return;            // first (monthly) block wins
      /* Comma-anchored for the same reason as NUM_RE: the trailing Y/Y
         percentage is glued to the benchmark as "$769,8004%". */
      var money = text.match(/\$\d{1,3}(?:,\d{3})+/g);
      if (money && money.length) {
        out[key] = parseFloat(money[money.length - 1].replace(/[$,]/g, ''));
      }
      return;
    }
  });
  return out;
}

/* ── main ──────────────────────────────────────────────────────────────
   pages: { '1': runs, '3': runs, '5': runs, '6': runs, '13': ..., ... }
   where runs is [{x, y, str}]. */
function parseCityStats(pages) {
  var warnings = [];
  var get = function (n) { return pages[String(n)] || []; };

  if (!get(5).length) {
    throw new Error('Page 5 has no text layer. This does not look like a ' +
      'City of Calgary Monthly Statistics Package.');
  }

  /* Total residential — page 5. */
  var rows5 = toRows(get(5));
  var firstIdx = 0;
  for (var i = 0; i < rows5.length; i++) {
    if (/^Total Sales(?!\s*Volume)/i.test(rows5[i].text.trim())) { firstIdx = i; break; }
  }
  var res = readTable(rows5, firstIdx);
  if (res.count < 8) {
    throw new Error('Only ' + res.count + ' of 12 metric rows were readable on ' +
      'page 5. The layout may have changed.');
  }
  if (res.count < 12) {
    warnings.push('Page 5: ' + res.count + ' of 12 metric rows read. Missing rows are stored as null.');
  }

  /* Report month. */
  var month = monthFromPage5(get(5));
  var monthSource = 'page 5 column headers';
  if (!month) {
    month = monthFromPage1(get(1));
    monthSource = 'page 1 (page 5 headers are not in the text layer)';
  }
  if (!month) {
    throw new Error('Could not read the report month from page 5 or page 1. ' +
      'Refusing to guess it from the filename.');
  }

  /* Four property-type blocks — page 6, in document order, unlabelled. */
  var rows6 = toRows(get(6));
  var blocks = [];
  var idx = 0;
  while (blocks.length < 4 && idx < rows6.length) {
    var start = -1;
    for (var j = idx; j < rows6.length; j++) {
      if (/^Total Sales(?!\s*Volume)/i.test(rows6[j].text.trim())) { start = j; break; }
    }
    if (start < 0) break;
    var b = readTable(rows6, start);
    if (b.count >= 8) blocks.push(b.metrics);
    idx = Math.max(b.nextIdx, start + 1);
  }
  if (blocks.length !== 4) {
    throw new Error('Expected four property-type blocks on page 6, found ' +
      blocks.length + '. The layout may have changed.');
  }

  /* Cross-check: match each block to a type by benchmark value against a
     page that names the type explicitly. */
  var labelled = benchmarksFromPage3(get(3));
  var labelSource = Object.keys(labelled).length ? 'page 3 (labelled summary)' : null;

  if (!labelSource) {
    labelled = {};
    Object.keys(TYPE_PAGES).forEach(function (p) {
      var runs = get(p);
      if (!runs.length) return;
      var key = typeFromHeader(runs);
      if (!key) return;
      var v = benchmarksFromTypePage(runs);
      if (v != null) labelled[key] = v;
    });
    if (Object.keys(labelled).length) labelSource = 'pages 13-19 (type headings)';
  }

  var types = {};
  var unmatched = [];
  var verified = false;

  if (labelSource && Object.keys(labelled).length === 4) {
    blocks.forEach(function (b, n) {
      var bench = b.benchmarkPrice ? b.benchmarkPrice.current : null;
      var hit = null;
      Object.keys(labelled).forEach(function (k) {
        if (bench != null && Math.abs(labelled[k] - bench) < 1) hit = k;
      });
      if (!hit || types[hit]) unmatched.push({ block: n + 1, benchmark: bench, hit: hit });
      else types[hit] = b;
    });
    verified = unmatched.length === 0 && Object.keys(types).length === 4;
  } else {
    warnings.push('No page in this edition names the property types in its text ' +
      'layer, so the block-to-type cross-check could not run.');
  }

  return {
    reportMonth: month,
    monthSource: monthSource,
    residential: res.metrics,
    blocks: blocks,                 // document order, always present
    types: types,                   // only when verified
    labelled: labelled,
    labelSource: labelSource,
    unmatched: unmatched,
    verified: verified,
    warnings: warnings,
    rowsRead: res.count
  };
}

function buildCityDoc(parsed, uid, sourceFile) {
  return {
    scope:        'city-calgary',
    reportMonth:  parsed.reportMonth,
    monthSource:  parsed.monthSource,
    source:       'CREB City of Calgary Monthly Statistics Package',
    sourceFile:   sourceFile || null,
    residential:  parsed.residential,
    types:        parsed.types,
    verifiedAgainst: parsed.labelSource,
    percentagesAre:  'fraction',
    importedAt:   firebase.firestore.FieldValue.serverTimestamp(),
    importedBy:   uid
  };
}

function cityRef(uid, month) {
  return db.collection('users').doc(uid)
           .collection('market').doc('city-calgary')
           .collection('months').doc(month);
}

function writeCityStats(parsed, uid, sourceFile) {
  if (!parsed.verified) {
    return Promise.reject(new Error(
      'Refusing to write: the property-type cross-check did not pass. ' +
      'Writing now could label an apartment benchmark as detached.'));
  }
  var ref = cityRef(uid, parsed.reportMonth);
  return ref.set(buildCityDoc(parsed, uid, sourceFile))
            .then(function () {
              return ['users/' + uid + '/market/city-calgary/months/' + parsed.reportMonth];
            });
}

window.SphereCityStats = {
  parseCityStats: parseCityStats,
  buildCityDoc:   buildCityDoc,
  cityRef:        cityRef,
  writeCityStats: writeCityStats,
  toRows:         toRows,
  ROWS:           ROWS
};

})();
