if (typeof browser === "undefined") {
  var browser = chrome;
}

const errorPageToggle = document.getElementById("errorPageToggle");
const autoReloadToggle = document.getElementById("autoReloadToggle");
const errorPageDarkMode = document.getElementById("errorPageDarkMode");
const githubButtonEnabled = document.getElementById("githubButtonEnabled");
const jenkinsUrlInput = document.getElementById("jenkinsUrl");
const saveJenkinsUrlBtn = document.getElementById("saveJenkinsUrlBtn");

const passwordSaverEnabled = document.getElementById("passwordSaverEnabled");
const managePasswordsBtn = document.getElementById("managePasswordsBtn");
const passwordSaverDarkMode = document.getElementById("passwordSaverDarkMode");

const reposList = document.getElementById("reposList");
const newRepoName = document.getElementById("newRepoName");
const addRepoBtn = document.getElementById("addRepoBtn");
const resetMappingsBtn = document.getElementById("resetMappingsBtn");

function getDefaultMappings() {
  return [];
}

function getJenkinsUrl(callback) {
  browser.storage.local.get(["jenkinsUrl"], (items) => {
    callback(items.jenkinsUrl || "");
  });
}

let ghRepoMappings = [];

document.addEventListener("DOMContentLoaded", () => {
  browser.storage.local.get([
    "errorPageEnabled",
    "autoReloadEnabled",
    "errorPageDarkMode",
    "githubButtonEnabled",
    "passwordSaverEnabled",
    "passwordSaverDarkMode",
    "ghRepoMappings",
    "jenkinsUrl"
  ], (items) => {
    errorPageToggle.checked = items.errorPageEnabled !== false;
    autoReloadToggle.checked = !!items.autoReloadEnabled;
    errorPageDarkMode.checked = !!items.errorPageDarkMode;
    githubButtonEnabled.checked = items.githubButtonEnabled !== false;

    if (items.passwordSaverEnabled === undefined) {
      passwordSaverEnabled.checked = true;
      browser.storage.local.set({ passwordSaverEnabled: true });
    } else {
      passwordSaverEnabled.checked = !!items.passwordSaverEnabled;
    }

    browser.storage.sync.get(["passwordSaverDarkMode"], (syncItems) => {
      passwordSaverDarkMode.checked = !!syncItems.passwordSaverDarkMode;
    });

    jenkinsUrlInput.value = items.jenkinsUrl || "";

    if (!Array.isArray(items.ghRepoMappings)) {
      ghRepoMappings = getDefaultMappings();
      browser.storage.local.set({ ghRepoMappings });
    } else {
      ghRepoMappings = items.ghRepoMappings;
    }

    renderRepoList();
  });

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

  managePasswordsBtn.addEventListener("click", () => {
    const url = browser.runtime.getURL("PasswordSaver/passwords.html");
    browser.tabs.create({ url });
  });

  passwordSaverDarkMode.addEventListener("change", () => {
    browser.storage.sync.set({ passwordSaverDarkMode: passwordSaverDarkMode.checked });
  });

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

  saveJenkinsUrlBtn.addEventListener("click", () => {
    const jenkinsUrl = sanitizeJenkinsUrl(jenkinsUrlInput.value);
    if (jenkinsUrl) {
      browser.storage.local.set({ jenkinsUrl: jenkinsUrl });
    } else {
      alert("Please enter a valid Jenkins URL.");
    }
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
