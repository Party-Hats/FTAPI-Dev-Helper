// We'll fetch from: errorPageUrl + "/actuator/health/readiness"
const STATUS_UP_VALUE = "UP";

// Grab UI elements
const urlArea = document.getElementById("urlArea");
const statusDiv = document.getElementById("statusArea");
const toggleEl = document.getElementById("autoToggle");
const reloadBtn = document.getElementById("reloadBtn");

// Elements for tracking offline time
const offlineTimeEl = document.getElementById("offlineTime");
const offlineCountEl = document.getElementById("offlineCount");

// Original failing URL
const urlParams = new URLSearchParams(window.location.search);
const originalUrl = urlParams.get("originalUrl") || "";

// Display the original URL distinctly
urlArea.textContent = originalUrl;

// Extract the base URL from the original URL (up to the first path segment)
let baseUrl = "";
let statusEndpoint = "";

if (originalUrl) {
  try {
    const url = new URL(originalUrl);
    baseUrl = url.origin;
    statusEndpoint = baseUrl + "/actuator/health/readiness";
  } catch (e) {
    console.error("Invalid URL:", originalUrl);
  }
}

// Load user preferences
browser.storage.local.get(["autoReloadEnabled", "errorPageDarkMode"], (items) => {
  toggleEl.checked = !!items.autoReloadEnabled;
  if (items.errorPageDarkMode) {
    document.body.classList.add("darkMode");
  } else {
    document.body.classList.remove("darkMode");
  }
});

// When user toggles, persist it
toggleEl.addEventListener("change", () => {
  browser.storage.local.set({
    autoReloadEnabled: toggleEl.checked
  });
});

// Reload button manually re-navigates to original
reloadBtn.addEventListener("click", () => {
  window.location = originalUrl;
});

// Keep track of seconds since the page loaded (offline time)
let offlineSeconds = 0;
const offlineTimer = setInterval(() => {
  offlineSeconds++;
  offlineCountEl.textContent = offlineSeconds;
}, 1000);

function checkServer() {
  fetch(statusEndpoint, { method: "GET" })
  .then(response => response.json())
  .then(data => {
    if (data.status === STATUS_UP_VALUE) {
      statusDiv.textContent = "Server is UP!";
      statusDiv.classList.add("statusUp");
      statusDiv.classList.remove("statusDown");
      reloadBtn.disabled = false;
      clearInterval(offlineTimer);
      if (toggleEl.checked) {
        window.location = originalUrl;
      }
    } else {
      statusDiv.textContent = "Server is DOWN, status: " + data.status;
      statusDiv.classList.add("statusDown");
      statusDiv.classList.remove("statusUp");
      reloadBtn.disabled = true;
      setTimeout(checkServer, 100);
    }
  })
  .catch(() => {
    statusDiv.textContent = "Server is unreachable. Waiting...";
    statusDiv.classList.add("statusDown");
    statusDiv.classList.remove("statusUp");
    reloadBtn.disabled = true;
    setTimeout(checkServer, 100);
  });
}

// Start polling in a short delay, so we have time to load the storage
setTimeout(checkServer, 200);
