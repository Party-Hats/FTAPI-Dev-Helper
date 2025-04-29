// background.js
// We inline the polyfill code at the top for MV3 service worker convenience:
// (Alternatively, you can do importScripts("shared/polyfill.js") if allowed, or use modules.)
if (typeof browser === "undefined") {
  var browser = chrome;
}

// Intercept net::ERR_CONNECTION_REFUSED to show custom error page
browser.webNavigation.onErrorOccurred.addListener((details) => {
  // We'll check storage to see if user wants to enable the custom error page
  browser.storage.local.get(["errorPageEnabled"], (items) => {
    const isEnabled = items.errorPageEnabled !== false;

    // Check if the URL is from any ftapi.com domain
    const isFtapiDomain = details.url.match(/^https:\/\/[^\/]*\.ftapi\.com/);

    if (
        isEnabled &&
        details.error === "net::ERR_CONNECTION_REFUSED" &&
        isFtapiDomain
    ) {
      browser.tabs.update(details.tabId, {
        url: browser.runtime.getURL("SecuTransferErrorPage/errorPage.html")
            + "?originalUrl="
            + encodeURIComponent(details.url)
      });
    }
  });
});
