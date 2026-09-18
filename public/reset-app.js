(async function resetWireless() {
  var status = document.getElementById('reset-status');
  try {
    if ('serviceWorker' in navigator) {
      var registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(function (registration) {
        return registration.unregister();
      }));
    }
    if ('caches' in window) {
      var cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(function (cacheName) {
        return caches.delete(cacheName);
      }));
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.replace('/signin?recovered=' + Date.now());
  } catch (error) {
    if (status) status.textContent = 'Reset failed. Close Safari completely, reopen it, and try this page again.';
    console.error('[reset-app]', error);
  }
})();
