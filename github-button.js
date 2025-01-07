(function() {
  let lastUrl = null;

  function checkUrl() {
    const currentUrl = window.location.href;

    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      handleUrlChange(currentUrl);
    }
  }

  function handleUrlChange(url) {
    const oldButton = document.getElementById('my-jenkins-button');
    if (oldButton) oldButton.remove();

    const match = url.match(/\/(\d+)$/);
    if (!match) {
      return;
    }

    const extractedNumber = match[1];
    injectButton(extractedNumber);
  }

  function injectButton(prNumber) {
    const button = document.createElement('button');
    button.id = 'my-jenkins-button';
    button.innerText = 'Open matching Jenkins Builds';
    button.style.position = 'fixed';
    button.style.top = '120px';
    button.style.right = '20px';
    button.style.zIndex = '9999';
    button.style.padding = '10px 15px';
    button.style.backgroundColor = '#238636';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';

    button.addEventListener('click', () => {
      const build = `https://ci.ftapi.dev/view/Process%20Client/job/Process-Client/view/change-requests/job/PR-${prNumber}`;
      const e2e = `https://ci.ftapi.dev/view/Process%20Client/job/Process%20Client%20E2E%20Tests/view/change-requests/job/PR-${prNumber}`;

      window.open(build, '_blank');
      window.open(e2e, '_blank');
    });

    document.body.appendChild(button);
  }

  setInterval(checkUrl, 100);

  checkUrl();
})();
