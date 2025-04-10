(function() {
  const ERROR_TEXT = "This page may not exist, or you may not have permission to see it.";
  const NO_BUILDS_TEXT = "No data available. This Pipeline has not yet run.";
  const CHECK_INTERVAL_MS = 3000;

  // We only reload the page if the user actually opened a Jenkins job
  // that matches one of our known URL prefixes.
  chrome.storage.local.get(["ghRepoMappings"], (items) => {
    if (!Array.isArray(items.ghRepoMappings)) {
      // No mappings, do nothing
      return;
    }

    const currentUrl = window.location.href;
    let matchedPrefix = false;

    // Flatten all job prefixes to see if currentUrl starts with any
    for (const repoObj of items.ghRepoMappings) {
      for (const job of repoObj.jobs) {
        const prefix = job.urlPrefix || "";
        // Check if current URL begins with that prefix
        if (currentUrl.startsWith(prefix)) {
          matchedPrefix = true;
          break;
        }
      }
      if (matchedPrefix) break;
    }

    if (!matchedPrefix) {
      // This page doesn't match any known Jenkins job prefix
      return;
    }

    // If we matched, set up the re-check logic
    const intervalId = setInterval(() => {
      let hasErrorMessage = false;

      // Look for any p-tag that contains the error text
      const pTags = document.querySelectorAll("p");
      for (const p of pTags) {
        if (p.innerText.includes(ERROR_TEXT)) {
          hasErrorMessage = true;
          break;
        }
      }

      // Look for any div that says "No data available..."
      const divTags = document.querySelectorAll("div");
      for (const div of divTags) {
        if (div.innerText.includes(NO_BUILDS_TEXT)) {
          hasErrorMessage = true;
          break;
        }
      }

      if (hasErrorMessage) {
        // Reload this page
        location.reload();
      } else {
        // Build presumably exists now
        clearInterval(intervalId);
      }
    }, CHECK_INTERVAL_MS);
  });
})();
