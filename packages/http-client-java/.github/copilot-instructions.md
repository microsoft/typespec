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

# Add End2End Test Case

The typical task is to `add e2e test case for <package>, scenario is <url-to-tsp-file>`.

The source files to test are under `generator/http-client-generator-test/src/main/java/<package>`.
Read the `Builder` and `Client` Java file to understand the client structure, and APIs.
Read the Java files under `generator/http-client-generator-test/src/main/java/<package>/models` to understand the classes that be used in the APIs.

Read the `<url-to-tsp-file>` to understand the scenario for the test case. This TypeSpec file contains the expected HTTP request and response in `@scenarioDoc`.
Also try read the `client.tsp` in the same folder (replace `main.tsp` with `client.tsp` in the URL). This file is optional, ignore it if there is no such file.

Read a few existing test cases in `generator/http-client-generator-test/src/test/java/` to understand how to write the test case.

Then, add a test case in `generator/http-client-generator-test/src/test/java/<package>/` with the name `<scenario>Tests.java`.
