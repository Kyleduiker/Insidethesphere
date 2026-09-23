/**
 * Inside The Sphere — client-page slug
 *
 * One generator, loaded by every page that creates a CMA. There were two
 * copies (cma/index.html, clients/view.html), both ending in a five-digit
 * Math.random() number — 90,000 candidates per known address, so anyone
 * who knew a seller's address could find their document for a few cents
 * of reads. public_cmas is world-readable; the slug is the only thing
 * standing between an address and the report.
 *
 * The address prefix stays: the link reads as prepared for that home. The
 * token after it is 12 characters from a 31-symbol alphabet, drawn from
 * crypto.getRandomValues — about 2^59 possibilities, not enumerable.
 * Lowercase, no symbols that look like other symbols, URL-safe as-is.
 */
(function (root) {
'use strict';

var ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // 31 symbols; no 0/o/1/l/i
var TOKEN_LENGTH = 12;

function randomToken() {
  var bytes = new Uint8Array(TOKEN_LENGTH);
  root.crypto.getRandomValues(bytes);
  var out = '';
  for (var i = 0; i < TOKEN_LENGTH; i++) {
    out += ALPHABET.charAt(bytes[i] % ALPHABET.length);
  }
  return out;
}

function generateSlug(address) {
  var addr = String(address || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, '').trim()
    .replace(/\s+/g, '-').slice(0, 40);
  return (addr ? addr + '-' : '') + randomToken();
}

root.SphereSlug = { generateSlug: generateSlug };

})(window);
