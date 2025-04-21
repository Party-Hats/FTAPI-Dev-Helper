// passwords.js - listing/editing all dev credentials

(function() {
  const tableBody = document.getElementById("pwTableBody");

  // Helper function to trim URL to just host and port
  function trimUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.origin; // Returns protocol + hostname + port
    } catch (e) {
      return url; // Return original if parsing fails
    }
  }

  // Load devPasswords from storage
  browser.storage.local.get("devPasswords", (items) => {
    const data = items.devPasswords || {};
    populateTable(data);
  });

  function populateTable(devPasswords) {
    tableBody.innerHTML = ""; // clear existing

    // devPasswords structure: { url: { username: password, ... }, ... }
    Object.entries(devPasswords).forEach(([url, userMap]) => {
      Object.entries(userMap).forEach(([username, password]) => {
        addTableRow(devPasswords, url, username, password);
      });
    });
  }

  function addTableRow(devPasswords, url, username, password) {
    const tr = document.createElement("tr");

    // URL cell
    const urlTd = document.createElement("td");
    urlTd.textContent = url;
    tr.appendChild(urlTd);

    // Username cell
    const userTd = document.createElement("td");
    userTd.textContent = username;
    tr.appendChild(userTd);

    // Password cell (plaintext)
    const passTd = document.createElement("td");
    passTd.textContent = password;
    tr.appendChild(passTd);

    // Actions
    const actionTd = document.createElement("td");

    // Edit -> turn row into editable mode
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      enterEditMode(tr, devPasswords, url, username, password);
    });
    actionTd.appendChild(editBtn);

    // Delete -> remove this credential
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      delete devPasswords[url][username];
      if (Object.keys(devPasswords[url]).length === 0) {
        delete devPasswords[url]; // remove entire URL if no more users
      }
      browser.storage.local.set({ devPasswords }, () => {
        tr.remove();
      });
    });
    actionTd.appendChild(delBtn);

    tr.appendChild(actionTd);
    tableBody.appendChild(tr);
  }

  function enterEditMode(tr, devPasswords, oldUrl, oldUser, oldPass) {
    // Clear row cells, replace with inputs
    tr.innerHTML = "";

    const urlTd = document.createElement("td");
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.value = oldUrl;
    urlInput.title = "Only protocol, hostname and port will be used (path will be ignored)";
    urlTd.appendChild(urlInput);

    const userTd = document.createElement("td");
    const userInput = document.createElement("input");
    userInput.type = "text";
    userInput.value = oldUser;
    userTd.appendChild(userInput);

    const passTd = document.createElement("td");
    const passInput = document.createElement("input");
    passInput.type = "text";
    passInput.value = oldPass;
    passTd.appendChild(passInput);

    const actionTd = document.createElement("td");

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => {
      const newUrl = trimUrl(urlInput.value.trim());
      const newUser = userInput.value.trim();
      const newPass = passInput.value;

      // Remove old entry
      if (devPasswords[oldUrl] && devPasswords[oldUrl][oldUser]) {
        delete devPasswords[oldUrl][oldUser];
        if (Object.keys(devPasswords[oldUrl]).length === 0) {
          delete devPasswords[oldUrl];
        }
      }
      // Add new entry
      if (!devPasswords[newUrl]) {
        devPasswords[newUrl] = {};
      }
      devPasswords[newUrl][newUser] = newPass;

      browser.storage.local.set({ devPasswords }, () => {
        // Rebuild table
        rebuildTable(devPasswords);
      });
    });
    actionTd.appendChild(saveBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      // revert row
      rebuildTable(devPasswords);
    });
    actionTd.appendChild(cancelBtn);

    tr.appendChild(urlTd);
    tr.appendChild(userTd);
    tr.appendChild(passTd);
    tr.appendChild(actionTd);
  }

  function rebuildTable(devPasswords) {
    tableBody.innerHTML = "";
    Object.entries(devPasswords).forEach(([url, userMap]) => {
      Object.entries(userMap).forEach(([username, password]) => {
        addTableRow(devPasswords, url, username, password);
      });
    });
  }
})();
