# Purpose

This is a chrome plugin I use to open corresponding jenkins builds after opening a pull request on github.

## Functionality

1. When navigating to the pull request page on github, a button will appear on the top right corner of the page. This button will open the jenikns build pages for the PR (normal and E2E build). It is only shown on the "Conversations" tab of the PR page.
2. When the PR pages are opened, it might take some time until the builds have actually started. The plugin will reload the page every few seconds until the builds are there.

## How to install

1. Clone the repository
2. Open the Chrome extensions page (chrome://extensions/)
3. Enable developer mode (top right corner)
4. Click on "Load unpacked" and select the folder where you cloned the repository
5. The extension should now be installed
6. If you want to update the extension, you can just pull the latest changes and reload the extension in the extensions page