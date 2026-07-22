# Upgrade TCGC in a client emitter

Use this workflow for requests in the form `tcgc upgrade <emitter-name> <version>`. The dependency being upgraded is `@azure-tools/typespec-client-generator-core`.

Client emitters are outside the pnpm workspace. Use npm from the emitter package directory.

## 1. Establish the baseline

1. Locate `packages/<emitter-name>` and inspect its `package.json`.
2. Run `npm install`.
3. Run the package's `build` script, or its `compile`/`tsc` script if no build script exists.
4. Record pre-existing failures separately from upgrade failures.

## 2. Resolve the dependency set

1. Verify the requested TCGC version and inspect its peers:

   ```sh
   npm view @azure-tools/typespec-client-generator-core@<version> version
   npm view @azure-tools/typespec-client-generator-core@<version> peerDependencies --json
   ```

2. Set the TCGC development dependency to the exact requested version.
3. Align related `@azure-tools/*` and `@typespec/*` development dependencies with TCGC's peer requirements. Verify candidate versions with `npm view`.
4. Update the emitter's peer dependency lower bounds when required, but preserve its existing upper bounds and range style.
5. Keep the same package version everywhere it appears unless published peer constraints require otherwise.
6. Run plain `npm install` until dependency resolution succeeds and the lockfile is updated.

Do not use `--force`, `--legacy-peer-deps`, or omit peers. Do not delete or relax peer upper bounds. Do not use version ranges for development releases when they could resolve to a different stable release.

Confirm the installed graph with:

```sh
npm ls @azure-tools/typespec-client-generator-core
npm ls --all
```

## 3. Fix compatibility issues

1. Build immediately after the dependency update.
2. Group errors by changed TCGC API and find all affected call sites before editing.
3. Follow the new API's intended types and signatures; do not hide errors with `any`, broad assertions, or compiler suppression.
4. Rebuild after each related group of fixes until the package builds cleanly.
5. Add or update focused tests when emitted behavior changes.

## 4. Validate

Run the emitter's declared formatting, lint, build, and test scripts. Regenerate representative output when generator behavior may have changed, and inspect the resulting diff for unrelated churn.

Verify:

- TCGC resolves to the requested version.
- Peer and development dependency ranges remain compatible.
- The package lockfile reflects the final dependency graph.
- Build and relevant tests pass.
- Only migration-related files changed.

Add the emitter's required dependency changelog entry and summarize dependency changes, compatibility fixes, and validation results.
