if (typeof browser === "undefined") {
  var browser = chrome;
}

(function() {
  const STATUS_UP_VALUE = "UP";
  let isPopupShown = false;
  let isServerDown = false;
  let featureEnabled = true;
  let autoRefreshEnabled = true;
  let isDarkMode = false;
  let offlineSeconds = 0;
  let offlineTimer = null;
  let healthCheckInterval = null;
  let popup = null;

  // Get settings from storage
  browser.storage.local.get(["autoRefreshEnabled", "autoRefreshAutoReloadEnabled", "autoRefreshDarkMode"], (items) => {
    featureEnabled = items.autoRefreshEnabled !== false;
    autoRefreshEnabled = items.autoRefreshAutoReloadEnabled !== false;
    isDarkMode = !!items.autoRefreshDarkMode;
  });

  // Listen for storage changes
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.autoRefreshEnabled) {
        featureEnabled = changes.autoRefreshEnabled.newValue !== false;
        // If feature is disabled, hide the popup
        if (!featureEnabled && isPopupShown) {
          hidePopup();
        }
      }
      if (changes.autoRefreshAutoReloadEnabled) {
        autoRefreshEnabled = changes.autoRefreshAutoReloadEnabled.newValue !== false;
        updatePopupIfShown();
      }
      if (changes.autoRefreshDarkMode) {
        isDarkMode = !!changes.autoRefreshDarkMode.newValue;
        updatePopupIfShown();
      }
    }
  });

  function updatePopupIfShown() {
    if (popup && isPopupShown) {
      if (isDarkMode) {
        popup.classList.add("darkMode");
      } else {
        popup.classList.remove("darkMode");
      }

      const toggleEl = popup.querySelector("#autoRefreshToggle");
      if (toggleEl) {
        toggleEl.checked = autoRefreshEnabled;
      }
    }
  }

  function checkServerHealth() {
    // Don't check server health for excluded endpoints
    const path = window.location.pathname;
    if (path.startsWith('/api/') || path.startsWith('/rest-api/')) return;

    const baseUrl = window.location.origin;
    const statusEndpoint = baseUrl + "/actuator/health/readiness";

    fetch(statusEndpoint, { method: "GET" })
      .then(response => response.json())
      .then(data => {
        if (data.status === STATUS_UP_VALUE) {
          // Server is up
          if (isServerDown) {
            // Server was down but is now up
            isServerDown = false;
            if (autoRefreshEnabled) {
              window.location.reload();
            } else if (isPopupShown) {
              updatePopupStatus("Server is UP! You can reload the page now.");
            }
          }
        } else {
          // Server is down
          if (!isServerDown) {
            // Server just went down
            isServerDown = true;
            showPopup();
          }
        }
      })
      .catch(() => {
        // Server is unreachable
        if (!isServerDown) {
          // Server just went down
          isServerDown = true;
          showPopup();
        }
      });
  }

  function showPopup() {
    // Don't show popup if it's already shown, feature is disabled, or URL is an excluded endpoint
    const path = window.location.pathname;
    if (isPopupShown || !featureEnabled || path.startsWith('/api/') || path.startsWith('/rest-api/')) return;

    isPopupShown = true;
    offlineSeconds = 0;

    // Create popup
    popup = document.createElement("div");
    popup.className = "st-popup";
    if (isDarkMode) {
      popup.classList.add("darkMode");
    }

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "st-close";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => {
      hidePopup();
    });
    popup.appendChild(closeBtn);

    // Title
    const title = document.createElement("p");
    title.className = "st-title";
    title.textContent = "Server is currently unavailable";
    popup.appendChild(title);

    // URL
    const urlElement = document.createElement("div");
    urlElement.className = "st-url";
    urlElement.textContent = window.location.origin;
    popup.appendChild(urlElement);

    // Status
    const statusElement = document.createElement("div");
    statusElement.className = "st-status statusDown";
    statusElement.id = "statusArea";
    statusElement.textContent = "Server is DOWN. Waiting...";
    popup.appendChild(statusElement);

    // Offline time
    const offlineTimeElement = document.createElement("div");
    offlineTimeElement.className = "st-offline-time";
    offlineTimeElement.innerHTML = 'Time waiting: <span id="offlineCount">0</span> seconds';
    popup.appendChild(offlineTimeElement);

    // Auto-refresh toggle
    const toggleRow = document.createElement("div");
    toggleRow.className = "st-toggle-row";

    const toggleEl = document.createElement("input");
    toggleEl.type = "checkbox";
    toggleEl.id = "autoRefreshToggle";
    toggleEl.checked = autoRefreshEnabled;
    toggleEl.addEventListener("change", () => {
      autoRefreshEnabled = toggleEl.checked;
      browser.storage.local.set({
        autoRefreshAutoReloadEnabled: autoRefreshEnabled
      });
    });
    toggleRow.appendChild(toggleEl);

    const toggleLabel = document.createElement("label");
    toggleLabel.htmlFor = "autoRefreshToggle";
    toggleLabel.textContent = "Automatically reload when server is ready";
    toggleRow.appendChild(toggleLabel);

    popup.appendChild(toggleRow);

    // Reload button
    const reloadBtn = document.createElement("button");
    reloadBtn.className = "st-reload-btn";
    reloadBtn.textContent = "Reload Now";
    reloadBtn.disabled = true;
    reloadBtn.addEventListener("click", () => {
      window.location.reload();
    });
    popup.appendChild(reloadBtn);

    // Add popup to body
    document.body.appendChild(popup);

    // Start offline timer
    offlineTimer = setInterval(() => {
      offlineSeconds++;
      const offlineCountEl = document.getElementById("offlineCount");
      if (offlineCountEl) {
        offlineCountEl.textContent = offlineSeconds;
      }
    }, 1000);
  }

  function hidePopup() {
    if (!isPopupShown) return;

    isPopupShown = false;
    if (popup) {
      popup.remove();
      popup = null;
    }

    if (offlineTimer) {
      clearInterval(offlineTimer);
      offlineTimer = null;
    }
  }

  function updatePopupStatus(statusText) {
    if (!isPopupShown || !popup) return;

    const statusElement = popup.querySelector("#statusArea");
    if (statusElement) {
      statusElement.textContent = statusText;
      if (statusText.includes("UP")) {
        statusElement.classList.remove("statusDown");
        statusElement.classList.add("statusUp");

        // Enable reload button
        const reloadBtn = popup.querySelector(".st-reload-btn");
        if (reloadBtn) {
          reloadBtn.disabled = false;
        }

        // Stop offline timer
        if (offlineTimer) {
          clearInterval(offlineTimer);
          offlineTimer = null;
        }
      } else {
        statusElement.classList.add("statusDown");
        statusElement.classList.remove("statusUp");
      }
    }
  }

  // Start health check interval
  healthCheckInterval = setInterval(checkServerHealth, 1000);

  // Clean up when page is unloaded
  window.addEventListener("beforeunload", () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
    }
    if (offlineTimer) {
      clearInterval(offlineTimer);
    }
  });
})();
