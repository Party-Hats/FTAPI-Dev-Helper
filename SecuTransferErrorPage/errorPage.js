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

// We'll store these after we load from storage
let baseUrl = "https://testing.ftapi.com:8443"; // fallback
let statusEndpoint = baseUrl + "/actuator/health/readiness";

// Original failing URL
const urlParams = new URLSearchParams(window.location.search);
const originalUrl = urlParams.get("originalUrl") || "https://testing.ftapi.com:8443";

// Display the original URL distinctly
urlArea.textContent = originalUrl;

// Load user preferences
chrome.storage.local.get(["autoReloadEnabled", "errorPageDarkMode", "errorPageUrl"], (items) => {
  toggleEl.checked = !!items.autoReloadEnabled;
  if (items.errorPageDarkMode) {
    document.body.classList.add("darkMode");
  } else {
    document.body.classList.remove("darkMode");
  }
  if (typeof items.errorPageUrl === "string" && items.errorPageUrl.trim() !== "") {
    baseUrl = items.errorPageUrl.trim();
  }
  // Rebuild the endpoint
  statusEndpoint = baseUrl.replace(/\/+$/, "") + "/actuator/health/readiness";
});

// When user toggles, persist it
toggleEl.addEventListener("change", () => {
  chrome.storage.local.set({
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
