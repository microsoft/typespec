> **Scope**: These instructions apply **only** to the `packages/http-client-java` sub-project in this monorepo. Use them whenever Copilot generates code, tests, commit messages, or pull request descriptions for the emitter. If Copilot is used in other sub-projects, these rules do not apply unless stated otherwise.

---

# Update package for latest compiler

Steps:
1. Run `ncu -u` on "package.json" in root and in both "generator/http-client-generator-clientcore-test" and "generator/http-client-generator-test" folders.
2. Bump the minor version of `@typespec/http-client-java` in the 3 "package.json".
3. Update `peerDependencies` in root "package.json", according to the versions in `devDependencies`.
4. Update `override` in the other 2 "package.json", according to the versions in root "package.json".
5. Run `Geenrate.ps1` in "generator/http-client-generator-clientcore-test" and "generator/http-client-generator-test" folders.

The [publish to NPM](https://dev.azure.com/azure-sdk/internal/_build?definitionId=7294) would be automatically triggered, after the PR is merged.
