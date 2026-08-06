// Restores the deep link a hard 404 refresh would otherwise lose — see
// public/404.html, which stashes the intended path in sessionStorage
// before falling back to index.html. Externalized from index.html so a
// strict script-src CSP doesn't need an 'unsafe-inline' carve-out for it.
(function () {
  var redirect = sessionStorage.redirect;
  delete sessionStorage.redirect;
  if (redirect && redirect !== location.href) {
    history.replaceState(null, null, redirect);
  }
})();
