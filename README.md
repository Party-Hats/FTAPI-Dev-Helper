# FTAPI Dev Helper

A Chrome extension offering various conveniences for FTAPI developers.

For questions, bugs or requests feel free to contact me directly or create an issue on GitHub.

## Purpose

This extension streamlines common tasks when working on FTAPI projects, such as automatically handling a local SecuTransfer server restart and providing quick access to Jenkins builds for GitHub pull requests.  
All features can be toggled using the settings page of the extension.

## Features

### SecuTransfer Error Page

When the local SecuTransfer server is offline (e.g., after a restart), Chrome typically displays the default “This site can’t be reached” page.  
This extension replaces that page with a custom status screen that periodically checks the server’s health endpoint until it becomes available again.  
Depending on your preferences, it can either reload itself once the server is back or let you manually reload with a click.

### GitHub Pull Request Build Links

This feature allows you to quickly open all related Jenkins builds from a GitHub pull request:

1. When viewing a pull request, a button appears in the top-right corner of the page.
2. Clicking this button opens all mapped Jenkins job pages for that PR.
3. Each Jenkins page is monitored and reloaded until the build starts, sparing you from repeated manual refreshing.

## How to Install

1. **Obtain the code**: Clone this repository or download it as a ZIP and extract it.
2. **Open Chrome’s Extensions Page**: Navigate to`chrome://extensions/` in your browser.
3. **Enable Developer Mode**: Use the toggle in the top-right corner.
4. **Load the Extension**: Click **Load unpacked** and select the folder where you placed the extension files.
5. **Reload When Needed**: If you update the code (e.g., by pulling the latest changes), go back to `chrome://extensions/` and click **Reload**on this extension.

---

For advanced options—such as configuring which Jenkins builds to open or
how the extension handles server restarts—open the extension’s **Settings**
page.
