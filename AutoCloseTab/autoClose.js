// Auto-close tabs background script
if (typeof browser === "undefined") {
  var browser = chrome;
}

// Default delay in milliseconds before closing the tab (5 seconds)
const DEFAULT_CLOSE_DELAY = 5000;

// Listen for tab updates
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only proceed if the tab has completed loading
  if (changeInfo.status === 'complete' && tab.url) {
    // Get the auto-close URLs from storage
    browser.storage.local.get(['autoCloseEnabled', 'autoCloseUrls', 'autoCloseDelay'], (items) => {
      // Check if the feature is enabled
      if (items.autoCloseEnabled === false) {
        return;
      }

      // Get the auto-close URLs (default to empty array if not set)
      const autoCloseUrls = items.autoCloseUrls || [];
      
      // Get the delay (default to 5 seconds if not set)
      const delay = items.autoCloseDelay || DEFAULT_CLOSE_DELAY;

      // Check if the tab URL matches any of the auto-close URLs
      const shouldClose = autoCloseUrls.some(urlPattern => {
        try {
          // Create a RegExp from the pattern
          const regex = new RegExp(urlPattern);
          return regex.test(tab.url);
        } catch (e) {
          // If the pattern is invalid, try a simple string match
          return tab.url.includes(urlPattern);
        }
      });

      // If the URL should be auto-closed, set a timer to close it
      if (shouldClose) {
        console.log(`Auto-closing tab with URL ${tab.url} after ${delay}ms`);
        
        // Set a timer to close the tab
        setTimeout(() => {
          browser.tabs.remove(tabId);
        }, delay);
      }
    });
  }
});