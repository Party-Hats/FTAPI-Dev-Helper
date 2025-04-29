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

document.addEventListener("DOMContentLoaded", () => {
  const setupForm = document.getElementById("setupForm");
  const jenkinsUrlInput = document.getElementById("jenkinsUrl");
  const jenkinsMappingsInput = document.getElementById("jenkinsMappings");
  const errorMessage = document.getElementById("errorMessage");

  browser.storage.local.get(["jenkinsUrl", "ghRepoMappings"], (items) => {
    if (items.jenkinsUrl) {
      jenkinsUrlInput.value = items.jenkinsUrl;
    }

    if (items.ghRepoMappings && Array.isArray(items.ghRepoMappings) && items.ghRepoMappings.length > 0) {
      jenkinsMappingsInput.value = JSON.stringify(items.ghRepoMappings, null, 2);
    }
  });

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
