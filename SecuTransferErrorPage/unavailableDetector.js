// Content script to detect "This service is currently unavailable" text
// and redirect to the error page

// Ensure browser polyfill is available
if (typeof browser === "undefined") {
  var browser = chrome;
}

// Function to check if the page contains the unavailable service text
function checkForUnavailableService() {
  // Check if the page contains the text "This service is currently unavailable"
  if (document.body && document.body.innerText.includes("This service is currently unavailable")) {
    // Check if the error page is enabled in settings
    browser.storage.local.get(["errorPageEnabled"], (items) => {
      const isEnabled = items.errorPageEnabled !== false;
      
      if (isEnabled) {
        // Redirect to the error page with the current URL as the originalUrl parameter
        const errorPageUrl = browser.runtime.getURL("SecuTransferErrorPage/errorPage.html") + 
                            "?originalUrl=" + 
                            encodeURIComponent(window.location.href);
        
        window.location.href = errorPageUrl;
      }
    });
  }
}

// Run the check when the page loads
// Use a small delay to ensure the page content is fully loaded
setTimeout(checkForUnavailableService, 500);