(function() {
  if (typeof browser === "undefined") {
    var browser = chrome;
  }
  const tableBody = document.getElementById("pwTableBody");

  function trimUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.origin;
    } catch (e) {
      return url;
    }
  }

  browser.storage.local.get("devPasswords", (items) => {
    const data = items.devPasswords || {};
    populateTable(data);
  });

  function populateTable(devPasswords) {
    tableBody.innerHTML = "";

    Object.entries(devPasswords).forEach(([url, userMap]) => {
      Object.entries(userMap).forEach(([username, password]) => {
        addTableRow(devPasswords, url, username, password);
      });
    });
  }

  function addTableRow(devPasswords, url, username, password) {
    const tr = document.createElement("tr");

    // Add default checkbox cell
    const defaultTd = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "default-checkbox";

    // Check if this entry is the default
    browser.storage.sync.get(["defaultPasswordEntry"], (items) => {
      if (items.defaultPasswordEntry && 
          items.defaultPasswordEntry.url === url && 
          items.defaultPasswordEntry.username === username) {
        checkbox.checked = true;
      }
    });

    // Add event listener to handle selection
    checkbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        // Uncheck all other checkboxes
        document.querySelectorAll(".default-checkbox").forEach(cb => {
          if (cb !== e.target) {
            cb.checked = false;
          }
        });

        // Save this entry as the default
        browser.storage.sync.set({
          defaultPasswordEntry: {
            url: url,
            username: username,
            password: password
          }
        });
      } else {
        // If unchecked, remove the default entry
        browser.storage.sync.remove("defaultPasswordEntry");
      }
    });

    defaultTd.appendChild(checkbox);
    tr.appendChild(defaultTd);

    const urlTd = document.createElement("td");
    urlTd.textContent = url;
    tr.appendChild(urlTd);

    const userTd = document.createElement("td");
    userTd.textContent = username;
    tr.appendChild(userTd);

    const passTd = document.createElement("td");
    passTd.textContent = password;
    tr.appendChild(passTd);

    const actionTd = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => {
      enterEditMode(tr, devPasswords, url, username, password);
    });
    actionTd.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      // Check if this is the default entry
      const isDefault = checkbox.checked;

      delete devPasswords[url][username];
      if (Object.keys(devPasswords[url]).length === 0) {
        delete devPasswords[url];
      }

      // If this was the default entry, remove it from storage
      if (isDefault) {
        browser.storage.sync.remove("defaultPasswordEntry");
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
    // Store the checkbox state before clearing the row
    let isDefault = false;
    const checkbox = tr.querySelector(".default-checkbox");
    if (checkbox) {
      isDefault = checkbox.checked;
    }

    tr.innerHTML = "";

    // Add default checkbox cell
    const defaultTd = document.createElement("td");
    const newCheckbox = document.createElement("input");
    newCheckbox.type = "checkbox";
    newCheckbox.className = "default-checkbox";
    newCheckbox.checked = isDefault;
    newCheckbox.disabled = true; // Disable during edit mode
    defaultTd.appendChild(newCheckbox);
    tr.appendChild(defaultTd);

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
      const wasDefault = newCheckbox.checked;

      if (devPasswords[oldUrl] && devPasswords[oldUrl][oldUser]) {
        delete devPasswords[oldUrl][oldUser];
        if (Object.keys(devPasswords[oldUrl]).length === 0) {
          delete devPasswords[oldUrl];
        }
      }

      if (!devPasswords[newUrl]) {
        devPasswords[newUrl] = {};
      }
      devPasswords[newUrl][newUser] = newPass;

      // Update the default entry if this was the default
      if (wasDefault) {
        browser.storage.sync.get(["defaultPasswordEntry"], (items) => {
          if (items.defaultPasswordEntry && 
              items.defaultPasswordEntry.url === oldUrl && 
              items.defaultPasswordEntry.username === oldUser) {
            browser.storage.sync.set({
              defaultPasswordEntry: {
                url: newUrl,
                username: newUser,
                password: newPass
              }
            });
          }
        });
      }

      browser.storage.local.set({ devPasswords }, () => {
        rebuildTable(devPasswords);
      });
    });
    actionTd.appendChild(saveBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
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
