/* Version til A/B-test: ?v=a = nuværende struktur (valgtype først), ?v=b (standard) = opgavebaseret struktur.
   Valget huskes i fanen (sessionStorage), så det følger deltageren gennem hele testen. */
(function () {
  var v = null;
  try {
    v = new URLSearchParams(location.search).get('v');
    if (v === 'a' || v === 'b') sessionStorage.setItem('valgVer', v); else v = sessionStorage.getItem('valgVer');
  } catch (e) {}
  window.VVER = v === 'a' ? 'a' : 'b';
})();
