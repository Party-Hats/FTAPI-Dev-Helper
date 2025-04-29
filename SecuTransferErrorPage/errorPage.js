const STATUS_UP_VALUE = "UP";

if (typeof browser === "undefined") {
  var browser = chrome;
}

const urlArea = document.getElementById("urlArea");
const statusDiv = document.getElementById("statusArea");
const toggleEl = document.getElementById("autoToggle");
const reloadBtn = document.getElementById("reloadBtn");

const offlineTimeEl = document.getElementById("offlineTime");
const offlineCountEl = document.getElementById("offlineCount");

const urlParams = new URLSearchParams(window.location.search);
const originalUrl = urlParams.get("originalUrl") || "";

urlArea.textContent = originalUrl;

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

browser.storage.local.get(["autoReloadEnabled", "errorPageDarkMode"], (items) => {
  toggleEl.checked = !!items.autoReloadEnabled;
  if (items.errorPageDarkMode) {
    document.body.classList.add("darkMode");
  } else {
    document.body.classList.remove("darkMode");
  }
});

toggleEl.addEventListener("change", () => {
  browser.storage.local.set({
    autoReloadEnabled: toggleEl.checked
  });
});

reloadBtn.addEventListener("click", () => {
  window.location = originalUrl;
});

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

setTimeout(checkServer, 200);
