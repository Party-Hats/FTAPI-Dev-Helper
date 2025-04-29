(function() {
  if (typeof browser === "undefined") {
    var browser = chrome;
  }

  const loginBase = "https://testing.ftapi.com:8443/login";
  let formFound = false;
  let isLoginPage = window.location.href.startsWith(loginBase);

  function trimUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.origin;
    } catch (e) {
      return url;
    }
  }

  if (!isLoginPage) {
    browser.storage.sync.get(
      ["pendingCred", "ephemeralHandled", "devPasswords"],
      (items) => {
        if (items.pendingCred && !items.ephemeralHandled) {
          handlePendingCred(items.pendingCred, items.devPasswords || {});
        }
      }
    );
  } else {
    browser.storage.sync.get(["devPasswords", "passwordSaverEnabled"], (items) => {
      if (items.passwordSaverEnabled !== false && items.devPasswords) {
        const currentUrl = trimUrl(window.location.href);
        const savedCredentials = items.devPasswords[currentUrl];
        if (savedCredentials && Object.keys(savedCredentials).length > 0) {
          showSavedPasswords(currentUrl, savedCredentials);
        }
      }
    });
  }

  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      const wasLoginPage = isLoginPage;
      isLoginPage = currentUrl.startsWith(loginBase);

      if (wasLoginPage && !isLoginPage) {
        setTimeout(() => {
          browser.storage.sync.get(
            ["pendingCred", "ephemeralHandled", "devPasswords"],
            (items) => {
              if (items.pendingCred && !items.ephemeralHandled) {
                handlePendingCred(items.pendingCred, items.devPasswords || {});
              }
            }
          );
        }, 500);
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

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
      let usernameInput = document.getElementById('username');
      let passwordInput = document.getElementById('password');

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
          browser.storage.sync.set({
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

    browser.storage.sync.get(["ephemeralPromptEnabled", "passwordSaverDarkMode"], (items) => {
      if (items.ephemeralPromptEnabled !== false) {
        showEphemeralPrompt(url, username, password, items.passwordSaverDarkMode, () => {
          browser.storage.sync.set({ ephemeralHandled: true });
        });
      } else {
        saveCredentials(devPasswords, url, username, password);
        browser.storage.sync.set({ ephemeralHandled: true });
      }
    });
  }

  function showEphemeralPrompt(url, username, password, isDarkMode, onDone) {
    const trimmedUrl = trimUrl(url);

    browser.storage.sync.get(["devPasswords"], (data) => {
      const devPasswords = data.devPasswords || {};
      if (!devPasswords[trimmedUrl]) {
        devPasswords[trimmedUrl] = {};
      }
      const existingPass = devPasswords[trimmedUrl][username];
      const isUpdate = (existingPass !== undefined && existingPass !== password);

      if (existingPass === password) {
        onDone();
        return;
      }

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
          browser.storage.sync.set({ ephemeralHandled: true });
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
          browser.storage.sync.set({ ephemeralHandled: true });
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
    const trimmedUrl = trimUrl(url);
    if (!devPasswords[trimmedUrl]) {
      devPasswords[trimmedUrl] = {};
    }
    devPasswords[trimmedUrl][username] = password;
    browser.storage.sync.set({ devPasswords });
  }

  function showSavedPasswords(url, credentials) {
    browser.storage.sync.get(["passwordSaverDarkMode"], (items) => {
      const isDarkMode = !!items.passwordSaverDarkMode;

      const trimmedUrl = trimUrl(url);

      const container = document.createElement("div");
      container.className = "ps-popup";
      if (isDarkMode) {
        container.classList.add("darkMode");
      }

      const closeX = document.createElement("button");
      closeX.className = "ps-close";
      closeX.textContent = "×";
      closeX.addEventListener("click", () => {
        container.remove();
      });
      container.appendChild(closeX);

      const title = document.createElement("p");
      title.textContent = "Saved credentials for:";
      container.appendChild(title);

      const urlElement = document.createElement("div");
      urlElement.className = "ps-url";
      urlElement.innerHTML = `<strong>${trimmedUrl}</strong>`;
      container.appendChild(urlElement);

      const listArea = document.createElement("div");
      listArea.className = "ps-listArea";
      container.appendChild(listArea);

      Object.entries(credentials).forEach(([username, password]) => {
        const credButton = document.createElement("button");
        credButton.textContent = username;
        credButton.addEventListener("click", () => {
          const form = document.querySelector('form');
          if (form) {
            let usernameInput = document.getElementById('username');
            let passwordInput = document.getElementById('password');

            if (!usernameInput) {
              usernameInput = form.querySelector('input[type="text"], input[type="email"]');
            }
            if (!passwordInput) {
              passwordInput = form.querySelector('input[type="password"]');
            }

            if (usernameInput && passwordInput) {
              usernameInput.value = username;
              passwordInput.value = password;

              usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
              passwordInput.dispatchEvent(new Event('input', { bubbles: true }));

              usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
              passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

              passwordInput.focus();

              let submitBtn = document.getElementById('login-submit-button');

              if (!submitBtn) {
                submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');

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

                  if (!submitBtn && buttons.length > 0) {
                    submitBtn = buttons[0];
                  }
                }
              }

              if (submitBtn) {
                submitBtn.click();
              } else {
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
