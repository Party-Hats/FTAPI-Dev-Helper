/**
 * Settings popup script for the FTAPI Dev Helper extension
 * Handles UI interactions and configuration management
 */

// UI element references
// Error page settings
const errorPageToggle = document.getElementById("errorPageToggle");
const autoReloadToggle = document.getElementById("autoReloadToggle");
const errorPageDarkMode = document.getElementById("errorPageDarkMode");

// Auto refresh settings
const autoRefreshToggle = document.getElementById("autoRefreshToggle");
const autoRefreshEnabledToggle = document.getElementById("autoRefreshEnabledToggle");
const autoRefreshDarkMode = document.getElementById("autoRefreshDarkMode");

// GitHub button settings
const githubButtonEnabled = document.getElementById("githubButtonEnabled");
const jenkinsUrlInput = document.getElementById("jenkinsUrl");
const saveJenkinsUrlBtn = document.getElementById("saveJenkinsUrlBtn");

// Password saver settings
const passwordSaverEnabled = document.getElementById("passwordSaverEnabled");
const managePasswordsBtn = document.getElementById("managePasswordsBtn");
const passwordSaverDarkMode = document.getElementById("passwordSaverDarkMode");
const passwordSaverAutoLoginEnabled = document.getElementById("passwordSaverAutoLoginEnabled");
const passwordSaverAutoLoginDelay = document.getElementById("passwordSaverAutoLoginDelay");
const savePasswordSaverAutoLoginDelayBtn = document.getElementById("savePasswordSaverAutoLoginDelayBtn");

// Auto-close tabs settings
const autoCloseEnabled = document.getElementById("autoCloseEnabled");
const autoCloseDelay = document.getElementById("autoCloseDelay");
const saveAutoCloseDelayBtn = document.getElementById("saveAutoCloseDelayBtn");
const autoCloseUrls = document.getElementById("autoCloseUrls");
const saveAutoCloseUrlsBtn = document.getElementById("saveAutoCloseUrlsBtn");

// Repository mappings
const reposList = document.getElementById("reposList");
const newRepoName = document.getElementById("newRepoName");
const addRepoBtn = document.getElementById("addRepoBtn");
const resetMappingsBtn = document.getElementById("resetMappingsBtn");

// Global settings
const viewConfigBtn = document.getElementById("viewConfigBtn");
const resetAllBtn = document.getElementById("resetAllBtn");

/**
 * Returns the default repository mappings
 * @returns {Array} Empty array as default mappings
 */
function getDefaultMappings() {
  return [];
}

/**
 * Gets the Jenkins URL from storage
 * @param {Function} callback - Function to call with the Jenkins URL
 */
function getJenkinsUrl(callback) {
  browser.storage.local.get(["jenkinsUrl"], (items) => {
    callback(items.jenkinsUrl || "");
  });
}

// Global repository mappings
let ghRepoMappings = [];

/**
 * Initialize the settings page when the DOM is loaded
 */
document.addEventListener("DOMContentLoaded", () => {
  // Load all settings from storage
  browser.storage.local.get([
    "errorPageEnabled",
    "autoReloadEnabled",
    "errorPageDarkMode",
    "autoRefreshEnabled",
    "autoRefreshAutoReloadEnabled",
    "autoRefreshDarkMode",
    "githubButtonEnabled",
    "passwordSaverEnabled",
    "passwordSaverDarkMode",
    "ghRepoMappings",
    "jenkinsUrl",
    "autoCloseEnabled",
    "autoCloseDelay",
    "autoCloseUrls"
  ], (items) => {
    // Initialize error page settings
    errorPageToggle.checked = items.errorPageEnabled !== false;
    autoReloadToggle.checked = !!items.autoReloadEnabled;
    errorPageDarkMode.checked = !!items.errorPageDarkMode;

    // Initialize auto refresh settings
    autoRefreshToggle.checked = items.autoRefreshEnabled !== false;
    autoRefreshEnabledToggle.checked = !!items.autoRefreshAutoReloadEnabled;
    autoRefreshDarkMode.checked = !!items.autoRefreshDarkMode;

    // Initialize GitHub button settings
    githubButtonEnabled.checked = items.githubButtonEnabled !== false;
    jenkinsUrlInput.value = items.jenkinsUrl || "";

    // Initialize password saver settings
    if (items.passwordSaverEnabled === undefined) {
      passwordSaverEnabled.checked = true;
      browser.storage.local.set({ passwordSaverEnabled: true });
    } else {
      passwordSaverEnabled.checked = !!items.passwordSaverEnabled;
    }

    browser.storage.sync.get([
      "passwordSaverDarkMode", 
      "passwordSaverAutoLoginEnabled", 
      "passwordSaverAutoLoginDelay"
    ], (syncItems) => {
      passwordSaverDarkMode.checked = !!syncItems.passwordSaverDarkMode;

      // Initialize auto-login settings
      if (syncItems.passwordSaverAutoLoginEnabled === undefined) {
        passwordSaverAutoLoginEnabled.checked = true;
        browser.storage.sync.set({ passwordSaverAutoLoginEnabled: true });
      } else {
        passwordSaverAutoLoginEnabled.checked = !!syncItems.passwordSaverAutoLoginEnabled;
      }

      passwordSaverAutoLoginDelay.value = syncItems.passwordSaverAutoLoginDelay || 2;
    });

    // Initialize auto-close tabs settings
    if (items.autoCloseEnabled === undefined) {
      autoCloseEnabled.checked = true;
      browser.storage.local.set({ autoCloseEnabled: true });
    } else {
      autoCloseEnabled.checked = !!items.autoCloseEnabled;
    }

    autoCloseDelay.value = items.autoCloseDelay || 5000;

    if (items.autoCloseUrls && Array.isArray(items.autoCloseUrls)) {
      autoCloseUrls.value = items.autoCloseUrls.join('\n');
    } else {
      autoCloseUrls.value = '';
    }

    // Initialize repository mappings
    if (!Array.isArray(items.ghRepoMappings)) {
      ghRepoMappings = getDefaultMappings();
      browser.storage.local.set({ ghRepoMappings });
    } else {
      ghRepoMappings = items.ghRepoMappings;
    }

    renderRepoList();
  });

  // Set up event listeners for error page settings
  errorPageToggle.addEventListener("change", () => {
    browser.storage.local.set({ errorPageEnabled: errorPageToggle.checked });
  });

  autoReloadToggle.addEventListener("change", () => {
    browser.storage.local.set({ autoReloadEnabled: autoReloadToggle.checked });
  });

  errorPageDarkMode.addEventListener("change", () => {
    browser.storage.local.set({ errorPageDarkMode: errorPageDarkMode.checked });
  });

  // Set up event listeners for auto refresh settings
  autoRefreshToggle.addEventListener("change", () => {
    browser.storage.local.set({ autoRefreshEnabled: autoRefreshToggle.checked });
  });

  autoRefreshEnabledToggle.addEventListener("change", () => {
    browser.storage.local.set({ autoRefreshAutoReloadEnabled: autoRefreshEnabledToggle.checked });
  });

  autoRefreshDarkMode.addEventListener("change", () => {
    browser.storage.local.set({ autoRefreshDarkMode: autoRefreshDarkMode.checked });
  });

  // Set up event listeners for GitHub button settings
  githubButtonEnabled.addEventListener("change", () => {
    browser.storage.local.set({ githubButtonEnabled: githubButtonEnabled.checked });
  });

  // Set up event listeners for password saver settings
  passwordSaverEnabled.addEventListener("change", () => {
    browser.storage.local.set({ passwordSaverEnabled: passwordSaverEnabled.checked });
  });

  passwordSaverDarkMode.addEventListener("change", () => {
    browser.storage.sync.set({ passwordSaverDarkMode: passwordSaverDarkMode.checked });
  });

  passwordSaverAutoLoginEnabled.addEventListener("change", () => {
    browser.storage.sync.set({ passwordSaverAutoLoginEnabled: passwordSaverAutoLoginEnabled.checked });
  });

  savePasswordSaverAutoLoginDelayBtn.addEventListener("click", () => {
    const delay = parseInt(passwordSaverAutoLoginDelay.value, 10);
    if (delay >= 1 && delay <= 10) {
      browser.storage.sync.set({ passwordSaverAutoLoginDelay: delay });
      showSaveConfirmation(savePasswordSaverAutoLoginDelayBtn);
    }
  });

  managePasswordsBtn.addEventListener("click", () => {
    const url = browser.runtime.getURL("PasswordSaver/passwords.html");
    browser.tabs.create({ url });
  });

  // Set up event listeners for repository mappings
  addRepoBtn.addEventListener("click", () => {
    const repoName = newRepoName.value.trim();
    if (!repoName) return;
    ghRepoMappings.push({ repo: repoName, jobs: [] });
    newRepoName.value = "";
    saveAndRender();
  });

  resetMappingsBtn.addEventListener("click", () => {
    ghRepoMappings = getDefaultMappings();
    saveAndRender();
  });

  // Set up event listeners for auto-close tabs settings
  autoCloseEnabled.addEventListener("change", () => {
    browser.storage.local.set({ autoCloseEnabled: autoCloseEnabled.checked });
  });

  saveAutoCloseDelayBtn.addEventListener("click", () => {
    const delay = parseInt(autoCloseDelay.value) || 5000;
    browser.storage.local.set({ autoCloseDelay: delay });
  });

  saveAutoCloseUrlsBtn.addEventListener("click", () => {
    const urlsText = autoCloseUrls.value.trim();
    const urlsArray = urlsText ? urlsText.split('\n').map(url => url.trim()).filter(url => url) : [];
    browser.storage.local.set({ autoCloseUrls: urlsArray });
  });

  // Set up event listeners for global settings
  viewConfigBtn.addEventListener("click", () => {
    const url = browser.runtime.getURL("settings/config-values.html");
    browser.tabs.create({ url });
  });

  resetAllBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all configurations to default values? This cannot be undone.")) {
      const defaultSettings = {
        errorPageEnabled: true,
        autoReloadEnabled: false,
        errorPageDarkMode: false,
        autoRefreshEnabled: true,
        autoRefreshAutoReloadEnabled: true,
        autoRefreshDarkMode: false,
        githubButtonEnabled: true,
        passwordSaverEnabled: true,
        ghRepoMappings: getDefaultMappings(),
        jenkinsUrl: "",
        autoCloseEnabled: true,
        autoCloseDelay: 5000,
        autoCloseUrls: []
      };

      browser.storage.local.set(defaultSettings, () => {
        browser.storage.sync.set({ 
          passwordSaverDarkMode: false,
          passwordSaverAutoLoginEnabled: true,
          passwordSaverAutoLoginDelay: 2
        }, () => {
          const installUrl = browser.runtime.getURL("install/install.html");
          browser.tabs.create({ url: installUrl });
          window.close();
        });
      });
    }
  });

  // Set up Jenkins URL save button
  saveJenkinsUrlBtn.addEventListener("click", () => {
    const jenkinsUrl = sanitizeJenkinsUrl(jenkinsUrlInput.value);
    if (jenkinsUrl) {
      browser.storage.local.set({ jenkinsUrl: jenkinsUrl });
    } else {
      alert("Please enter a valid Jenkins URL.");
    }
  });
});

/**
 * Renders the repository list UI based on the current ghRepoMappings
 */
function renderRepoList() {
  reposList.innerHTML = "";

  ghRepoMappings.forEach((repoObj, repoIndex) => {
    const container = document.createElement("div");
    container.className = "repoContainer";

    // Create repository header
    const header = document.createElement("div");
    header.className = "repoHeader";

    const titleLabel = document.createElement("label");
    titleLabel.textContent = "Repo Name:";
    header.appendChild(titleLabel);

    const repoInput = document.createElement("input");
    repoInput.type = "text";
    repoInput.value = repoObj.repo;
    repoInput.className = "repoInput";
    repoInput.title = "This must match 'FTAPI-Software/<repo>' in GitHub PR URLs.";
    repoInput.addEventListener("change", () => {
      ghRepoMappings[repoIndex].repo = repoInput.value.trim() || "UnnamedRepo";
      saveMappings();
    });
    header.appendChild(repoInput);

    const removeRepoRow = document.createElement("div");
    removeRepoRow.className = "removeRepoRow";

    const removeRepoBtn = document.createElement("button");
    removeRepoBtn.textContent = "Remove Repo";
    removeRepoBtn.title = "Delete this entire repository entry.";
    removeRepoBtn.addEventListener("click", () => {
      ghRepoMappings.splice(repoIndex, 1);
      saveAndRender();
    });
    removeRepoRow.appendChild(removeRepoBtn);

    header.appendChild(removeRepoRow);
    container.appendChild(header);

    // Create job rows for each job in the repository
    repoObj.jobs.forEach((job, jobIndex) => {
      const jobDiv = document.createElement("div");
      jobDiv.className = "jobRow";

      const jobNameLabel = document.createElement("label");
      jobNameLabel.textContent = "Job Name:";
      jobNameLabel.title = "A display name for this Jenkins job/pipeline.";
      jobDiv.appendChild(jobNameLabel);

      const jobNameInput = document.createElement("input");
      jobNameInput.type = "text";
      jobNameInput.value = job.name;
      jobNameInput.addEventListener("change", () => {
        repoObj.jobs[jobIndex].name = jobNameInput.value;
        saveMappings();
      });
      jobDiv.appendChild(jobNameInput);

      const jobPrefixLabel = document.createElement("label");
      jobPrefixLabel.textContent = "URL Prefix:";
      jobPrefixLabel.title = "The Jenkins URL leading up to 'PR-'. Extension appends the PR number.";
      jobDiv.appendChild(jobPrefixLabel);

      const jobPrefixInput = document.createElement("input");
      jobPrefixInput.type = "text";
      jobPrefixInput.value = job.urlPrefix;
      jobPrefixInput.addEventListener("change", () => {
        repoObj.jobs[jobIndex].urlPrefix = jobPrefixInput.value;
        saveMappings();
      });
      jobDiv.appendChild(jobPrefixInput);

      const jobBtnRow = document.createElement("div");
      jobBtnRow.className = "jobBtnRow";

      const removeJobBtn = document.createElement("button");
      removeJobBtn.textContent = "Remove Job";
      removeJobBtn.title = "Delete this job entry.";
      removeJobBtn.addEventListener("click", () => {
        repoObj.jobs.splice(jobIndex, 1);
        saveAndRender();
      });
      jobBtnRow.appendChild(removeJobBtn);

      jobDiv.appendChild(jobBtnRow);
      container.appendChild(jobDiv);
    });

    // Create add job row
    const addJobDiv = document.createElement("div");
    addJobDiv.className = "addJobRow";

    const newJobNameLabel = document.createElement("label");
    newJobNameLabel.textContent = "Add New Job Name:";
    addJobDiv.appendChild(newJobNameLabel);

    const newJobNameInput = document.createElement("input");
    newJobNameInput.type = "text";
    addJobDiv.appendChild(newJobNameInput);

    const newJobPrefixLabel = document.createElement("label");
    newJobPrefixLabel.textContent = "Add New URL Prefix:";
    addJobDiv.appendChild(newJobPrefixLabel);

    const newJobPrefixInput = document.createElement("input");
    newJobPrefixInput.type = "text";
    addJobDiv.appendChild(newJobPrefixInput);

    const addJobBtnRow = document.createElement("div");
    addJobBtnRow.className = "jobBtnRow";

    const addJobBtn = document.createElement("button");
    addJobBtn.textContent = "Add Job";
    addJobBtn.title = "Create a new job entry under this repo.";
    addJobBtn.addEventListener("click", () => {
      const jName = newJobNameInput.value.trim();
      const jPrefix = newJobPrefixInput.value.trim();
      if (!jName || !jPrefix) return;

      repoObj.jobs.push({ name: jName, urlPrefix: jPrefix });
      newJobNameInput.value = "";
      newJobPrefixInput.value = "";
      saveAndRender();
    });

    addJobBtnRow.appendChild(addJobBtn);
    addJobDiv.appendChild(addJobBtnRow);
    container.appendChild(addJobDiv);

    reposList.appendChild(container);
  });
}

/**
 * Saves repository mappings to storage and re-renders the UI
 */
function saveAndRender() {
  browser.storage.local.set({ ghRepoMappings }, () => {
    renderRepoList();
  });
}

/**
 * Saves repository mappings to storage without re-rendering
 */
function saveMappings() {
  browser.storage.local.set({ ghRepoMappings });
}
