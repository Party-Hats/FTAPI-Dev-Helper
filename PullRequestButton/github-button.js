(function() {
  let lastUrl = null;

  setInterval(checkUrl, 100);
  checkUrl();

  function checkUrl() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      handleUrlChange(currentUrl);
    }
  }

  function handleUrlChange(url) {
    browser.storage.local.get(["githubButtonEnabled", "ghRepoMappings"], (items) => {
      if (!items.githubButtonEnabled) {
        removeExistingButton();
        return;
      }
      removeExistingButton();

      // Only show on the conversation page, e.g.:
      // https://github.com/FTAPI-Software/<repo>/pull/<number>
      // with an optional trailing slash
      const match = url.match(/FTAPI-Software\/([^/]+)\/pull\/(\d+)(?:\/)?$/);
      if (!match) return;

      const repoName = match[1];
      const prNumber = match[2];

      const mappings = Array.isArray(items.ghRepoMappings) ? items.ghRepoMappings : [];
      const repoObj = mappings.find(r => r.repo === repoName);
      if (!repoObj || !repoObj.jobs || repoObj.jobs.length === 0) {
        return;
      }

      const jobNames = repoObj.jobs.map(j => j.name || "Unnamed Job");
      const buttonLabel = "Open Jenkins Builds\n(" + jobNames.join(", ") + ")";

      injectButton(prNumber, repoObj.jobs, buttonLabel);
    });
  }

  function removeExistingButton() {
    const oldBtn = document.getElementById("my-jenkins-button");
    if (oldBtn) oldBtn.remove();
  }

  function injectButton(prNumber, jobs, buttonLabel) {
    const btn = document.createElement("button");
    btn.id = "my-jenkins-button";
    btn.innerText = buttonLabel;
    btn.style.position = "fixed";
    btn.style.top = "120px";
    btn.style.right = "20px";
    btn.style.zIndex = "9999";
    btn.style.padding = "10px 15px";
    btn.style.backgroundColor = "#238636";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";
    btn.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";

    btn.style.whiteSpace = "pre-wrap";
    btn.style.wordWrap = "break-word";
    btn.style.maxWidth = "40ch";

    btn.addEventListener("click", () => {
      jobs.forEach(job => {
        const prefix = job.urlPrefix || "";
        const jobUrl = prefix + prNumber;
        window.open(jobUrl, "_blank");
      });
    });

    document.body.appendChild(btn);
  }
})();
