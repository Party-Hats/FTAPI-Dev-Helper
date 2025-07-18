# FTAPI Dev Helper

A Chrome extension offering various conveniences for FTAPI developers.

For questions, bugs or requests feel free to contact me directly or create an issue on GitHub.

> ## ⚠️ Caveats
> 
> ### AI-Generated Code
> This project is mainly generated by AI. While efforts have been made to ensure quality and functionality, there might be areas that could benefit from human review and refinement.
> 
> ### Browser Compatibility
> This project is primarily built for Chrome and might work for Firefox/Safari. The extension has been designed with Chrome as the primary target, but includes basic compatibility for Firefox. If you encounter issues with Firefox or Safari, feel free to contribute improvements to enhance cross-browser compatibility.

## How to Install

### From GitHub Releases (Recommended)

1. Go to the [Releases](https://github.com/derwild/FTAPI-Dev-Helper/releases) page
2. Download the latest version for your browser:
   - Chrome: `ftapi-dev-helper-chrome-x.x.x.zip`
   - Firefox: `ftapi-dev-helper-firefox-x.x.x.zip`
3. **For Chrome**:
   - Navigate to `chrome://extensions/`
   - Enable Developer Mode (toggle in top-right)
   - Drag and drop the downloaded ZIP file onto the page
4. **For Firefox**:
   - Navigate to `about:addons`
   - Click the gear icon and select "Install Add-on From File..."
   - Select the downloaded ZIP file

### From Source Code

1. **Obtain the code**: Clone this repository or download it as a ZIP and extract it.
2. **Open Browser Extensions Page**:
   - Chrome: Navigate to `chrome://extensions/`
   - Firefox: Navigate to `about:debugging#/runtime/this-firefox`
3. **Enable Developer Mode**:
   - Chrome: Use the toggle in the top-right corner
   - Firefox: Already in developer mode when using about:debugging
4. **Load the Extension**:
   - Chrome: Click **Load unpacked** and select the folder
   - Firefox: Click **Load Temporary Add-on** and select any file in the folder
5. **Reload When Needed**: If you update the code, reload the extension in your browser.

### Configuration Requirements

> **Important**: This project should NEVER have FTAPI-specific URLs in the code.

When you first install the extension, you'll be prompted to provide configuration values:

1. **Jenkins URL**: The base URL for your Jenkins instance
2. **Jenkins Mappings**: JSON configuration for mapping GitHub repositories to Jenkins jobs
3. **Auto-Close URLs**: List of URL patterns that should be automatically closed

These values must be provided during the installation process. To make it easier:

1. Look in the FTAPI wiki and search for "FTAPI Dev Helper Browser Extension"
2. You'll find a complete JSON configuration with sensible default values
3. Use the "Import from JSON" button on the setup page to import these values

This approach ensures that sensitive URLs and configurations are not hardcoded in the extension.

## Purpose

This extension streamlines common tasks when working on FTAPI projects, such as automatically handling a local SecuTransfer server restart and providing quick access to Jenkins builds for GitHub pull requests.  
All features can be toggled using the settings page of the extension.

## Features

### SecuTransfer Error Page

When the local SecuTransfer server is offline (e.g., after a restart), Chrome typically displays the default "This site can't be reached" page.  
This extension replaces that page with a custom status screen that periodically checks the server's health endpoint until it becomes available again.  
Depending on your preferences, it can either reload itself once the server is back or let you manually reload with a click.

### SecuTransfer Auto Refresh

While browsing SecuTransfer pages, this feature monitors the server's health in the background (checking once per second).  
If the server goes offline, a small popup appears in the top-right corner of the page showing the server status and time elapsed.  
When the server comes back online, the page can automatically refresh or wait for manual reload, based on your preferences.

Key features:
- Non-intrusive popup that doesn't interfere with page content
- Real-time server status monitoring
- Configurable auto-refresh option
- Dark mode support
- Completely disabled for API endpoints (/api/* and /rest-api/*) to avoid any interference with API calls

This feature complements the SecuTransfer Error Page by providing monitoring while you're actively using the application, rather than only when the server is already down.

### GitHub Pull Request Build Links

This feature allows you to quickly open all related Jenkins builds from a GitHub pull request:

1. When viewing a pull request, a button appears in the top-right corner of the page.
2. Clicking this button opens all mapped Jenkins job pages for that PR.
3. Each Jenkins page is monitored and reloaded until the build starts, sparing you from repeated manual refreshing.

### Auto-Close Tabs

This feature automatically closes specific browser tabs after a few seconds:

1. When a tab is opened that matches one of the configured URL patterns, it will be automatically closed after a configurable delay.
2. This is useful for tabs that are opened by desktop applications like Zoom and Slack, which you don't need to keep open.
3. You can configure the URL patterns and delay in the extension settings.

### Password Saver

This feature helps developers manage test credentials for development environments:

> ⚠️ **IMPORTANT**: Credentials are stored in plaintext and are NOT secure. This feature only works with the FTAPI local test server (https://testing.ftapi.com:8443) and will not trigger on any other server, thus it should be safe. Still, remember to only use this feature for this local test server and never for production or sensitive accounts.

1. Automatically detects login forms on web pages and optionally captures credentials when submitted.
2. Offers to save credentials within the extension for future use (stored in plaintext).
3. When revisiting a login page, displays saved credentials for that site.
4. Allows one-click login with saved credentials (auto-fills and submits the form).
5. Provides a management interface to view, edit, and delete saved credentials.
6. Supports setting a default entry for automatic login with configurable delay.
7. Features a progress bar with click-to-cancel functionality during auto-login countdown.

## Development and Releases

This extension uses GitHub Actions for automated builds and releases:

The release process works as follows:

1. When a tag with the format "v*" is pushed:
   - The release workflow is triggered
   - Builds both Chrome and Firefox versions of the extension
   - Creates a GitHub Release with the packaged extensions
   - Uploads the extensions as release assets

### Using the Release Script

The easiest way to create a new release is to use the provided release script:

```bash
./release.sh
```

This script will:
1. Extract the current version from manifest.json
2. Prompt you for a new version (or automatically increment the minor version if none is provided)
3. Update the version in manifest.json
4. Commit the changes
5. Create and push a tag with the format "v{version}"

The script also supports several options:

```
Options:
  -h, --help                 Show this help message
  -v, --version VERSION      Specify the new version (e.g., 1.1)
  -m, --minor                Increment the minor version (e.g., 1.0 -> 1.1)
  -p, --patch                Increment the patch version (e.g., 1.0 -> 1.0.1)
  -M, --major                Increment the major version (e.g., 1.0 -> 2.0)
  -n, --no-push              Don't push to remote repository
  -d, --dry-run              Don't make any changes, just show what would happen
```

### Manual Release Process

If you prefer to create a release manually:
1. Update the version in `manifest.json`
2. Create and push a tag with the format "v{version}": `git tag v{version} && git push origin v{version}`
