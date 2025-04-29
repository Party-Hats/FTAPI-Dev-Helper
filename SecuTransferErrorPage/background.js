/**
 * SecuTransfer Error Page background script
 * Handles installation, startup, and error detection
 */

// Check setup status on install and startup
browser.runtime.onInstalled.addListener(checkSetupStatus);
browser.runtime.onStartup.addListener(checkSetupStatus);

/**
 * Checks if the extension setup is completed and opens the install page if not
 */
function checkSetupStatus() {
  browser.storage.local.get(["setupCompleted", "jenkinsUrl"], (items) => {
    if (!items.setupCompleted || !items.jenkinsUrl) {
      browser.tabs.create({
        url: browser.runtime.getURL("install/install.html")
      });
    }
  });
}

/**
 * Listens for connection errors to FTAPI domains and shows a custom error page
 */
browser.webNavigation.onErrorOccurred.addListener((details) => {
  browser.storage.local.get(["errorPageEnabled"], (items) => {
    const isEnabled = items.errorPageEnabled !== false;
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
