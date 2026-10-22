---
name: http-client-python-bump-and-release
description: "Release @typespec/http-client-python with updated TypeSpec/Azure Tools dependencies. Use when: bumping Python emitter dependencies, preparing a release, resuming a release branch, or creating its release PR."
---

# HTTP Client Python Bump and Release

Prepare, validate, and publish a release PR for `@typespec/http-client-python`.

> **Note:** `{REPO}` refers to the root folder of the `microsoft/typespec` repository.

## Requirements

- Release only `@typespec/http-client-python`. This package is excluded from the pnpm workspace; use its npm scripts for installation, building, tests, formatting, and linting.
- Preserve existing task changes and commits. Reuse a supplied task branch or an existing release branch when resuming; do not bump an already prepared release again.
- Never reset, clean, delete, or overwrite unrelated changes or existing branches.
- Use an available authenticated integration for publishing and PR creation. An unauthenticated GitHub CLI is not proof that other integrations are unavailable.
- Do not publish an npm package or merge the PR. Completion means a verified release PR exists unless the user explicitly requests local preparation only.

## Workflow

### 1. Prepare or Resume the Task Branch

1. From `{REPO}`, inspect `git status --short`, the current branch, remotes, and existing task commits. Identify the remote for `microsoft/typespec` by URL, not by assuming its name is `origin`.
2. If a task or release branch already contains the intended release changes, retain it and continue from the first incomplete step. Record its actual name and the prepared version. Do not rerun versioning or dependency installation without a reason.
3. Otherwise, fetch `main` from the Microsoft remote and create an unused branch from that remote's `main`:

   ```bash
   git fetch <microsoft-remote> main
   git switch --create publish/python-release-<MM-DD> <microsoft-remote>/main
   ```

   Use the current date. If the name is occupied by unrelated work, choose an unused suffix; do not overwrite it. If existing uncommitted changes prevent switching safely, stop and ask rather than discarding them.

4. Record the actual branch with `git branch --show-current`. Run the following package commands from `{REPO}/packages/http-client-python` unless otherwise stated.

### 2. Update Dependencies

1. Verify `npm-check-updates` is available:

   ```bash
   npx --no-install npm-check-updates --version
   ```

   If missing, install it with `npm install -g npm-check-updates`.

2. Record the original dependency versions, especially the peer ranges and the two spec packages. Update only the TypeSpec/Azure Tools dependencies:

   ```bash
   npx --no-install npm-check-updates -u --filter '@typespec/*,@azure-tools/*' --packageFile package.json
   ```

3. Update `peerDependencies` to the corresponding latest versions while preserving the existing range format:
   - For `">=0.a.b <1.0.0"`, update only the lower bound; keep `<1.0.0`.
   - For `"^1.a.b"`, update the version and keep `^`.
4. Verify `@typespec/http-specs` and `@azure-tools/azure-http-specs` did not regress. Compare semantic versions rather than strings. Preserve an original development prerelease if it is newer than the proposed update:
   - `0.1.0-alpha.12-dev.5` is newer than `0.1.0-alpha.11`: keep the original.
   - `0.1.0-alpha.12` is newer than `0.1.0-alpha.12-dev.5`: accept the update.
5. If dependencies are already current, report that fact and continue with the release.

### 3. Version the Python Emitter

1. Record the original package version, then run:

   ```bash
   npm run change:version
   ```

2. Check the command's exit status and inspect its effects on the package, changelog, and change files. A failure or a partial version bump is not success. Investigate partial changes before continuing.
3. If both `package.json` and `CHANGELOG.md` remain unchanged, including when pnpm fails during root dependency setup, use the manual fallback instead of repeatedly retrying the same failing setup:
   - Increment only the patch component from `a.b.c` to `a.b.(c+1)`.
   - Add this entry immediately below the changelog title:

     ```markdown
     ## <new emitter version>

     ### Bump dependencies

     - Bump dependencies of `@typespec/*` and `@azure-tools/*` to latest versions
     ```

4. Verify the package version matches the newest changelog heading. If Chronus generated a release entry, keep it instead of adding a duplicate.

### 4. Install and Validate

1. Install dependencies and update the package-local lockfile:

   ```bash
   npm install
   ```

   If the configured Azure npm mirror fails with a missing public package or tarball, report the error and retry public dependencies against npmjs without changing repository or global registry settings:

   ```bash
   npm install --registry=https://registry.npmjs.org --replace-registry-host=always
   ```

   Do not bypass supply-chain checks or expose credentials. For authentication failures affecting non-public packages, use an available authorized integration or report the blocker. Keep lockfile changes scoped to this release and its transitive dependency updates.

2. Build and run emitter tests:

   ```bash
   npm run build
   npm run test:emitter
   ```

   ```bash
   npm run format
   npm run lint
   ```

3. If formatting fails only because unrelated root Prettier plugins are unavailable, report that limitation and validate the changed JSON files with the repository's scalar formatting settings. For the current configuration:

   ```bash
   npm exec -- prettier --no-config --print-width 100 --end-of-line lf --write package.json package-lock.json
   npm exec -- prettier --no-config --print-width 100 --end-of-line lf --check package.json package-lock.json
   ```

   Run lint separately even if formatting failed. Do not claim the full formatter passed. For modified skill Markdown, validate its frontmatter and format it using the same scalar settings; do not skip applicable plugins for source-code changes.

4. Compile a small TypeSpec service with `@typespec/http-client-python`, verify it generated Python files, and check their syntax. Use a task-owned temporary location and remove only those smoke-test files afterward.
5. Verify the package and lockfile versions agree, the lockfile matches the manifest, and installed peer dependencies satisfy all declared ranges.
6. From `{REPO}`, add an `internal` change description for only the Python emitter after versioning:

   ```bash
   pnpm chronus add @typespec/http-client-python --kind internal --message "Release @typespec/http-client-python <version> with updated dependencies."
   ```

   Verify an actual valid file was created; a zero exit status or `No package changed. Exiting.` is not sufficient. If Chronus is unavailable or creates no file, report the outcome and manually create a uniquely named `.md` file under `.chronus/changes/`:

   ```markdown
   ---
   changeKind: internal
   packages:
     - "@typespec/http-client-python"
   ---

   Release @typespec/http-client-python <version> with updated dependencies.
   ```

   Do not rerun versioning after adding this file; it must remain in the release PR.

7. Inspect `git diff --check`, `git diff --stat`, and `git status --short`. Expected changes are the Python package's `package.json`, `package-lock.json`, `CHANGELOG.md`, change files consumed by Chronus, and the new `internal` change file. Include skill changes only when the user requested them in this PR. Investigate unexpected changes before committing.

### 5. Commit, Publish, and Verify the Pull Request

1. Stage only the validated release files, including the new internal change file and any explicitly requested skill update. Commit with a conventional message such as `chore(python): release <version>` and any required co-author trailer. When resuming, preserve existing release commits and add a new commit for additional changes; do not amend unless requested.
2. Publish the actual task branch using an available authenticated mechanism, such as Git, a VS Code GitHub integration, or the environment's publishing workflow. Follow repository rules for personal forks; do not assume the push remote is `origin`.
3. Prefer authenticated `gh` when available. Otherwise discover and try an authenticated GitHub/VS Code publishing or PR integration before asking the user to log in. If the PR tool can publish an unpublished branch, let it do so and verify the published result.
   - A VS Code PR tool error such as `Callback URL is required` means that integration is unavailable, not that the PR title or body needs changing. Fall back to Git and `gh`; do not repeat the same tool call unchanged.
   - Check Git publishing independently of `gh` authentication with `git push --dry-run <fork-remote> HEAD`. Public fetch access and read-only GitHub tools do not establish push permission.
   - If neither Git nor a publishing integration can authenticate, ask the user to run `gh auth login` and, when needed, `gh auth setup-git`, or repair the integration. Do not ask them to paste a token into chat. Resume from publishing after authentication; do not repeat versioning or validation of unchanged files.
4. Create a non-draft PR against `microsoft/typespec`, targeting `main`, with the exact title `[python] release new version` and an empty body. Reuse an existing matching open release PR rather than creating a duplicate.
   With authenticated Git and CLI access, use:

   ```bash
   git push --set-upstream <fork-remote> HEAD
   gh pr create --repo microsoft/typespec --base main --head <fork-owner>:<actual-branch> --title "[python] release new version" --body ""
   ```

5. Verify the returned PR's repository, base and actual head branch, head commit, exact title, empty body, release file list, and inclusion of the internal change file and any requested skill update. A local commit or a branch push alone is not completion.
6. If a publishing attempt fails, inspect the actual error, correct the documented workflow when warranted, and retry through an available authorized integration. Do not retry unchanged failures indefinitely, fabricate a PR URL, or report an unpublished branch as a completed release. If no authenticated publishing mechanism works, report the specific blocker and request the minimum user action needed.

## Post-Process Review

1. After the pull request is created, review the complete release run: commands executed, command output, manual interventions, validation results, changed files, commit, push, cleanup, and PR creation.
2. Update this skill only when the completed run provides a concrete finding and a strong reason for the change, such as:
   - A documented step failed or produced an incorrect result.
   - The agent needed an undocumented manual correction to complete the release.
   - A step was ambiguous enough to create a real risk or delay.
   - A command was unnecessary or could be replaced by a demonstrably safer or more reliable command.
3. Do not change the skill based on preference, speculation, or an unobserved edge case. For every update, record the observed evidence and explain why the edit improves future releases.
4. Keep any skill update focused and validate its formatting and frontmatter. Keep it separate from the release PR unless the user explicitly asks to include it there; in that case commit it on the release branch, publish it, and verify the PR contains it.
5. If the review finds no evidence-backed improvement, leave the skill unchanged and state that no update was warranted.
6. Return the actual branch, prepared `@typespec/http-client-python` version, commit hash, verified PR URL, validation results and limitations, review findings, and any skill update. Distinguish a prepared release PR from an npm publication.
