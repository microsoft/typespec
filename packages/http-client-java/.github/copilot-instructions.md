> **Scope**: These instructions apply **only** to the `packages/http-client-java` sub-project in this monorepo. Use them whenever Copilot generates code, tests, commit messages, or pull request descriptions for the emitter. If Copilot is used in other sub-projects, these rules do not apply unless stated otherwise.

---

# Update Package for Latest Dependencies

Steps:

1. Run `ncu -u` on "package.json" in root and in both "generator/http-client-generator-clientcore-test" and "generator/http-client-generator-test" folders.
2. Update package versions in `peerDependencies` (keep the semver range) in root "package.json", according to the corresponding package versions in `devDependencies`.
3. Update package versions in `override` (keep the semver range) in the other 2 "package.json", according to the corresponding package versions in root "package.json".
4. Save the files, and run `npm install` in root, so that "package-lock.json" would be updated.

Developer may need to run `Generate.ps1` in "generator/http-client-generator-clientcore-test" and "generator/http-client-generator-test" folders, to update the e2e spector tests.

# Prepare for Minor/Patch Release

Steps:

1. Bump minor/patch version of `@typespec/http-client-java` in the 3 "package.json".
2. Save the file, and run `npm install` in root, so that "package-lock.json" would be updated.

The [publish to NPM](https://dev.azure.com/azure-sdk/internal/_build?definitionId=7294) would be automatically triggered, after the PR is merged.
