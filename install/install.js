if (typeof browser === "undefined") {
  var browser = chrome;
}

function sanitizeJenkinsUrl(url) {
  let sanitizedUrl = url.trim();

  while (sanitizedUrl.endsWith('/')) {
    sanitizedUrl = sanitizedUrl.slice(0, -1);
  }

  if (sanitizedUrl && !sanitizedUrl.match(/^https?:\/\//)) {
    sanitizedUrl = 'https://' + sanitizedUrl;
  }

  return sanitizedUrl;
}

function preprocessJson(jsonString) {
  let processed = jsonString.trim();

  processed = processed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  processed = processed.replace(/'([^'\\]*(\\.[^'\\]*)*?)'/g, '"$1"');

  try {
    JSON.parse(processed);
    return processed;
  } catch (e) {
    console.log("First preprocessing attempt failed, trying more aggressive approach");

    try {
      // eslint-disable-next-line no-eval
      const obj = eval('(' + jsonString + ')');
      return JSON.stringify(obj);
    } catch (evalError) {
      console.error("Failed to preprocess JSON:", evalError);
      return processed;
    }
  }
}

// Function to validate the imported JSON configuration
function validateConfigJson(config) {
  // Check if config is an object
  if (typeof config !== 'object' || config === null) {
    throw new Error("Configuration must be a valid JSON object");
  }

  // Validate Jenkins URL if present
  if (config.jenkinsUrl !== undefined && typeof config.jenkinsUrl !== 'string') {
    throw new Error("jenkinsUrl must be a string");
  }

  // Validate GitHub repo mappings if present
  if (config.ghRepoMappings !== undefined) {
    if (!Array.isArray(config.ghRepoMappings)) {
      throw new Error("ghRepoMappings must be an array");
    }

    // Validate each mapping
    config.ghRepoMappings.forEach((mapping, index) => {
      if (!mapping.repo) {
        throw new Error(`Mapping at index ${index} must have a 'repo' property`);
      }
      if (!Array.isArray(mapping.jobs)) {
        throw new Error(`Mapping at index ${index} must have a 'jobs' array`);
      }
    });
  }

  // Validate boolean values
  const booleanProps = [
    'errorPageEnabled', 
    'autoReloadEnabled', 
    'errorPageDarkMode', 
    'githubButtonEnabled', 
    'passwordSaverEnabled',
    'passwordSaverDarkMode'
  ];

  booleanProps.forEach(prop => {
    if (config[prop] !== undefined && typeof config[prop] !== 'boolean') {
      throw new Error(`${prop} must be a boolean value`);
    }
  });

  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  const setupForm = document.getElementById("setupForm");
  const jenkinsUrlInput = document.getElementById("jenkinsUrl");
  const jenkinsMappingsInput = document.getElementById("jenkinsMappings");
  const errorMessage = document.getElementById("errorMessage");

  // Modal elements
  const importJsonButton = document.getElementById("importJsonButton");
  const importJsonModal = document.getElementById("importJsonModal");
  const importJsonText = document.getElementById("importJsonText");
  const confirmImportButton = document.getElementById("confirmImportButton");
  const cancelImportButton = document.getElementById("cancelImportButton");
  const closeModalButton = document.querySelector(".close");
  const modalErrorMessage = document.getElementById("modalErrorMessage");

  // Load existing values
  browser.storage.local.get(["jenkinsUrl", "ghRepoMappings"], (items) => {
    if (items.jenkinsUrl) {
      jenkinsUrlInput.value = items.jenkinsUrl;
    }

    if (items.ghRepoMappings && Array.isArray(items.ghRepoMappings) && items.ghRepoMappings.length > 0) {
      jenkinsMappingsInput.value = JSON.stringify(items.ghRepoMappings, null, 2);
    }
  });

  // Open modal when Import from JSON button is clicked
  importJsonButton.addEventListener("click", () => {
    importJsonModal.style.display = "block";
    importJsonText.value = "";
    modalErrorMessage.textContent = "";
  });

  // Close modal when X is clicked
  closeModalButton.addEventListener("click", () => {
    importJsonModal.style.display = "none";
  });

  // Close modal when Cancel button is clicked
  cancelImportButton.addEventListener("click", () => {
    importJsonModal.style.display = "none";
  });

  // Close modal when clicking outside of it
  window.addEventListener("click", (event) => {
    if (event.target === importJsonModal) {
      importJsonModal.style.display = "none";
    }
  });

  // Handle import confirmation
  confirmImportButton.addEventListener("click", () => {
    modalErrorMessage.textContent = "";

    if (!importJsonText.value.trim()) {
      modalErrorMessage.textContent = "Please enter a JSON configuration";
      return;
    }

    try {
      // Preprocess and parse the JSON
      const preprocessedJson = preprocessJson(importJsonText.value);
      const config = JSON.parse(preprocessedJson);

      // Validate the configuration
      validateConfigJson(config);

      // Update form fields with imported values (visible on the install page)
      if (config.jenkinsUrl !== undefined) {
        jenkinsUrlInput.value = config.jenkinsUrl;
      }

      if (config.ghRepoMappings !== undefined) {
        jenkinsMappingsInput.value = JSON.stringify(config.ghRepoMappings, null, 2);
      }

      // Immediately save non-visible config values to storage
      const nonVisibleConfigValues = {};

      // List of all possible config values that are not visible on the install page
      const nonVisibleProps = [
        'errorPageEnabled',
        'autoReloadEnabled',
        'errorPageDarkMode',
        'githubButtonEnabled',
        'passwordSaverEnabled'
      ];

      // Add any non-visible config values from the imported JSON to the object to be saved
      nonVisibleProps.forEach(prop => {
        if (config[prop] !== undefined) {
          nonVisibleConfigValues[prop] = config[prop];
        }
      });

      // If there are any non-visible config values, save them immediately
      if (Object.keys(nonVisibleConfigValues).length > 0) {
        browser.storage.local.set(nonVisibleConfigValues);
      }

      // Handle passwordSaverDarkMode separately as it's stored in sync storage
      if (config.passwordSaverDarkMode !== undefined) {
        browser.storage.sync.set({ passwordSaverDarkMode: config.passwordSaverDarkMode });
      }

      // Close the modal
      importJsonModal.style.display = "none";

    } catch (error) {
      modalErrorMessage.textContent = `Invalid JSON configuration: ${error.message}`;
    }
  });

  // Handle form submission
  setupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    errorMessage.textContent = "";

    const jenkinsUrl = sanitizeJenkinsUrl(jenkinsUrlInput.value);
    let jenkinsMappings = [];

    if (!jenkinsUrl) {
      errorMessage.textContent = "Jenkins URL is required.";
      return;
    }

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
        errorMessage.textContent = `Invalid JSON format: ${error.message}`;
        return;
      }
    }

    browser.storage.local.set({
      jenkinsUrl: jenkinsUrl,
      ghRepoMappings: jenkinsMappings,
      setupCompleted: true
    }, () => {
      browser.tabs.getCurrent((tab) => {
        browser.tabs.remove(tab.id);
        browser.runtime.openOptionsPage();
      });
    });
  });
});
