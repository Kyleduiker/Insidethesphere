/**
 * Inside The Sphere — CMA cleanup
 *
 * Taking a client page down, deleting a CMA, and deleting everything an
 * account owns. One copy, loaded by cma/index.html (delete), cma/edit.html
 * (unpublish) and profile.html (account deletion).
 *
 * Why this exists: deleteCMA() used to delete the CMA document and nothing
 * else. The published copy on public_cmas stayed live at its link — carrying,
 * at the time, the seller's email and the agent's private notes about them —
 * along with the comps subcollection (Firestore never deletes subcollections
 * with their parent) and every photo and MLS sheet in Storage. Eleven orphaned
 * client pages were found this way on Sep 16, 2026.
 *
 * ── Order, and why ────────────────────────────────────────────────────────
 *
 *   1. client page     the public leak, so it goes first
 *   2. files           read from the comps BEFORE the comps are deleted
 *   3. comps
 *   4. CMA document    last
 *
 * Files come before comps because the comp documents are the only record of
 * which photo and sheet belong to them. Deleting comps first would leave a
 * Storage failure unrecoverable on retry. The CMA document goes last so that
 * any failure leaves the CMA visible in the list and the delete can simply be
 * run again — deleting it first is exactly how the orphans were made.
 *
 * Every step treats "already gone" as success, so a retry is always safe.
 * The first real failure stops the cascade and throws an error carrying
 * `step`, a plain-English name for what was being done.
 *
 * ── Storage without list permission ───────────────────────────────────────
 *
 * The Storage rules are not in the repo. Files are deleted by the exact
 * references stored on the CMA and its comps, which needs only delete
 * permission. A folder sweep then catches files nothing references any more
 * (a comp deleted on its own leaves its photo and sheet behind). The sweep
 * needs list permission; if the rules refuse it, that is reported in the
 * result rather than failing the delete.
 *
 * Requires the `db` and `storage` globals from js/firebase-config.js, and the
 * Storage compat SDK on the page.
 */

(function (root) {
'use strict';

function stepError(step, cause) {
  const detail = (cause && (cause.code || cause.message)) || String(cause);
  const err = new Error(step + ' — ' + detail);
  err.step = step;
  err.code = cause && cause.code;
  err.cause = cause;
  return err;
}

function cmaRef(uid, cmaId) {
  return db.collection('users').doc(uid).collection('cmas').doc(cmaId);
}

function storageApi() {
  return (typeof storage !== 'undefined' && storage) ? storage : null;
}

function folders(uid, cmaId) {
  return ['users/' + uid + '/cma-photos/' + cmaId + '/',
          'users/' + uid + '/cma-sheets/' + cmaId + '/'];
}

/* Never delete a file outside this CMA's own two folders, whatever a stored
   URL happens to point at. */
function insideCmaFolders(fullPath, uid, cmaId) {
  return folders(uid, cmaId).some(function (f) { return fullPath.indexOf(f) === 0; });
}

/* refFromURL() throws for anything that is not a Firebase Storage URL — a
   Matrix media link pasted into the photo field, say. That file is not ours
   to delete, so it is classified as "not ours", not treated as a failure. */
function refForUrl(st, url) {
  try { return st.refFromURL(url); } catch (e) { return null; }
}

function deleteFile(ref) {
  return ref.delete().then(
    function () { return 'deleted'; },
    function (err) {
      if (err && err.code === 'storage/object-not-found') return 'already-gone';
      throw err;
    });
}

/* Best effort, and honest about it. A rules refusal is reported, not thrown:
   the files that matter were already deleted by reference. Any other error is
   a real failure and stops the cascade. */
async function sweepFolder(st, path) {
  let listing;
  try {
    listing = await st.ref(path).listAll();
  } catch (err) {
    if (err && err.code === 'storage/unauthorized') {
      return { folder: path, swept: false, reason: 'not-permitted' };
    }
    throw err;
  }
  let deleted = 0;
  for (const item of listing.items) {
    if ((await deleteFile(item)) === 'deleted') deleted++;
  }
  for (const prefix of listing.prefixes) {
    const sub = await sweepFolder(st, prefix.fullPath + '/');
    if (sub.swept) deleted += sub.deleted;
  }
  return { folder: path, swept: true, deleted: deleted };
}

/* Deletes files named by exact path or download URL, then sweeps both
   folders. `sources` is a list of strings: Storage paths or download URLs. */
async function deleteFiles(uid, cmaId, sources, report) {
  const st = storageApi();
  if (!st) throw new Error('Firebase Storage is not loaded on this page');

  const seen = {};
  for (const src of sources) {
    if (!src) continue;
    const ref = /^https?:|^gs:/i.test(src) ? refForUrl(st, src) : st.ref(src);
    if (!ref || seen[ref.fullPath] || !insideCmaFolders(ref.fullPath, uid, cmaId)) continue;
    seen[ref.fullPath] = true;
    if ((await deleteFile(ref)) === 'deleted') report.filesDeleted++;
    else report.filesAlreadyGone++;
  }
  for (const f of folders(uid, cmaId)) {
    const s = await sweepFolder(st, f);
    report.sweep.push(s);
    if (s.swept) report.filesDeleted += s.deleted;
  }
}

/**
 * unpublish(uid, cmaId, slug)
 *
 * Deletes public_cmas/{slug} — but only if it exists, belongs to this agent,
 * and belongs to THIS CMA. A slug is an address plus five random digits, so
 * two CMAs for the same address could in principle collide; a mismatch is
 * reported and nothing is touched.
 *
 * Resolves { result: 'deleted' | 'already-gone' | 'no-slug' | 'not-this-cma' }.
 * Rejects with the underlying Firestore error if the read or delete fails.
 */
async function unpublish(uid, cmaId, slug) {
  if (!slug) return { result: 'no-slug' };
  const ref = db.collection('public_cmas').doc(slug);
  const snap = await ref.get();
  if (!snap.exists) return { result: 'already-gone' };
  const d = snap.data() || {};
  if (d.agentId !== uid || d.cmaId !== cmaId) return { result: 'not-this-cma' };
  await ref.delete();
  return { result: 'deleted' };
}

/**
 * deleteCma(uid, cmaId)
 *
 * The full cascade, in the order documented above. Throws an error with
 * `step` on the first failure, having deleted nothing after that step — the
 * CMA document is always last.
 */
async function deleteCma(uid, cmaId) {
  const report = { cmaId: cmaId, clientPage: null, filesDeleted: 0,
                   filesAlreadyGone: 0, sweep: [], comps: 0 };

  let cmaSnap;
  try { cmaSnap = await cmaRef(uid, cmaId).get(); }
  catch (err) { throw stepError('reading the CMA', err); }
  const cma = cmaSnap.exists ? (cmaSnap.data() || {}) : {};

  // 1. Client page
  try { report.clientPage = (await unpublish(uid, cmaId, cma.slug)).result; }
  catch (err) { throw stepError('taking the client page offline', err); }

  // 2. Files — read from the comps while the comps still exist
  let compSnap;
  try { compSnap = await cmaRef(uid, cmaId).collection('comps').get(); }
  catch (err) { throw stepError('reading the comparables', err); }

  try {
    const sources = [cma.propPhotoPath];
    compSnap.forEach(function (d) {
      const c = d.data() || {};
      sources.push(c.photoUrl, c.sheetUrl);
    });
    await deleteFiles(uid, cmaId, sources, report);
  } catch (err) { throw stepError('deleting photos and MLS sheets', err); }

  // 3. Comps — in batches, well under Firestore's 500-write limit
  try {
    const docs = compSnap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch();
      docs.slice(i, i + 400).forEach(function (d) { batch.delete(d.ref); });
      await batch.commit();
    }
    report.comps = docs.length;
  } catch (err) { throw stepError('deleting the comparables', err); }

  // 4. The CMA document, last
  try { if (cmaSnap.exists) await cmaRef(uid, cmaId).delete(); }
  catch (err) { throw stepError('deleting the CMA itself', err); }

  return report;
}

/**
 * deleteAllCmas(uid, onProgress)
 *
 * Every CMA the account owns, one full cascade each, stopping at the first
 * failure. Then any client page still published under this agent — pages
 * orphaned before the cascade existed — with its files.
 *
 * Must run while the user is still signed in: every step needs auth.
 */
async function deleteAllCmas(uid, onProgress) {
  // No orderBy. The CMA list orders by updatedAt, and Firestore silently
  // omits documents lacking that field; a delete-everything pass cannot.
  let list;
  try { list = await db.collection('users').doc(uid).collection('cmas').get(); }
  catch (err) { throw stepError('listing your CMAs', err); }

  const reports = [];
  let i = 0;
  for (const d of list.docs) {
    i++;
    if (onProgress) onProgress(i, list.size);
    reports.push(await deleteCma(uid, d.id));
  }

  // With every CMA gone, any page still published under this agent is an
  // orphan by definition.
  let pages;
  try { pages = await db.collection('public_cmas').where('agentId', '==', uid).get(); }
  catch (err) { throw stepError('finding leftover client pages', err); }

  let orphanPages = 0;
  for (const p of pages.docs) {
    const x = p.data() || {};
    if (x.cmaId) {
      const orphanReport = { filesDeleted: 0, filesAlreadyGone: 0, sweep: [] };
      const sources = [x.propPhotoUrl];
      (x.comps || []).forEach(function (c) { sources.push(c.photoUrl, c.sheetUrl); });
      try { await deleteFiles(uid, x.cmaId, sources, orphanReport); }
      catch (err) { throw stepError('deleting files for leftover client page ' + p.id, err); }
      reports.push(Object.assign({ cmaId: x.cmaId, orphan: true }, orphanReport));
    }
    try { await p.ref.delete(); orphanPages++; }
    catch (err) { throw stepError('deleting leftover client page ' + p.id, err); }
  }

  return { cmas: list.size, orphanPages: orphanPages, reports: reports };
}

/* True when any cascade in `reports` could not sweep a folder because the
   Storage rules refused to list it. */
function sweepRefused(reports) {
  return [].concat(reports).some(function (r) {
    return r && (r.sweep || []).some(function (s) { return !s.swept; });
  });
}

root.SphereCmaCleanup = {
  unpublish: unpublish,
  deleteCma: deleteCma,
  deleteAllCmas: deleteAllCmas,
  sweepRefused: sweepRefused
};

})(window);
