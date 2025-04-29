// Ensure browser API is available
if (typeof browser === "undefined") {
  var browser = chrome;
}

// Function to update the UI with config values
function updateConfigValues() {
  const jenkinsUrlValue = document.getElementById("jenkins-url-value");
  const mappingsValue = document.getElementById("mappings-value");
  const allConfigValue = document.getElementById("all-config-value");

  // Make sure elements exist before trying to update them
  if (jenkinsUrlValue && mappingsValue && allConfigValue) {
    try {
      // Set a timeout to handle the case where the storage API doesn't respond
      const timeoutId = setTimeout(function() {
        console.warn("Storage retrieval timed out - using fallback values");
        jenkinsUrlValue.textContent = "Storage API timeout - check extension permissions";
        mappingsValue.textContent = "Storage API timeout - check extension permissions";
        allConfigValue.textContent = "Storage API timeout - check extension permissions";
      }, 2000); // 2 second timeout

      // Load and display the configuration values
      browser.storage.local.get([
        "jenkinsUrl", 
        "ghRepoMappings", 
        "errorPageEnabled", 
        "autoReloadEnabled", 
        "errorPageDarkMode", 
        "githubButtonEnabled", 
        "passwordSaverEnabled"
      ], function(localItems) {
        // Get sync storage items
        browser.storage.sync.get(["passwordSaverDarkMode"], function(syncItems) {
          // Clear the timeout since we got a response
          clearTimeout(timeoutId);

          console.log("Retrieved local storage items:", localItems);
          console.log("Retrieved sync storage items:", syncItems);

          // Update Jenkins URL
          if (localItems && localItems.jenkinsUrl !== undefined) {
            jenkinsUrlValue.textContent = localItems.jenkinsUrl || "Not set";
          } else {
            jenkinsUrlValue.textContent = "Not set";
          }

          // Update GitHub → Jenkins Mappings
          if (localItems && localItems.ghRepoMappings !== undefined) {
            if (Array.isArray(localItems.ghRepoMappings)) {
              mappingsValue.textContent = JSON.stringify(localItems.ghRepoMappings, null, 2);
            } else {
              mappingsValue.textContent = "[]";
            }
          } else {
            mappingsValue.textContent = "[]";
          }

          // Create a complete config object
          const allConfig = {
            // Local storage items
            jenkinsUrl: localItems.jenkinsUrl || "",
            ghRepoMappings: Array.isArray(localItems.ghRepoMappings) ? localItems.ghRepoMappings : [],
            errorPageEnabled: localItems.errorPageEnabled !== false, // Default to true
            autoReloadEnabled: !!localItems.autoReloadEnabled, // Default to false
            errorPageDarkMode: !!localItems.errorPageDarkMode, // Default to false
            githubButtonEnabled: localItems.githubButtonEnabled !== false, // Default to true
            passwordSaverEnabled: localItems.passwordSaverEnabled !== false, // Default to true

            // Sync storage items
            passwordSaverDarkMode: !!syncItems.passwordSaverDarkMode // Default to false
          };

          // Update All Configuration Values
          allConfigValue.textContent = JSON.stringify(allConfig, null, 2);
        });
      });
    } catch (error) {
      console.error("Error accessing storage:", error);
      jenkinsUrlValue.textContent = "Error loading value: " + error.message;
      mappingsValue.textContent = "Error loading value: " + error.message;
      allConfigValue.textContent = "Error loading value: " + error.message;
    }
  }
}

// Function to copy text to clipboard
function copyToClipboard(text) {
  // Create a temporary textarea element
  const textarea = document.createElement('textarea');
  textarea.value = text;

  // Make the textarea out of viewport
  textarea.style.position = 'fixed';
  textarea.style.left = '-999999px';
  textarea.style.top = '-999999px';

  document.body.appendChild(textarea);
  textarea.select();

  // Execute the copy command
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }

  // Remove the temporary element
  document.body.removeChild(textarea);

  return success;
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
  // Update config values
  updateConfigValues();

  // Add event listener for the mappings copy button
  const copyMappingsButton = document.getElementById('copy-mappings-button');
  if (copyMappingsButton) {
    copyMappingsButton.addEventListener('click', function() {
      const mappingsValue = document.getElementById('mappings-value');
      if (mappingsValue) {
        const success = copyToClipboard(mappingsValue.textContent);

        // Provide feedback to the user
        if (success) {
          const originalText = copyMappingsButton.textContent;
          copyMappingsButton.textContent = 'Copied!';

          // Reset button text after 2 seconds
          setTimeout(function() {
            copyMappingsButton.textContent = originalText;
          }, 2000);
        } else {
          copyMappingsButton.textContent = 'Failed to copy';

          // Reset button text after 2 seconds
          setTimeout(function() {
            copyMappingsButton.textContent = 'Copy to Clipboard';
          }, 2000);
        }
      }
    });
  }

  // Add event listener for the Jenkins URL copy button
  const copyJenkinsUrlButton = document.getElementById('copy-jenkins-url-button');
  if (copyJenkinsUrlButton) {
    copyJenkinsUrlButton.addEventListener('click', function() {
      const jenkinsUrlValue = document.getElementById('jenkins-url-value');
      if (jenkinsUrlValue) {
        const success = copyToClipboard(jenkinsUrlValue.textContent);

        // Provide feedback to the user
        if (success) {
          const originalText = copyJenkinsUrlButton.textContent;
          copyJenkinsUrlButton.textContent = 'Copied!';

          // Reset button text after 2 seconds
          setTimeout(function() {
            copyJenkinsUrlButton.textContent = originalText;
          }, 2000);
        } else {
          copyJenkinsUrlButton.textContent = 'Failed to copy';

          // Reset button text after 2 seconds
          setTimeout(function() {
            copyJenkinsUrlButton.textContent = 'Copy to Clipboard';
          }, 2000);
        }
      }
    });
  }

  // Add event listener for the All Config copy button
  const copyAllConfigButton = document.getElementById('copy-all-config-button');
  if (copyAllConfigButton) {
    copyAllConfigButton.addEventListener('click', function() {
      const allConfigValue = document.getElementById('all-config-value');
      if (allConfigValue) {
        const success = copyToClipboard(allConfigValue.textContent);

        // Provide feedback to the user
        if (success) {
          const originalText = copyAllConfigButton.textContent;
          copyAllConfigButton.textContent = 'Copied!';

          // Reset button text after 2 seconds
          setTimeout(function() {
            copyAllConfigButton.textContent = originalText;
          }, 2000);
        } else {
          copyAllConfigButton.textContent = 'Failed to copy';

          // Reset button text after 2 seconds
          setTimeout(function() {
            copyAllConfigButton.textContent = 'Copy to Clipboard';
          }, 2000);
        }
      }
    });
  }
});
