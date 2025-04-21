// popup.js

// Existing toggles
const errorPageToggle = document.getElementById("errorPageToggle");
const autoReloadToggle = document.getElementById("autoReloadToggle");
const errorPageDarkMode = document.getElementById("errorPageDarkMode");
const githubButtonEnabled = document.getElementById("githubButtonEnabled");

// Dev Password Saver
const passwordSaverEnabled = document.getElementById("passwordSaverEnabled");
const managePasswordsBtn = document.getElementById("managePasswordsBtn");
const passwordSaverDarkMode = document.getElementById("passwordSaverDarkMode");

// Error page URL input
const errorPageUrlInput = document.getElementById("errorPageUrl");

// GH->Jenkins mappings controls
const reposList = document.getElementById("reposList");
const newRepoName = document.getElementById("newRepoName");
const addRepoBtn = document.getElementById("addRepoBtn");
const resetMappingsBtn = document.getElementById("resetMappingsBtn");

// Reuse your existing getDefaultMappings for GH stuff if needed
function getDefaultMappings() {
  return [
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
  ];
}

let ghRepoMappings = [];

document.addEventListener("DOMContentLoaded", () => {
  browser.storage.local.get([
    "errorPageEnabled",
    "autoReloadEnabled",
    "errorPageDarkMode",
    "errorPageUrl",
    "githubButtonEnabled",
    "passwordSaverEnabled",
    "passwordSaverDarkMode",
    "ghRepoMappings"
  ], (items) => {
    // Error page toggles
    errorPageToggle.checked = items.errorPageEnabled !== false;
    autoReloadToggle.checked = !!items.autoReloadEnabled;
    errorPageDarkMode.checked = !!items.errorPageDarkMode;
    githubButtonEnabled.checked = items.githubButtonEnabled !== false;

    // Dev Password Saver default to true if not set
    if (items.passwordSaverEnabled === undefined) {
      passwordSaverEnabled.checked = true; // default on
      browser.storage.local.set({ passwordSaverEnabled: true });
    } else {
      passwordSaverEnabled.checked = !!items.passwordSaverEnabled;
    }

    // Password Saver Dark Mode - load from sync storage
    browser.storage.sync.get(["passwordSaverDarkMode"], (syncItems) => {
      passwordSaverDarkMode.checked = !!syncItems.passwordSaverDarkMode;
    });

    // Error Page URL
    if (typeof items.errorPageUrl === "string") {
      errorPageUrlInput.value = items.errorPageUrl;
    } else {
      errorPageUrlInput.value = "https://testing.ftapi.com:8443";
      browser.storage.local.set({ errorPageUrl: errorPageUrlInput.value });
    }

    // GH Mappings
    if (!Array.isArray(items.ghRepoMappings)) {
      ghRepoMappings = getDefaultMappings();
      browser.storage.local.set({ ghRepoMappings });
    } else {
      ghRepoMappings = items.ghRepoMappings;
    }

    renderRepoList();
  });

  // Toggle event listeners
  errorPageToggle.addEventListener("change", () => {
    browser.storage.local.set({ errorPageEnabled: errorPageToggle.checked });
  });
  autoReloadToggle.addEventListener("change", () => {
    browser.storage.local.set({ autoReloadEnabled: autoReloadToggle.checked });
  });
  errorPageDarkMode.addEventListener("change", () => {
    browser.storage.local.set({ errorPageDarkMode: errorPageDarkMode.checked });
  });
  githubButtonEnabled.addEventListener("change", () => {
    browser.storage.local.set({ githubButtonEnabled: githubButtonEnabled.checked });
  });
  passwordSaverEnabled.addEventListener("change", () => {
    browser.storage.local.set({ passwordSaverEnabled: passwordSaverEnabled.checked });
  });
  errorPageUrlInput.addEventListener("change", () => {
    browser.storage.local.set({ errorPageUrl: errorPageUrlInput.value });
  });

  // Add a new repo
  addRepoBtn.addEventListener("click", () => {
    const repoName = newRepoName.value.trim();
    if (!repoName) return;
    ghRepoMappings.push({ repo: repoName, jobs: [] });
    newRepoName.value = "";
    saveAndRender();
  });

  // Reset default mappings
  resetMappingsBtn.addEventListener("click", () => {
    ghRepoMappings = getDefaultMappings();
    saveAndRender();
  });

  // Open our password management page
  managePasswordsBtn.addEventListener("click", () => {
    const url = browser.runtime.getURL("PasswordSaver/passwords.html");
    browser.tabs.create({ url });
  });

  // Add dark mode toggle listener
  passwordSaverDarkMode.addEventListener("change", () => {
    browser.storage.sync.set({ passwordSaverDarkMode: passwordSaverDarkMode.checked });
  });
});

function renderRepoList() {
  reposList.innerHTML = "";

  ghRepoMappings.forEach((repoObj, repoIndex) => {
    const container = document.createElement("div");
    container.className = "repoContainer";

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

    // Jobs
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

    // Add job row
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

function saveAndRender() {
  browser.storage.local.set({ ghRepoMappings }, () => {
    renderRepoList();
  });
}

function saveMappings() {
  browser.storage.local.set({ ghRepoMappings });
}
