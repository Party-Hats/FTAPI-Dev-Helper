/**
 * Configuration values display script
 * Shows the complete configuration for the extension
 */

/**
 * Updates the UI with configuration values from storage
 */
function updateConfigValues() {
  const allConfigValue = document.getElementById("all-config-value");

  if (allConfigValue) {
    try {
      const timeoutId = setTimeout(function() {
        console.warn("Storage retrieval timed out - using fallback values");
        allConfigValue.textContent = "Storage API timeout - check extension permissions";
      }, 2000);

      browser.storage.local.get([
        "jenkinsUrl", 
        "ghRepoMappings", 
        "errorPageEnabled", 
        "autoReloadEnabled", 
        "errorPageDarkMode", 
        "githubButtonEnabled", 
        "passwordSaverEnabled",
        "autoCloseEnabled",
        "autoCloseDelay",
        "autoCloseUrls"
      ], function(localItems) {
        browser.storage.sync.get(["passwordSaverDarkMode"], function(syncItems) {
          clearTimeout(timeoutId);

          console.log("Retrieved local storage items:", localItems);
          console.log("Retrieved sync storage items:", syncItems);

          const allConfig = {
            // Local storage items
            jenkinsUrl: localItems.jenkinsUrl || "",
            ghRepoMappings: Array.isArray(localItems.ghRepoMappings) ? localItems.ghRepoMappings : [],
            errorPageEnabled: localItems.errorPageEnabled !== false, 
            autoReloadEnabled: !!localItems.autoReloadEnabled, 
            errorPageDarkMode: !!localItems.errorPageDarkMode, 
            githubButtonEnabled: localItems.githubButtonEnabled !== false, 
            passwordSaverEnabled: localItems.passwordSaverEnabled !== false, 

            // Auto-close tabs settings
            autoCloseEnabled: localItems.autoCloseEnabled !== false, 
            autoCloseDelay: localItems.autoCloseDelay || 5000, 
            autoCloseUrls: Array.isArray(localItems.autoCloseUrls) ? localItems.autoCloseUrls : [],

            // Sync storage items
            passwordSaverDarkMode: !!syncItems.passwordSaverDarkMode
          };

          allConfigValue.textContent = JSON.stringify(allConfig, null, 2);
        });
      });
    } catch (error) {
      console.error("Error accessing storage:", error);
      allConfigValue.textContent = "Error loading value: " + error.message;
    }
  }
}

/**
 * Copies text to clipboard using a temporary textarea element
 * @param {string} text - The text to copy
 * @returns {boolean} Whether the copy operation was successful
 */
function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-999999px';
  textarea.style.top = '-999999px';

  document.body.appendChild(textarea);
  textarea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }

  document.body.removeChild(textarea);
  return success;
}

/**
 * Initialize the page when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", function() {
  updateConfigValues();

  const copyAllConfigButton = document.getElementById('copy-all-config-button');
  if (copyAllConfigButton) {
    copyAllConfigButton.addEventListener('click', function() {
      const allConfigValue = document.getElementById('all-config-value');
      if (allConfigValue) {
        const success = copyToClipboard(allConfigValue.textContent);

        if (success) {
          const originalText = copyAllConfigButton.textContent;
          copyAllConfigButton.textContent = 'Copied!';

          setTimeout(function() {
            copyAllConfigButton.textContent = originalText;
          }, 2000);
        } else {
          copyAllConfigButton.textContent = 'Failed to copy';

          setTimeout(function() {
            copyAllConfigButton.textContent = 'Copy to Clipboard';
          }, 2000);
        }
      }
    });
  }
});
