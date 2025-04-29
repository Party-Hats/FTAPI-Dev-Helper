if (typeof browser === "undefined") {
  var browser = chrome;
}

function checkForUnavailableService() {
  if (document.body && document.body.innerText.includes("This service is currently unavailable")) {
    browser.storage.local.get(["errorPageEnabled"], (items) => {
      const isEnabled = items.errorPageEnabled !== false;

      if (isEnabled) {
        const errorPageUrl = browser.runtime.getURL("SecuTransferErrorPage/errorPage.html") + 
                            "?originalUrl=" + 
                            encodeURIComponent(window.location.href);

        window.location.href = errorPageUrl;
      }
    });
  }
}

setTimeout(checkForUnavailableService, 500);

[
  {
    repo: "Process-Client",
    jobs: [
      {
        name: "Build",
        urlPrefix: "https://ci.ftapi.dev/view/Process%20Client/job/Process-Client/view/change-requests/job/PR-"
      },
      {
        name: "E2E",
        urlPrefix: "https://ci.ftapi.dev/view/Process%20Client/job/Process%20Client%20E2E%20Tests/view/change-requests/job/PR-"
      }
    ]
  },
  {
    repo: "Server-Secutransfer",
    jobs: [
      {
        name: "Build",
        urlPrefix: "https://ci.ftapi.dev/job/SecuTransfer-PR/job/PR-"
      },
      {
        name: "WebUI E2E",
        urlPrefix: "https://ci.ftapi.dev/job/secutransfer-webui-e2e-branch-pipeline/job/PR-"
      }
    ]
  }
]