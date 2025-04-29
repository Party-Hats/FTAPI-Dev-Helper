if (typeof browser === "undefined") {
  var browser = chrome;
}

browser.runtime.onInstalled.addListener((details) => {
  checkSetupStatus();
});

browser.runtime.onStartup.addListener(() => {
  checkSetupStatus();
});

function checkSetupStatus() {
  browser.storage.local.get(["setupCompleted", "jenkinsUrl"], (items) => {
    if (!items.setupCompleted || !items.jenkinsUrl) {
      browser.tabs.create({
        url: browser.runtime.getURL("install/install.html")
      });
    }
  });
}

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
