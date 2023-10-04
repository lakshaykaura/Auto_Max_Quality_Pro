# Yt_Max_Quality_Switcher

Browser extension that automatically switches YouTube videos to the highest available quality.

## Commit Message Guidelines

To ensure consistency and aid in automation (like auto version bumping), we have a set of guidelines for commit messages. The commit message should contain one of the following keywords to indicate the nature of the change:

- `Major Update: ` - Significant new features or changes.
- `Minor Update: ` - Small new features, enhancements, or changes.
- `Documentation Update: ` - Updates to documentation or README.
- `Bug Fix: ` - Fixes a bug.
- `Security Fix: ` - Fixes a security vulnerability.
- `Build: ` - Changes related to the build process.
- `CI: ` - Changes related to the Continuous Integration process.
- `Revert: ` - Reverts a previous commit.
- `Release: ` - Marks a new release.
- `Merge: ` - Merges branches.
- `Hotfix: ` - Quick fixes to address urgent issues.
- `New Feature: ` - Introduces a new feature.
- `Improvement: ` - Enhancements to existing functionality.
- `Performance: ` - Performance optimizations.
- `Style: ` - Cosmetic changes.
- `WIP: ` - Work in progress.

## Automated Versioning

We utilize a GitHub Actions workflow to automatically handle version bumping in our `manifest.json` based on the commit messages. The process is as follows:

- A commit with the `Release: ` keyword will bump the major version (e.g., `1.x` to `2.x`).
- Commits with keywords like `Major Update: `, `New Feature: `, etc., will bump the minor version (e.g., `1.1` to `1.2`).
- Commits with keywords like `Minor Update: `, `Documentation Update: `, etc., will bump the patch version (e.g., `1.1.1` to `1.1.2`).

Please adhere to these guidelines to ensure smooth automation and clear commit history.