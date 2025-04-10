chrome.webNavigation.onErrorOccurred.addListener((details) => {
  // Check the "errorPageEnabled" setting from storage
  chrome.storage.local.get(["errorPageEnabled"], (items) => {
    const isEnabled = items.errorPageEnabled !== false;

    if (
        isEnabled &&
        details.error === "net::ERR_CONNECTION_REFUSED" &&
        details.url.startsWith("https://testing.ftapi.com:8443")
    ) {
      chrome.tabs.update(details.tabId, {
        url: chrome.runtime.getURL(
                "SecuTransferErrorPage/errorPage.html"
            ) +
            "?originalUrl=" +
            encodeURIComponent(details.url)
      });
    }
  });
});
