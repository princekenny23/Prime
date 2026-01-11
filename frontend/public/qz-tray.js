// @ts-nocheck
// Fallback loader: dynamically load qz-tray from CDN when this file is requested.
(function () {
  try {
    var s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.5/qz-tray.js'
    s.async = true
    document.head.appendChild(s)
  } catch (e) {
    // If running in a non-browser environment, do nothing
    /* no-op */
  }
})();
