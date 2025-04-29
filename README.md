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

---

For advanced options—such as configuring which Jenkins builds to open or
how the extension handles server restarts—open the extension’s **Settings**
page.
