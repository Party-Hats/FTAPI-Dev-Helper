# Purpose

This is a chrome plugin I use to open corresponding jenkins builds after opening a pull request on github.

## Functionality

1. When navigating to the pull request page on github, a button will appear on the top right corner of the page. This button will open the jenikns build pages for the PR (normal and E2E build). It is only shown on the "Conversations" tab of the PR page.
2. When the PR pages are opened, it might take some time until the builds have actually started. The plugin will reload the page every few seconds until the builds are there.