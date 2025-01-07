(function() {
  const ERROR_TEXT = "This page may not exist, or you may not have permission to see it.";
  const CHECK_INTERVAL_MS = 3000;

  // Re-check every 3 seconds
  const intervalId = setInterval(() => {
    // Find all <p> tags
    const pTags = document.querySelectorAll('p');
    let hasErrorMessage = false;

    // See if any <p> contains the error text
    for (const p of pTags) {
      if (p.innerText.includes(ERROR_TEXT)) {
        hasErrorMessage = true;
        break;
      }
    }

    if (hasErrorMessage) {
      // Reload this tab
      location.reload();
    } else {
      // Error message not found -> the build presumably exists now
      clearInterval(intervalId);
    }
  }, CHECK_INTERVAL_MS);
})();
