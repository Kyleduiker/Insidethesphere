/**
 * Inside The Sphere — Comparable adjustments
 *
 * Pure computation. Reads no page state, touches no globals, makes no
 * network calls. Takes a subject, a comp and an agent's settings document
 * and returns the lines to render.
 *
 * Loaded by BOTH cma/edit.html and cma/client/index.html. One copy on
 * purpose: the client net sheet and the editor's recalcNet() were once two
 * implementations of the same arithmetic and they disagreed, in front of a
 * seller, in the direction that overstated their proceeds. Adjusted prices
 * are the same class of number.
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
   These MUST track the <select> options in cma/edit.html. Basement keys are
   already stored as keys and match one to one. Garage is stored as the
   option's display string, so it needs a lookup — and mapGarage() in the
   Matrix parser can emit strings that are in neither list ('3 car',
   '1 car detached', 'Garage'). Those resolve to null and render as
   unavailable, which is the whole point of this file. */

/* Full noun phrases, not adjectives. These are dropped straight into a
   sentence a seller reads. */
var BASEMENT_LABEL = {
  finished:   'a finished basement',
  partial:    'a partially finished basement',
  unfinished: 'an unfinished basement',
  none:       'no basement'
};

var GARAGE_KEY_BY_LABEL = {
  'no garage':      'none',
  '1 car attached': 'att1',
  '2 car attached': 'att2',
  '2 car detached': 'det2',
  '3 car attached': 'att3'
};

var GARAGE_LABEL = {
  none: 'no garage',
  att1: 'a single attached garage',
  att2: 'a double attached garage',
  det2: 'a double detached garage',
  att3: 'a triple attached garage'
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

/* `subj` and `comp` differ for age: the subject form calls it yearBuilt and
   a comp calls it year. Same fact, two field names. */
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
    one: 'sq.ft.', many: 'sq.ft.' },
  { key: 'perLotSqft', label: 'Lot size',
    subj: 'lotSize', comp: 'lotSize',
    one: 'sq.ft. of lot', many: 'sq.ft. of lot' },
  { key: 'perYear', label: 'Age',
    subj: 'yearBuilt', comp: 'year', age: true,
    one: 'year', many: 'years' }
];

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

  var mag = Math.abs(diff);
  var detail;
  if (def.age) {
    /* diff = subjectYear - compYear. Positive means the subject is newer,
       so the comp is older and is adjusted up toward it. */
    detail = 'Built ' + mag + ' ' + plural(mag, def.one, def.many) + ' ' +
             (diff > 0 ? 'earlier' : 'later') + ' than your home.';
  } else {
    detail = 'Has ' + mag.toLocaleString() + ' ' + (diff > 0 ? 'fewer' : 'more') +
             ' ' + plural(mag, def.one, def.many) + ' than your home.';
  }

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

  var computedTotal = 0;
  var unavailable = [];
  lines.forEach(function (l) {
    if (l.status === 'unavailable') unavailable.push(l);
    else computedTotal += l.amount;
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
  CATEGORY_LINES: CATEGORY_LINES
};

})(window);
