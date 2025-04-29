/**
 * Auto-close tabs background script
 * Automatically closes tabs that match configured URL patterns after a delay
 */

// Default delay in milliseconds before closing the tab (5 seconds)
const DEFAULT_CLOSE_DELAY = 5000;

/**
 * Listens for tab updates and closes tabs that match configured URL patterns
 */
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    browser.storage.local.get(['autoCloseEnabled', 'autoCloseUrls', 'autoCloseDelay'], (items) => {
      if (items.autoCloseEnabled === false) {
        return;
      }

      const autoCloseUrls = items.autoCloseUrls || [];
      const delay = items.autoCloseDelay || DEFAULT_CLOSE_DELAY;

      const shouldClose = autoCloseUrls.some(urlPattern => {
        try {
          const regex = new RegExp(urlPattern);
          return regex.test(tab.url);
        } catch (e) {
          return tab.url.includes(urlPattern);
        }
      });

      if (shouldClose) {
        console.log(`Auto-closing tab with URL ${tab.url} after ${delay}ms`);
        setTimeout(() => {
          browser.tabs.remove(tabId);
        }, delay);
      }
    });
  }
});
