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

Our repository uses a GitHub Actions workflow to automate version bumping in our `manifest.json` based on the patterns detected in the commit messages. Here's how the versioning automation works:

- **Major Version Bump (e.g., `1.x.y` to `2.0.0`)**: Triggered by commit messages containing the `Release: ` keyword.

- **Minor Version Bump (e.g., `1.1.y` to `1.2.0`)**:
  - `Major Update: `: Indicates substantial changes or enhancements.
  - `New Feature: `: Introduces completely new functionality to the extension.
  - `Improvement: `: Enhancements to existing features without adding entirely new ones.
  - `Performance: `: Changes that optimize the extension's performance.
  - `Bug Fix: `: Resolves a bug or unexpected behavior in the extension.
  - `Security Fix: `: Addresses vulnerabilities to improve the extension's security.
  - `Hotfix: `: Quick patches to resolve urgent, impactful issues.

- **Patch Version Bump (e.g., `1.1.1` to `1.1.2`)**:
  - `Minor Update: `: Less significant changes or tweaks.
  - `Documentation Update: `: Changes strictly related to documentation.
  - `Build: `: Updates or changes related to the build process.
  - `CI: `: Modifications concerning the Continuous Integration setup.
  - `Revert: `: Rolling back a previous commit.
  - `Merge: `: Merging branches, typically from pull requests.
  - `Style: `: Cosmetic or stylistic code changes, no functional impact.
  - `WIP: `: Temporary commits for work in progress, typically not used in the main branch.

This automation helps in maintaining consistency in versioning, reducing manual error, and providing clarity about the nature and significance of changes in each release. When contributing, ensure your commit messages align with the above guidelines to correctly trigger the desired version bump.

Please adhere to these guidelines to ensure smooth automation and clear commit history.