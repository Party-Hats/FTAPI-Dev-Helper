/**
 * Installation script for the FTAPI Dev Helper extension
 * Handles setup of extension configuration
 */

// Import utility functions from shared/utils.js
// These functions are already available in the global scope

/**
 * Validates the imported JSON configuration
 * @param {Object} config - The configuration object to validate
 * @returns {boolean} True if the configuration is valid
 * @throws {Error} If the configuration is invalid
 */
function validateConfigJson(config) {
  if (typeof config !== 'object' || config === null) {
    throw new Error("Configuration must be a valid JSON object");
  }

  if (config.jenkinsUrl !== undefined && typeof config.jenkinsUrl !== 'string') {
    throw new Error("jenkinsUrl must be a string");
  }

  if (config.ghRepoMappings !== undefined) {
    if (!Array.isArray(config.ghRepoMappings)) {
      throw new Error("ghRepoMappings must be an array");
    }

    config.ghRepoMappings.forEach((mapping, index) => {
      if (!mapping.repo) {
        throw new Error(`Mapping at index ${index} must have a 'repo' property`);
      }
      if (!Array.isArray(mapping.jobs)) {
        throw new Error(`Mapping at index ${index} must have a 'jobs' array`);
      }
    });
  }

  if (config.autoCloseUrls !== undefined) {
    if (!Array.isArray(config.autoCloseUrls)) {
      throw new Error("autoCloseUrls must be an array");
    }

    config.autoCloseUrls.forEach((pattern, index) => {
      if (typeof pattern !== 'string') {
        throw new Error(`URL pattern at index ${index} must be a string`);
      }
    });
  }

  if (config.autoCloseDelay !== undefined) {
    if (typeof config.autoCloseDelay !== 'number' || config.autoCloseDelay < 0) {
      throw new Error("autoCloseDelay must be a positive number");
    }
  }

  const booleanProps = [
    'errorPageEnabled', 
    'autoReloadEnabled', 
    'errorPageDarkMode', 
    'githubButtonEnabled', 
    'passwordSaverEnabled',
    'passwordSaverDarkMode',
    'autoCloseEnabled'
  ];

  booleanProps.forEach(prop => {
    if (config[prop] !== undefined && typeof config[prop] !== 'boolean') {
      throw new Error(`${prop} must be a boolean value`);
    }
  });

  return true;
}

/**
 * Initialize the installation page when the DOM is loaded
 */
document.addEventListener("DOMContentLoaded", () => {
  const setupForm = document.getElementById("setupForm");
  const jenkinsUrlInput = document.getElementById("jenkinsUrl");
  const jenkinsMappingsInput = document.getElementById("jenkinsMappings");
  const autoCloseUrlsInput = document.getElementById("autoCloseUrls");
  const autoCloseDelayInput = document.getElementById("autoCloseDelay");
  const errorMessage = document.getElementById("errorMessage");

  // Modal elements
  const importJsonButton = document.getElementById("importJsonButton");
  const importJsonModal = document.getElementById("importJsonModal");
  const importJsonText = document.getElementById("importJsonText");
  const confirmImportButton = document.getElementById("confirmImportButton");
  const cancelImportButton = document.getElementById("cancelImportButton");
  const closeModalButton = document.querySelector(".close");
  const modalErrorMessage = document.getElementById("modalErrorMessage");

  // Load existing configuration values
  browser.storage.local.get(["jenkinsUrl", "ghRepoMappings", "autoCloseUrls", "autoCloseDelay", "autoCloseEnabled"], (items) => {
    if (items.jenkinsUrl) {
      jenkinsUrlInput.value = items.jenkinsUrl;
    }

    if (items.ghRepoMappings && Array.isArray(items.ghRepoMappings) && items.ghRepoMappings.length > 0) {
      jenkinsMappingsInput.value = JSON.stringify(items.ghRepoMappings, null, 2);
    }

    if (items.autoCloseUrls && Array.isArray(items.autoCloseUrls) && items.autoCloseUrls.length > 0) {
      autoCloseUrlsInput.value = JSON.stringify(items.autoCloseUrls, null, 2);
    }

    if (items.autoCloseDelay) {
      autoCloseDelayInput.value = items.autoCloseDelay;
    }
  });

  // Set up modal event listeners
  importJsonButton.addEventListener("click", () => {
    importJsonModal.style.display = "block";
    importJsonText.value = "";
    modalErrorMessage.textContent = "";
  });

  closeModalButton.addEventListener("click", () => {
    importJsonModal.style.display = "none";
  });

  cancelImportButton.addEventListener("click", () => {
    importJsonModal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === importJsonModal) {
      importJsonModal.style.display = "none";
    }
  });

  /**
   * Handle JSON configuration import
   */
  confirmImportButton.addEventListener("click", () => {
    modalErrorMessage.textContent = "";

    if (!importJsonText.value.trim()) {
      modalErrorMessage.textContent = "Please enter a JSON configuration";
      return;
    }

    try {
      const preprocessedJson = preprocessJson(importJsonText.value);
      const config = JSON.parse(preprocessedJson);
      validateConfigJson(config);

      // Update visible form fields
      if (config.jenkinsUrl !== undefined) {
        jenkinsUrlInput.value = config.jenkinsUrl;
      }

      if (config.ghRepoMappings !== undefined) {
        jenkinsMappingsInput.value = JSON.stringify(config.ghRepoMappings, null, 2);
      }

      if (config.autoCloseUrls !== undefined) {
        autoCloseUrlsInput.value = JSON.stringify(config.autoCloseUrls, null, 2);
      }

      if (config.autoCloseDelay !== undefined) {
        autoCloseDelayInput.value = config.autoCloseDelay;
      }

      // Save non-visible config values directly to storage
      const nonVisibleConfigValues = {};
      const nonVisibleProps = [
        'errorPageEnabled',
        'autoReloadEnabled',
        'errorPageDarkMode',
        'githubButtonEnabled',
        'passwordSaverEnabled',
        'autoCloseEnabled'
      ];

      nonVisibleProps.forEach(prop => {
        if (config[prop] !== undefined) {
          nonVisibleConfigValues[prop] = config[prop];
        }
      });

      if (Object.keys(nonVisibleConfigValues).length > 0) {
        browser.storage.local.set(nonVisibleConfigValues);
      }

      // Handle sync storage settings
      if (config.passwordSaverDarkMode !== undefined) {
        browser.storage.sync.set({ passwordSaverDarkMode: config.passwordSaverDarkMode });
      }

      importJsonModal.style.display = "none";
    } catch (error) {
      modalErrorMessage.textContent = `Invalid JSON configuration: ${error.message}`;
    }
  });

  /**
   * Handle form submission and save configuration
   */
  setupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorMessage.textContent = "";

    const jenkinsUrl = sanitizeJenkinsUrl(jenkinsUrlInput.value);
    let jenkinsMappings = [];
    let autoCloseUrls = [];
    let autoCloseDelay = parseInt(autoCloseDelayInput.value) || 5000;

    if (!jenkinsUrl) {
      errorMessage.textContent = "Jenkins URL is required.";
      return;
    }

    // Validate and parse Jenkins mappings
    if (jenkinsMappingsInput.value.trim()) {
      try {
        const preprocessedJson = preprocessJson(jenkinsMappingsInput.value);
        jenkinsMappings = JSON.parse(preprocessedJson);

        if (!Array.isArray(jenkinsMappings)) {
          throw new Error("Jenkins mappings must be an array.");
        }

        jenkinsMappings.forEach(mapping => {
          if (!mapping.repo) {
            throw new Error("Each mapping must have a 'repo' property.");
          }
          if (!Array.isArray(mapping.jobs)) {
            throw new Error("Each mapping must have a 'jobs' array.");
          }
        });
      } catch (error) {
        errorMessage.textContent = `Invalid JSON format for Jenkins mappings: ${error.message}`;
        return;
      }
    }

    // Validate and parse auto-close URLs
    if (autoCloseUrlsInput.value.trim()) {
      try {
        const preprocessedJson = preprocessJson(autoCloseUrlsInput.value);
        autoCloseUrls = JSON.parse(preprocessedJson);

        if (!Array.isArray(autoCloseUrls)) {
          throw new Error("Auto-close URLs must be an array.");
        }

        autoCloseUrls.forEach((url, index) => {
          if (typeof url !== 'string') {
            throw new Error(`URL at index ${index} must be a string.`);
          }
        });
      } catch (error) {
        errorMessage.textContent = `Invalid JSON format for auto-close URLs: ${error.message}`;
        return;
      }
    }

    // Save configuration and close setup page
    browser.storage.local.set({
      jenkinsUrl: jenkinsUrl,
      ghRepoMappings: jenkinsMappings,
      autoCloseUrls: autoCloseUrls,
      autoCloseDelay: autoCloseDelay,
      autoCloseEnabled: true,
      setupCompleted: true
    }, () => {
      browser.tabs.getCurrent((tab) => {
        browser.tabs.remove(tab.id);
        browser.runtime.openOptionsPage();
      });
    });
  });
});
