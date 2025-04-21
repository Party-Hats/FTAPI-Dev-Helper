(function() {
  const loginBase = "https://testing.ftapi.com:8443/login";
  let formFound = false;
  let isLoginPage = window.location.href.startsWith(loginBase);

  // Helper function to trim URL to just host and port
  function trimUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.origin; // Returns protocol + hostname + port
    } catch (e) {
      return url; // Return original if parsing fails
    }
  }

  // Check for pending credentials on initial load if we're not on the login page
  if (!isLoginPage) {
    chrome.storage.sync.get(
      ["pendingCred", "ephemeralHandled", "devPasswords"],
      (items) => {
        if (items.pendingCred && !items.ephemeralHandled) {
          handlePendingCred(items.pendingCred, items.devPasswords || {});
        }
      }
    );
  } else {
    // If we're on the login page, show saved passwords for this URL
    chrome.storage.sync.get(["devPasswords", "passwordSaverEnabled"], (items) => {
      if (items.passwordSaverEnabled !== false && items.devPasswords) {
        const currentUrl = trimUrl(window.location.href);
        const savedCredentials = items.devPasswords[currentUrl];
        if (savedCredentials && Object.keys(savedCredentials).length > 0) {
          showSavedPasswords(currentUrl, savedCredentials);
        }
      }
    });
  }

  // Add SPA navigation detection
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      const wasLoginPage = isLoginPage;
      isLoginPage = currentUrl.startsWith(loginBase);

      // If we just left the login page and have pending credentials, handle them
      if (wasLoginPage && !isLoginPage) {
        // Small delay to ensure the page has loaded
        setTimeout(() => {
          chrome.storage.sync.get(
            ["pendingCred", "ephemeralHandled", "devPasswords"],
            (items) => {
              if (items.pendingCred && !items.ephemeralHandled) {
                handlePendingCred(items.pendingCred, items.devPasswords || {});
              }
            }
          );
        }, 500); // Wait 500ms for the page to settle
      }
    }
  });

  // Start observing the body for changes that might indicate SPA navigation
  observer.observe(document.body, { childList: true, subtree: true });

  // We'll poll every 100ms for up to 3s to find a form
  let attempts = 0;
  const maxAttempts = 30;
  const pollInterval = setInterval(() => {
    if (formFound || attempts >= maxAttempts) {
      clearInterval(pollInterval);
      return;
    }
    attempts++;

    const form = document.querySelector('form');
    if (form) {
      formFound = true;
      setupFormListener(form);
    }
  }, 100);

  function setupFormListener(form) {
    form.addEventListener('submit', (e) => {
      // First try to find inputs by ID (as specified in the issue description)
      let usernameInput = document.getElementById('username');
      let passwordInput = document.getElementById('password');

      // Fallback to generic selectors if IDs not found
      if (!usernameInput) {
        usernameInput = form.querySelector('input[type="text"], input[type="email"]');
      }
      if (!passwordInput) {
        passwordInput = form.querySelector('input[type="password"]');
      }

      if (usernameInput && passwordInput) {
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (username && password) {
          // Store credentials temporarily
          chrome.storage.sync.set({
            pendingCred: {
              url: trimUrl(window.location.href),
              username: username,
              password: password
            },
            ephemeralHandled: false
          });
        }
      }
    });
  }

  function handlePendingCred(pendingCred, devPasswords) {
    const { url, username, password } = pendingCred;

    // Check if we should show the ephemeral prompt
    chrome.storage.sync.get(["ephemeralPromptEnabled", "passwordSaverDarkMode"], (items) => {
      if (items.ephemeralPromptEnabled !== false) {
        showEphemeralPrompt(url, username, password, items.passwordSaverDarkMode, () => {
          chrome.storage.sync.set({ ephemeralHandled: true });
        });
      } else {
        // If ephemeral prompt is disabled, just save the credentials
        saveCredentials(devPasswords, url, username, password);
        chrome.storage.sync.set({ ephemeralHandled: true });
      }
    });
  }

  function showEphemeralPrompt(url, username, password, isDarkMode, onDone) {
    // Ensure URL is trimmed
    const trimmedUrl = trimUrl(url);

    // We'll see if there's an existing password
    chrome.storage.sync.get(["devPasswords"], (data) => {
      const devPasswords = data.devPasswords || {};
      if (!devPasswords[trimmedUrl]) {
        devPasswords[trimmedUrl] = {};
      }
      const existingPass = devPasswords[trimmedUrl][username];
      const isUpdate = (existingPass !== undefined && existingPass !== password);

      // Only show prompt if it's a new password or an update
      if (existingPass === password) {
        onDone();
        return;
      }

      // Build ephemeral popup
      const container = document.createElement("div");
      container.className = "ps-popup";
      if (isDarkMode) {
        container.classList.add("darkMode");
      }

      const text = document.createElement("p");
      if (!existingPass) {
        // new
        text.innerHTML = `
          Save credentials for <strong>${trimmedUrl}</strong>?<br>
          (Plaintext storage, dev use only)
        `;
      } else {
        // update
        text.innerHTML = `
          Update password for <strong>${username}</strong> on <strong>${trimmedUrl}</strong>?<br>
          (Plaintext storage, dev use only)
        `;
      }
      container.appendChild(text);

      const actions = document.createElement("div");
      actions.className = "ps-actions";
      container.appendChild(actions);

      const bar = document.createElement("div");
      bar.className = "ps-timeout-bar";
      container.appendChild(bar);

      bar.style.width = "100%";
      bar.style.transition = "width 5s linear";

      let timerId;

      if (!existingPass) {
        // new
        const yesBtn = document.createElement("button");
        yesBtn.textContent = "Yes";
        yesBtn.addEventListener("click", () => {
          clearTimeout(timerId);
          saveCredentials(devPasswords, url, username, password);
          chrome.storage.sync.set({ ephemeralHandled: true });
          container.remove();
          onDone();
        });
        actions.appendChild(yesBtn);

        timerId = setTimeout(() => {
          container.remove();
          onDone();
        }, 5000);

      } else {
        // update
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => {
          clearTimeout(timerId);
          container.remove();
          onDone();
        });
        actions.appendChild(cancelBtn);

        timerId = setTimeout(() => {
          saveCredentials(devPasswords, url, username, password);
          chrome.storage.sync.set({ ephemeralHandled: true });
          container.remove();
          onDone();
        }, 5000);
      }

      setTimeout(() => {
        bar.style.width = "0%";
      }, 50);

      document.body.appendChild(container);
    });
  }

  function saveCredentials(devPasswords, url, username, password) {
    // Ensure URL is trimmed
    const trimmedUrl = trimUrl(url);
    if (!devPasswords[trimmedUrl]) {
      devPasswords[trimmedUrl] = {};
    }
    devPasswords[trimmedUrl][username] = password;
    chrome.storage.sync.set({ devPasswords });
  }

  function showSavedPasswords(url, credentials) {
    // Get dark mode setting
    chrome.storage.sync.get(["passwordSaverDarkMode"], (items) => {
      const isDarkMode = !!items.passwordSaverDarkMode;

      // Ensure URL is trimmed
      const trimmedUrl = trimUrl(url);

      // Build popup for saved passwords
      const container = document.createElement("div");
      container.className = "ps-popup";
      if (isDarkMode) {
        container.classList.add("darkMode");
      }

      // Add X close button in top right corner
      const closeX = document.createElement("button");
      closeX.className = "ps-close";
      closeX.textContent = "×"; // Using the multiplication symbol as an X
      closeX.addEventListener("click", () => {
        container.remove();
      });
      container.appendChild(closeX);

      const title = document.createElement("p");
      title.textContent = "Saved credentials for:";
      container.appendChild(title);

      // Add URL on a separate line
      const urlElement = document.createElement("div");
      urlElement.className = "ps-url";
      urlElement.innerHTML = `<strong>${trimmedUrl}</strong>`;
      container.appendChild(urlElement);

      const listArea = document.createElement("div");
      listArea.className = "ps-listArea";
      container.appendChild(listArea);

      // Add each saved credential as a button
      Object.entries(credentials).forEach(([username, password]) => {
        const credButton = document.createElement("button");
        credButton.textContent = username;
        credButton.addEventListener("click", () => {
          // Find form inputs
          const form = document.querySelector('form');
          if (form) {
            // First try to find inputs by ID (as specified in the issue description)
            let usernameInput = document.getElementById('username');
            let passwordInput = document.getElementById('password');

            // Fallback to generic selectors if IDs not found
            if (!usernameInput) {
              usernameInput = form.querySelector('input[type="text"], input[type="email"]');
            }
            if (!passwordInput) {
              passwordInput = form.querySelector('input[type="password"]');
            }

            if (usernameInput && passwordInput) {
              // Set values
              usernameInput.value = username;
              passwordInput.value = password;

              // Trigger input events to notify the form that values have changed
              usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
              passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

              // Also trigger change events
              usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
              passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

              // Focus on password field
              passwordInput.focus();

              // Try to find the login button by ID first (as specified in the issue description)
              let submitBtn = document.getElementById('login-submit-button');

              // If not found by ID, try other methods
              if (!submitBtn) {
                submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');

                // If still not found, try to find a login button
                if (!submitBtn) {
                  const buttons = form.querySelectorAll('button');
                  for (const button of buttons) {
                    const text = button.textContent.toLowerCase();
                    const id = (button.id || '').toLowerCase();
                    const className = (button.className || '').toLowerCase();

                    if (text.includes('login') || text.includes('sign in') || 
                        id.includes('login') || id.includes('signin') || 
                        className.includes('login') || className.includes('signin')) {
                      submitBtn = button;
                      break;
                    }
                  }

                  // If still no button found, just use the first button
                  if (!submitBtn && buttons.length > 0) {
                    submitBtn = buttons[0];
                  }
                }
              }

              if (submitBtn) {
                submitBtn.click();
              } else {
                // If no button found, try to submit the form directly
                try {
                  form.submit();
                } catch (e) {
                  console.log('Failed to submit form:', e);
                }
              }
            }
          }
          container.remove();
        });
        listArea.appendChild(credButton);
      });

      document.body.appendChild(container);
    });
  }
})();
