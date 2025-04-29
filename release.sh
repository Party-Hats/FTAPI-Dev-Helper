#!/bin/bash

# FTAPI Dev Helper Release Script
# This script automates the release process for the FTAPI Dev Helper Chrome extension.

set -e  # Exit immediately if a command exits with a non-zero status

# Function to display script usage
show_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -h, --help                 Show this help message"
  echo "  -v, --version VERSION      Specify the new version (e.g., 1.1)"
  echo "  -m, --minor                Increment the minor version (e.g., 1.0 -> 1.1)"
  echo "  -p, --patch                Increment the patch version (e.g., 1.0 -> 1.0.1)"
  echo "  -M, --major                Increment the major version (e.g., 1.0 -> 2.0)"
  echo "  -n, --no-push              Don't push to remote repository"
  echo "  -d, --dry-run              Don't make any changes, just show what would happen"
}

# Function to extract the current version from manifest.json
get_current_version() {
  grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4
}

# Function to increment version
increment_version() {
  local version=$1
  local increment_type=$2
  
  # Split version into components
  IFS='.' read -ra VERSION_PARTS <<< "$version"
  
  # Ensure we have at least 2 parts (major.minor)
  if [ ${#VERSION_PARTS[@]} -lt 2 ]; then
    VERSION_PARTS+=(0)
  fi
  
  # Ensure we have at least 3 parts for patch (major.minor.patch)
  if [ ${#VERSION_PARTS[@]} -lt 3 ]; then
    VERSION_PARTS+=(0)
  fi
  
  case $increment_type in
    major)
      VERSION_PARTS[0]=$((VERSION_PARTS[0] + 1))
      VERSION_PARTS[1]=0
      VERSION_PARTS[2]=0
      ;;
    minor)
      VERSION_PARTS[1]=$((VERSION_PARTS[1] + 1))
      VERSION_PARTS[2]=0
      ;;
    patch)
      VERSION_PARTS[2]=$((VERSION_PARTS[2] + 1))
      ;;
  esac
  
  # Join version parts back together
  local new_version="${VERSION_PARTS[0]}.${VERSION_PARTS[1]}"
  
  # Add patch version if it's non-zero
  if [ "${VERSION_PARTS[2]}" != "0" ]; then
    new_version="${new_version}.${VERSION_PARTS[2]}"
  fi
  
  echo "$new_version"
}

# Function to update the version in manifest.json
update_version() {
  local current_version=$1
  local new_version=$2
  local dry_run=$3
  
  if [ "$dry_run" = true ]; then
    echo "Would update version in manifest.json from $current_version to $new_version"
  else
    echo "Updating version in manifest.json from $current_version to $new_version"
    sed -i "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" manifest.json
  fi
}

# Function to commit changes
commit_changes() {
  local new_version=$1
  local dry_run=$2
  
  if [ "$dry_run" = true ]; then
    echo "Would commit changes with message: 'Bump version to $new_version'"
  else
    echo "Committing changes..."
    git add manifest.json
    git commit -m "Bump version to $new_version"
  fi
}

# Function to create and push tag
create_and_push_tag() {
  local new_version=$1
  local no_push=$2
  local dry_run=$3
  
  if [ "$dry_run" = true ]; then
    echo "Would create tag: v$new_version"
    if [ "$no_push" = false ]; then
      echo "Would push tag to remote"
    fi
  else
    echo "Creating tag: v$new_version"
    git tag "v$new_version"
    
    if [ "$no_push" = false ]; then
      echo "Pushing tag to remote..."
      git push origin "v$new_version"
    else
      echo "Not pushing to remote (--no-push option used)"
      echo "To push manually, run: git push origin v$new_version"
    fi
  fi
}

# Default values
NEW_VERSION=""
INCREMENT_TYPE=""
NO_PUSH=false
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_usage
      exit 0
      ;;
    -v|--version)
      NEW_VERSION="$2"
      shift 2
      ;;
    -m|--minor)
      INCREMENT_TYPE="minor"
      shift
      ;;
    -p|--patch)
      INCREMENT_TYPE="patch"
      shift
      ;;
    -M|--major)
      INCREMENT_TYPE="major"
      shift
      ;;
    -n|--no-push)
      NO_PUSH=true
      shift
      ;;
    -d|--dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Get current version
CURRENT_VERSION=$(get_current_version)
echo "Current version: $CURRENT_VERSION"

# Determine new version
if [ -n "$NEW_VERSION" ]; then
  # Use specified version
  echo "Using specified version: $NEW_VERSION"
elif [ -n "$INCREMENT_TYPE" ]; then
  # Increment version based on type
  NEW_VERSION=$(increment_version "$CURRENT_VERSION" "$INCREMENT_TYPE")
  echo "Incremented $INCREMENT_TYPE version: $NEW_VERSION"
else
  # Prompt user for version if not specified
  read -p "Enter new version (current is $CURRENT_VERSION): " NEW_VERSION
  
  # If user didn't enter anything, increment minor version
  if [ -z "$NEW_VERSION" ]; then
    NEW_VERSION=$(increment_version "$CURRENT_VERSION" "minor")
    echo "No version specified, incrementing minor version to: $NEW_VERSION"
  fi
fi

# Validate new version format
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?$ ]]; then
  echo "Error: Invalid version format. Please use semantic versioning (e.g., 1.0 or 1.0.1)."
  exit 1
fi

# Check if working directory is clean
if [ "$DRY_RUN" = false ]; then
  if ! git diff-index --quiet HEAD --; then
    echo "Error: Working directory is not clean. Please commit or stash your changes before running this script."
    exit 1
  fi
fi

# Update version in manifest.json
update_version "$CURRENT_VERSION" "$NEW_VERSION" "$DRY_RUN"

# Commit changes
commit_changes "$NEW_VERSION" "$DRY_RUN"

# Create and push tag
create_and_push_tag "$NEW_VERSION" "$NO_PUSH" "$DRY_RUN"

echo "Release process completed successfully!"
echo "The GitHub Actions workflow should now be triggered to build and publish the release."