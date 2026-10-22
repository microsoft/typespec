---
name: http-client-python-bump-and-release
description: Create a PR to bump TypeSpec/Azure Tools dependencies, update peer dependencies, or release a new version of the http-client-python package.
---

# HTTP Client Python Bump and Release

Create a PR to bump dependencies and release a new version of the http-client-python package.

> **Note:** `{REPO}` refers to the root folder of the `microsoft/typespec` repository.

## Prerequisites

Before starting, verify that `npm-check-updates` is available:

```bash
npx npm-check-updates --version
```

If the command fails or prompts for installation, install it globally:

```bash
npm install -g npm-check-updates
```

## Workflow

Before starting or resuming, inspect the working tree, current branch, remotes, and existing release commits. Preserve existing task work. If the branch already contains the prepared release, continue from the first incomplete step instead of repeating dependency updates or incrementing the version again.

1. Navigate to the package directory:

   ```bash
   cd {REPO}/packages/http-client-python
   ```

2. For a new release, fetch `main` from the remote whose URL points to `microsoft/typespec`:

   ```bash
   git fetch <microsoft-remote> main
   ```

   Do not reset or discard existing changes to prepare a release.

3. Create release branch (use current date in MM-DD format), unless the environment already supplied the task branch:

   ```bash
   git switch --create publish/python-release-{MM-DD} <microsoft-remote>/main
   ```

   If the name belongs to unrelated work, choose an unused suffix; never overwrite it. Record the actual task branch with `git branch --show-current` for publishing and PR verification.

4. Update dependencies:

   ```bash
   npx npm-check-updates -u --filter @typespec/*,@azure-tools/* --packageFile package.json
   ```

5. Update `peerDependencies` in package.json:
   - If format is `">=0.a.b <1.0.0"`: Update only the `0.a.b` portion, keep the range format unchanged
   - If format is `"^1.a.b"`: Update to the latest version

6. Verify `devDependencies` versions for specs:
   - Check `@typespec/http-specs` and `@azure-tools/azure-http-specs`
   - If the original version in `package.json` is newer than the updated value, keep the original version
   - Dev versions are typically in the form `x.y.z-alpha.N-dev.M` (e.g., `0.1.0-alpha.37-dev.3`).

   Example:
   - Original: `@typespec/http-specs: 0.1.0-alpha.12-dev.5`, updated by step 4 to `0.1.0-alpha.11` → keep `0.1.0-alpha.12-dev.5`.
   - Original: `@typespec/http-specs: 0.1.0-alpha.12-dev.5`, updated by step 4 to `0.1.0-alpha.12` → keep `0.1.0-alpha.12` (step 4 works as expected).
   - Original: `@azure-tools/azure-http-specs: 0.1.0-alpha.12-dev.2`, updated to `0.1.0-alpha.11` → keep `0.1.0-alpha.12-dev.2`.
   - Original: `@azure-tools/azure-http-specs: 0.1.0-alpha.12-dev.2`, updated to `0.1.0-alpha.12` → keep `0.1.0-alpha.12` (step 4 works as expected).

7. Run version change script:

   ```bash
   npm run change:version
   ```

   Check the command's exit status and investigate partial changes on failure. Verify that the script updated both the emitter version in `package.json` and `CHANGELOG.md`. If neither file was updated:
   - Increment the third component of the emitter version in `package.json` (for example, `a.b.c` to `a.b.(c+1)`).
   - Add this entry near the top of `CHANGELOG.md`, immediately after the changelog title:

     ```markdown
     ## <new emitter version>

     ### Bump dependencies

     - Bump dependencies of `@typespec/*` and `@azure-tools/*` to latest versions
     ```

   - Verify that the version in `package.json` matches the new `CHANGELOG.md` heading.

8. Build and commit:

   ```bash
   npm install && npm run build
   ```

   Complete the repository's applicable validation before committing. Stage only the release files and any explicitly requested skill update; do not stage unrelated work. Use a conventional commit message and the required co-author trailer. Preserve existing release commits when resuming.

9. Publish the actual task branch:
   - Identify the push remote by URL, following the repository's personal-fork rules; do not assume it is `origin`.
   - Prefer authenticated Git and `gh`. If GitHub CLI is unavailable or unauthenticated, discover and try an available authenticated GitHub/VS Code publishing integration before asking the user to log in.
   - Git authentication is independent of `gh`: check it with `git push --dry-run <fork-remote> HEAD`. Public fetch access and read-only API access do not establish push permission.
   - Publish with Git, or let a publishing-capable PR integration publish the branch:

   ```bash
   git push --set-upstream <fork-remote> HEAD
   ```

10. Create and verify the PR:
    - Target `microsoft/typespec`, base `main`, from the actual published branch, with the exact title `[python] release new version` and an empty body. Reuse an existing matching open PR rather than creating a duplicate.
    - Use an available authenticated integration; GitHub CLI is optional. With authenticated CLI access:

    ```bash
    gh pr create --repo microsoft/typespec --base main --head <fork-owner>:<actual-branch> --title "[python] release new version" --body ""
    ```

    - Verify the created PR's repository, base and head branches, head commit, exact title, empty body, and release files. If the user requested skill changes in this PR, verify they are included too.
    - Inspect publishing errors before retrying. For example, `Callback URL is required` indicates the VS Code integration is unavailable; fall back to another authorized publishing route, not another identical tool call.
    - If Git and all available publishing integrations are blocked, report the errors and request authentication, such as `gh auth login` and `gh auth setup-git`, or integration repair. Never ask for a token in chat. Resume at publishing once access is restored.
    - A local commit or branch push is not completion: return a verified PR URL, or explicitly report that PR creation is blocked. Do not publish to npm or merge the PR.

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
