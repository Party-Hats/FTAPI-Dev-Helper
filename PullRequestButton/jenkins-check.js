(function() {
  const ERROR_TEXT = "This page may not exist, or you may not have permission to see it.";
  const NO_BUILDS_TEXT = "No data available. This Pipeline has not yet run.";
  const CHECK_INTERVAL_MS = 3000;

  // We only reload if the current Jenkins page URL starts with any known prefix
  // from the GH→Jenkins mappings
  browser.storage.local.get(["ghRepoMappings"], (items) => {
    if (!Array.isArray(items.ghRepoMappings)) {
      return;
    }
    const currentUrl = window.location.href;
    let matchedPrefix = false;

    // Flatten job prefixes
    for (const repoObj of items.ghRepoMappings) {
      for (const job of repoObj.jobs) {
        const prefix = job.urlPrefix || "";
        if (currentUrl.startsWith(prefix)) {
          matchedPrefix = true;
          break;
        }
      }
      if (matchedPrefix) break;
    }

    if (!matchedPrefix) {
      // Not a recognized Jenkins job URL => do nothing
      return;
    }

    // If matched, set up the re-check
    const intervalId = setInterval(() => {
      let hasErrorMessage = false;

      const pTags = document.querySelectorAll("p");
      for (const p of pTags) {
        if (p.innerText.includes(ERROR_TEXT)) {
          hasErrorMessage = true;
          break;
        }
      }

      const divTags = document.querySelectorAll("div");
      for (const div of divTags) {
        if (div.innerText.includes(NO_BUILDS_TEXT)) {
          hasErrorMessage = true;
          break;
        }
      }

      if (hasErrorMessage) {
        location.reload();
      } else {
        clearInterval(intervalId);
      }
    }, CHECK_INTERVAL_MS);
  });
})();
