/**
 * Inside The Sphere — Comparable adjustments
 *
 * Pure computation. Reads no page state, touches no globals, makes no
 * network calls. Takes a subject, a comp and an agent's settings document
 * and returns the lines to render.
 *
 * Loaded by cma/edit.html (preview AND publish) and settings/index.html (for
 * the band list). One copy on purpose: the client net sheet and the editor's
 * recalcNet() were once two implementations of the same arithmetic and they
 * disagreed, in front of a seller. Adjusted prices are the same class of
 * number.
 *
 * NOT loaded by the client page, and it must stay that way. Computing on the
 * client would need the agent's settings on the public document, and those
 * settings are the agent's methodology. publishCMA() runs compute() and
 * writes only each comparable's result.
 *
 * ── The sign rule ─────────────────────────────────────────────────────────
 *
 * An adjustment always moves the COMPARABLE toward the subject. The comp is
 * the thing being restated as "what this would have sold for if it were
 * your home". So:
 *
 *     amount = (subjectValue - compValue) * rate
 *
 * Comp has more  -> negative -> subtracted from the comp.
 * Subject has more -> positive -> added to the comp.
 *
 * The agent never enters a negative number. Direction is arithmetic.
 *
 * ── Unavailable is not zero ───────────────────────────────────────────────
 *
 * A factor the agent has priced but the data cannot support must render as
 * UNAVAILABLE and must never fall through to a $0 contribution. An
 * adjustment that quietly does not run makes the adjusted price wrong with
 * nothing on the page saying so.
 *
 * A rate of zero is different, and means the agent has switched that factor
 * off deliberately. Those lines are omitted entirely.
 *
 * ── Adjusted prices are evidence, never an input ──────────────────────────
 *
 * Nothing here feeds the Reasoning section's medians. Those are computed
 * from prices that were actually achieved or actually asked.
 */

(function (root) {
'use strict';

function num(v) {
  var n = parseFloat(v);
  return isFinite(n) ? n : null;
}

/* Zero reads as missing for every field where zero is not a real-world
   value — square footage, lot size, year built, bedrooms. Half bathrooms
   are the exception and are handled with the bath pair below. */
function pos(v) {
  var n = num(v);
  return (n !== null && n > 0) ? n : null;
}

function money(n) {
  var v = Math.abs(Math.round(n));
  return '$' + v.toLocaleString();
}

function signed(n) {
  var r = Math.round(n);
  if (r === 0) return '$0';
  return (r > 0 ? '+ ' : '− ') + money(r);
}

function plural(n, one, many) {
  return Math.abs(n) === 1 ? one : many;
}

/* ── CATEGORY VOCABULARIES ────────────────────────────────────────────────
   These MUST track the <select> options in cma/edit.html, mapGarage() in its
   Matrix parser, and GARAGE_TYPES on the settings page. Basement is stored as
   keys and matches one to one. Garage is stored as the option's display
   string, so it needs this lookup.

   "Garage" — a garage the sheet mentions without a size or attachment — is
   deliberately NOT here. It resolves to null and renders as unavailable, as
   does anything imported before the vocabulary was reconciled ("3 car"). */

/* Full noun phrases, not adjectives. These are dropped straight into a
   sentence a seller reads. */
var BASEMENT_LABEL = {
  finished:   'a finished basement',
  partial:    'a partially finished basement',
  unfinished: 'an unfinished basement',
  none:       'no basement'
};

var GARAGE_KEY_BY_LABEL = {
  'no garage':       'none',
  '1 car attached':  'att1',
  '1 car detached':  'det1',
  '2 car attached':  'att2',
  '2 car detached':  'det2',
  '3 car attached':  'att3',
  '3 car detached':  'det3',
  '4+ car attached': 'att4',
  '4+ car detached': 'det4'
};

var GARAGE_LABEL = {
  none: 'no garage',
  att1: 'a single attached garage',
  det1: 'a single detached garage',
  att2: 'a double attached garage',
  det2: 'a double detached garage',
  att3: 'a triple attached garage',
  det3: 'a triple detached garage',
  att4: 'an attached garage for four or more',
  det4: 'a detached garage for four or more'
};

function basementKey(v) {
  var k = String(v == null ? '' : v).trim().toLowerCase();
  return BASEMENT_LABEL[k] ? k : null;
}

function garageKey(v) {
  var k = String(v == null ? '' : v).trim().toLowerCase().replace(/\s+/g, ' ');
  return GARAGE_KEY_BY_LABEL[k] || null;
}

/* ── LINE DEFINITIONS ─────────────────────────────────────────────────── */

/* ── MATERIALITY ──────────────────────────────────────────────────────────
   Differences below these are not adjusted. A $2,400 line for a comp built
   three years later makes the method look fussy rather than rigorous, and
   precision beyond what the evidence supports is its own kind of overclaim.

   Measured in the factor's own units, not in dollars, because a unit rule is
   something a seller can be told plainly — "homes within 50 sq.ft. are
   treated as the same size" — where a dollar floor sounds like trimming.
   The cost is that the dollars skipped scale with the rate; the editor shows
   what each skipped line would have been worth, and the total, so a run of
   small differences all pointing the same way is visible to the agent.

   Strictly "under": a difference of exactly 50 sq.ft., exactly 10% of the
   subject's lot, or exactly 5 years IS adjusted.

   Constants rather than settings on purpose, until real use shows they need
   to vary by agent. */
var MATERIALITY = {
  sqftMin:     50,     /* living area, sq.ft. */
  lotShareMin: 0.10,   /* lot size, as a share of the SUBJECT's lot */
  ageYearsMin: 5       /* years between build dates */
};

var NUMERIC_LINES = [
  { key: 'bedroomAbove', label: 'Bedrooms above grade',
    subj: 'bedsAbove', comp: 'bedsAbove',
    one: 'bedroom', many: 'bedrooms' },
  { key: 'bathFull', label: 'Full bathrooms',
    subj: 'bathsFull', comp: 'bathsFull', pair: 'baths',
    one: 'full bathroom', many: 'full bathrooms' },
  { key: 'bathHalf', label: 'Half bathrooms',
    subj: 'bathsHalf', comp: 'bathsHalf', pair: 'baths', zeroIsReal: true,
    one: 'half bathroom', many: 'half bathrooms' },
  { key: 'perSqft', label: 'Living area',
    subj: 'sqft', comp: 'sqft',
    one: 'sq.ft.', many: 'sq.ft.',
    /* null when material. Otherwise the row text, and the phrase used when
       every skipped factor is gathered into one line on the client card —
       which needs the factor named, where a row already carries its label. */
    immaterial: function (diff) {
      return Math.abs(diff) < MATERIALITY.sqftMin ? {
        detail: 'Within ' + MATERIALITY.sqftMin + ' sq.ft. of your home.',
        phrase: 'living area within ' + MATERIALITY.sqftMin + ' sq.ft. of your home'
      } : null;
    } },
  { key: 'perLotSqft', label: 'Lot size',
    subj: 'lotSize', comp: 'lotSize',
    one: 'sq.ft. of lot', many: 'sq.ft. of lot',
    immaterial: function (diff, s) {
      var pct = Math.round(MATERIALITY.lotShareMin * 100);
      return Math.abs(diff) / s < MATERIALITY.lotShareMin ? {
        detail: 'Within ' + pct + '% of your lot size.',
        phrase: 'lot size within ' + pct + '% of yours'
      } : null;
    } }
];

/* ── AGE BANDS ────────────────────────────────────────────────────────────
   Replaces a flat rate per year, which treated a year of age as worth the
   same at every age. It is not: the gap between a 2020 and a 2025 build is
   not the gap between 1965 and 1970. Narrow at the new end, where most of
   the SE Calgary target communities sit; wider as stock gets older.

   Bands do NOT capture renovation. A renovated 1965 home is still in the
   oldest band. Nothing in the data records renovation — that belongs in
   the per-comp override, with a reason.

   Each band carries a value, exactly like garage types, and the adjustment
   is the subject's band value minus the comp's. Fixed here rather than
   agent-editable: editable boundaries need gap and overlap checking that
   nobody has asked for yet. */
var AGE_BANDS = [
  { key: 'new',         label: 'New',         min: 0,  max: 5 },
  { key: 'recent',      label: 'Recent',      min: 6,  max: 15 },
  { key: 'established', label: 'Established', min: 16, max: 25 },
  { key: 'mature',      label: 'Mature',      min: 26, max: 40 },
  { key: 'older',       label: 'Older',       min: 41, max: Infinity }
];

function bandRange(b) {
  return bandSpan(b) + ' years';
}

/* The band NAMES are for the settings page only. "Established" or "Mature"
   in a sentence a seller reads sounds like a judgement of their house; the
   age range is the fact, so client-facing copy uses the range alone. */
function bandSpan(b) {
  return b.max === Infinity ? b.min + '+' : b.min + '–' + b.max;
}

/* A build year later than the valuation year — a presale, or a home finished
   after the appointment — is treated as age 0 rather than as a negative. */
function bandOf(age) {
  var a = Math.max(0, age);
  for (var i = 0; i < AGE_BANDS.length; i++) {
    if (a >= AGE_BANDS[i].min && a <= AGE_BANDS[i].max) return AGE_BANDS[i];
  }
  return null;
}

/* ── VALUATION YEAR ───────────────────────────────────────────────────────
   Age is measured against the CMA, NEVER against today. A comp built in 2011
   is 15 in 2026 and 16 in 2027; measured from the current date it would
   cross a band boundary on New Year's Day and change the adjusted price on a
   CMA already sitting in a seller's inbox, with nobody touching it.

   The editor passes `valuationYear` in memory, for the preview and for the
   computation at publish; the lines are baked there, so a published CMA
   never recomputes. Without it the appointment date's year is used, and if
   neither is present the age line is UNAVAILABLE — this module never reaches
   for the clock. */
function valuationYearOf(subject) {
  var v = parseInt(subject && subject.valuationYear, 10);
  if (v >= 1900 && v <= 2200) return v;
  var m = String((subject && subject.appointmentDate) || '').match(/^(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

var AGE_DEF = { key: 'age', label: 'Age', table: 'ageValues' };

function ageLine(subject, comp, table) {
  var def = AGE_DEF;
  /* The subject form calls it yearBuilt and a comp calls it year. Same fact,
     two field names. */
  var sy = pos(subject.yearBuilt);
  var cy = pos(comp.year);
  var vy = valuationYearOf(subject);

  if (sy === null || cy === null) {
    return unavailableLine(def,
      (sy === null && cy === null) ? 'Not recorded for either property.'
        : (cy === null) ? 'Not recorded for this property.'
        : 'Not recorded for your home.',
      'Age: ' + (sy === null ? 'subject yearBuilt missing' : '') +
      (sy === null && cy === null ? ' and ' : '') +
      (cy === null ? 'comp year missing' : ''));
  }
  if (vy === null) {
    return unavailableLine(def, 'Not recorded for this evaluation.',
      'Age: no valuation year — set the appointment date in section 01. ' +
      'Age is measured against the CMA, never against today.');
  }

  var sb = bandOf(vy - sy), cb = bandOf(vy - cy);
  var gap = Math.abs(sy - cy);

  if (sb.key === cb.key) {
    return { key: def.key, label: def.label, status: 'even', amount: 0,
             detail: 'In the same age band as your home, ' + bandRange(sb) + '.' };
  }

  var sv = num(table[sb.key]), cv = num(table[cb.key]);
  var wouldBe = (sv !== null && cv !== null) ? Math.round(sv - cv) : null;

  /* The 5-year rule sits on top of the bands, because a band edge is a cliff:
     2020 and 2021 builds are one year apart and a whole band step different.
     That would be a worse line than the fussy one this replaces.

     Checked BEFORE a missing band value makes the line unavailable: a skipped
     line never needed the value, so a blank band row must not flag it. */
  if (gap < MATERIALITY.ageYearsMin) {
    return { key: def.key, label: def.label, status: 'immaterial', amount: 0,
             wouldBe: wouldBe,
             detail: 'Built within ' + MATERIALITY.ageYearsMin + ' years of your home.',
             phrase: 'built within ' + MATERIALITY.ageYearsMin + ' years of your home' };
  }

  if (sv === null || cv === null) {
    var missing = sv === null ? sb : cb;
    return unavailableLine(def, 'Not recorded for this property.',
      'Age: no value saved in settings for the ' + missing.label +
      ' band (' + bandRange(missing) + ').');
  }

  return {
    key: def.key, label: def.label,
    status: wouldBe === 0 ? 'even' : 'applied',
    amount: wouldBe,
    detail: 'Built in ' + cy + ', in the ' + bandSpan(cb) + ' year band. ' +
            'Yours was built in ' + sy + ', in the ' + bandSpan(sb) + ' year band.'
  };
}

var CATEGORY_LINES = [
  { key: 'basement', label: 'Basement', table: 'basementValues',
    field: 'basement', resolve: basementKey, name: BASEMENT_LABEL },
  { key: 'garage', label: 'Garage', table: 'garageValues',
    field: 'garage', resolve: garageKey, name: GARAGE_LABEL }
];

/* ── BATH PAIR ────────────────────────────────────────────────────────────
   Matrix's F/H Bth field is read as a pair or not at all — on the ten
   listings in test-pdfs/Client_Full1541.pdf it parsed on five. When it
   fails both halves land as 0, and 0 half bathrooms is a perfectly real
   value. So the full-bath count is the only signal that distinguishes
   "never read" from "genuinely zero", and both bath lines stand or fall
   with it. Deriving the split from the six-cell Baths grid was tried and
   does not work: on that same file the grid sums disagree with the F/H
   totals (3 against 4, and 1 against 3). */
function bathsKnown(o) {
  return pos(o && o.bathsFull) !== null;
}

function unavailableLine(def, note, diag) {
  return {
    key: def.key, label: def.label, status: 'unavailable',
    amount: 0, detail: note, diag: diag
  };
}

function numericLine(def, subject, comp, rate) {
  var s, c;

  if (def.pair === 'baths') {
    var sKnown = bathsKnown(subject), cKnown = bathsKnown(comp);
    if (!sKnown || !cKnown) {
      var who = (!sKnown && !cKnown) ? 'Bathroom counts are not recorded'
              : !cKnown ? 'The bathroom count for this property is not recorded'
              : 'The bathroom count for your home is not recorded';
      return unavailableLine(def, who + ' in full and half.',
        'F/H Bth missing on ' +
        (!sKnown && !cKnown ? 'subject and comp' : !cKnown ? 'comp' : 'subject') +
        ' — the Matrix parse reads the pair or neither, so both bath lines ' +
        'are held back rather than treated as zero.');
    }
    /* Half baths are known to be known once the pair is known, so a 0 here
       is a real zero. */
    s = num(subject[def.subj]) || 0;
    c = num(comp[def.comp]) || 0;
  } else if (def.zeroIsReal) {
    s = num(subject[def.subj]) || 0;
    c = num(comp[def.comp]) || 0;
  } else {
    s = pos(subject[def.subj]);
    c = pos(comp[def.comp]);
    if (s === null || c === null) {
      return unavailableLine(def,
        (s === null && c === null) ? 'Not recorded for either property.'
          : (c === null) ? 'Not recorded for this property.'
          : 'Not recorded for your home.',
        def.label + ': ' +
        (s === null ? 'subject.' + def.subj + ' missing' : '') +
        (s === null && c === null ? ' and ' : '') +
        (c === null ? 'comp.' + def.comp + ' missing' : ''));
    }
  }

  var diff = s - c;                 /* subject minus comp — never reversed */
  var amount = Math.round(diff * rate);

  if (diff === 0) {
    return { key: def.key, label: def.label, status: 'even', amount: 0,
             detail: 'The same as your home.' };
  }

  /* Computed and judged too small to matter. Not unavailable — nothing is
     missing — and not off. A seller should see that the factor was checked,
     not forgotten, so it is reported rather than dropped. `wouldBe` is for
     the editor only and never reaches a client-page string. */
  var skip = def.immaterial ? def.immaterial(diff, s, c) : null;
  if (skip) {
    return { key: def.key, label: def.label, status: 'immaterial', amount: 0,
             wouldBe: amount, detail: skip.detail, phrase: skip.phrase };
  }

  var mag = Math.abs(diff);
  var detail = 'Has ' + mag.toLocaleString() + ' ' + (diff > 0 ? 'fewer' : 'more') +
               ' ' + plural(mag, def.one, def.many) + ' than your home.';

  return { key: def.key, label: def.label, status: 'applied',
           amount: amount, detail: detail };
}

function categoryLine(def, subject, comp, table) {
  var sk = def.resolve(subject[def.field]);
  var ck = def.resolve(comp[def.field]);

  if (sk === null || ck === null) {
    var rawS = String(subject[def.field] || '').trim();
    var rawC = String(comp[def.field] || '').trim();
    return unavailableLine(def,
      (sk === null && ck === null) ? 'Not recorded for either property.'
        : (ck === null) ? 'Not recorded for this property.'
        : 'Not recorded for your home.',
      def.label + ': ' +
      (sk === null ? 'subject value ' + (rawS ? '"' + rawS + '" is not one of the ' +
        def.label.toLowerCase() + ' types in your settings' : 'is blank') : '') +
      (sk === null && ck === null ? '; ' : '') +
      (ck === null ? 'comp value ' + (rawC ? '"' + rawC + '" is not one of the ' +
        def.label.toLowerCase() + ' types in your settings' : 'is blank') : ''));
  }

  var sv = num(table[sk]);
  var cv = num(table[ck]);
  if (sv === null || cv === null) {
    return unavailableLine(def, 'Not recorded for this property.',
      def.label + ': no value saved in settings for "' +
      (sv === null ? sk : ck) + '".');
  }

  var amount = Math.round(sv - cv);
  if (sk === ck) {
    return { key: def.key, label: def.label, status: 'even', amount: 0,
             detail: 'The same as your home — ' + def.name[ck] + '.' };
  }

  return {
    key: def.key, label: def.label,
    status: amount === 0 ? 'even' : 'applied',
    amount: amount,
    detail: 'Has ' + def.name[ck] + '; yours has ' + def.name[sk] + '.'
  };
}

/* ── SET, OFF, OR NEVER FILLED IN ─────────────────────────────────────────
   Zero used to mean both "the agent switched this factor off" and "the
   agent never touched this field", which is how a settings document of
   nothing but zeros came to look identical to a configured method. Blank
   is now stored as null, so the three states are distinguishable:

     null   never filled in — an omission, worth telling the agent about
     0      deliberately off — a decision, and silent
     > 0    in use

   Neither of the first two produces a line. The difference is reported to
   the caller so the editor can nudge and the client page can stay quiet:
   a seller has no use for the fact that their agent does not price
   basements. */
function tableState(table) {
  if (!table) return 'unset';
  var anySet = false, anyNonZero = false;
  for (var k in table) {
    if (!Object.prototype.hasOwnProperty.call(table, k)) continue;
    var n = num(table[k]);
    if (n === null) continue;
    anySet = true;
    if (n > 0) anyNonZero = true;
  }
  return !anySet ? 'unset' : anyNonZero ? 'set' : 'off';
}

/* ── PRICE BASIS ──────────────────────────────────────────────────────────
   The same split the Reasoning section uses. Sold and pending are restated
   against what was achieved; everything else against what is being asked.
   The two are different measures and are labelled as such. */
var ACHIEVED = { sold: 1, pending: 1 };

function basisOf(comp) {
  var st = String(comp.status || 'sold').toLowerCase().trim();
  if (ACHIEVED[st]) {
    return { kind: 'sold', price: pos(comp.soldPrice) || pos(comp.price),
             label: 'Adjusted sale price' };
  }
  return { kind: 'list', price: pos(comp.listPrice) || pos(comp.price),
           label: 'Adjusted asking price' };
}

/**
 * compute(subject, comp, settings)
 *
 * ALWAYS returns an object. Check `ok` before using anything else.
 *
 * On failure it carries `reason`, because "nothing rendered" was
 * indistinguishable from "nothing configured" and cost an afternoon:
 *
 *   no-subject / no-comp   caller passed nothing
 *   no-settings            no settings document at all
 *   no-values              a settings document exists but not one factor
 *                          is in use — see notConfigured / switchedOff to
 *                          say which of the two it is
 *   no-price               this comparable has no price to adjust
 *
 * `notConfigured` and `switchedOff` are also present on success, so a
 * caller can report what is not running even when something is.
 */
function compute(subject, comp, settings) {
  var notConfigured = [], switchedOff = [];
  var fail = function (reason) {
    return { ok: false, reason: reason,
             notConfigured: notConfigured, switchedOff: switchedOff };
  };

  if (!subject) return fail('no-subject');
  if (!comp)    return fail('no-comp');
  if (!settings) return fail('no-settings');

  var rates = settings.rates || {};
  var lines = [];

  NUMERIC_LINES.forEach(function (def) {
    var rate = num(rates[def.key]);
    if (rate === null)  { notConfigured.push(def.label); return; }
    if (rate <= 0)      { switchedOff.push(def.label);   return; }
    lines.push(numericLine(def, subject, comp, rate));
  });

  (function () {
    var table = settings[AGE_DEF.table];
    var state = tableState(table);
    if (state === 'unset') { notConfigured.push(AGE_DEF.label); return; }
    if (state === 'off')   { switchedOff.push(AGE_DEF.label);   return; }
    lines.push(ageLine(subject, comp, table));
  })();

  CATEGORY_LINES.forEach(function (def) {
    var table = settings[def.table];
    var state = tableState(table);
    if (state === 'unset') { notConfigured.push(def.label); return; }
    if (state === 'off')   { switchedOff.push(def.label);   return; }
    lines.push(categoryLine(def, subject, comp, table));
  });

  /* Settings are checked before price on purpose. When no factor is in use
     no comparable can compute, so "this one has no price" would be a true
     statement that sends the reader to the wrong place. */
  if (!lines.length) return fail('no-values');

  var basis = basisOf(comp);
  if (!basis.price) return fail('no-price');

  var computedTotal = 0, immaterialTotal = 0;
  var unavailable = [], immaterial = [];
  lines.forEach(function (l) {
    if (l.status === 'unavailable') { unavailable.push(l); return; }
    if (l.status === 'immaterial') {
      immaterial.push(l);
      if (l.wouldBe) immaterialTotal += l.wouldBe;
      return;
    }
    computedTotal += l.amount;
  });

  var override = null;
  var ov = num(comp.adjOverride);
  var reason = String(comp.adjReason || '').trim();
  /* An override of exactly zero is meaningful — "these differences cancel"
     — so it is accepted, unlike a blank. */
  if (ov !== null && String(comp.adjOverride).trim() !== '') {
    override = { amount: Math.round(ov), reason: reason };
  }

  var appliedTotal = override ? override.amount : computedTotal;

  return {
    ok: true,
    basis: basis.kind,
    basisPrice: Math.round(basis.price),
    basisLabel: basis.label,
    lines: lines,
    computedTotal: Math.round(computedTotal),
    unavailable: unavailable,
    /* Below materiality. Excluded from the total and from the "could not be
       applied" count — they were applied, and came to nothing worth
       adjusting. immaterialTotal is what they would have summed to, for the
       editor, so small differences all pointing one way stay visible. */
    immaterial: immaterial,
    immaterialTotal: Math.round(immaterialTotal),
    notConfigured: notConfigured,
    switchedOff: switchedOff,
    override: override,
    appliedTotal: appliedTotal,
    adjustedPrice: Math.round(basis.price + appliedTotal)
  };
}

/* A single sentence naming what did not run, for the collapsed summary and
   for the editor. Returns '' when everything applied. */
function unavailableSummary(result) {
  if (!result || !result.ok || !result.unavailable.length) return '';
  var n = result.unavailable.length;
  return n + ' factor' + (n === 1 ? '' : 's') + ' could not be applied';
}

root.SphereAdjustments = {
  compute: compute,
  unavailableSummary: unavailableSummary,
  money: money,
  signed: signed,
  basisOf: basisOf,
  GARAGE_KEY_BY_LABEL: GARAGE_KEY_BY_LABEL,
  BASEMENT_LABEL: BASEMENT_LABEL,
  NUMERIC_LINES: NUMERIC_LINES,
  CATEGORY_LINES: CATEGORY_LINES,
  AGE_BANDS: AGE_BANDS,
  MATERIALITY: MATERIALITY,
  bandRange: bandRange,
  valuationYearOf: valuationYearOf
};

})(window);
