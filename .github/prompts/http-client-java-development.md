> **Scope**: These instructions apply **only** to the `packages/http-client-java` sub-project in this monorepo. Use them whenever Copilot generates code, tests, commit messages, or pull request descriptions for the emitter. If Copilot is used in other sub-projects, these rules do not apply unless stated otherwise.

---

- The directories mentioned in this instruction are relative to `<repository-root>/packages/http-client-java`. For example, the root is the folder `<repository-root>/packages/http-client-java`; the directory `generator/http-client-generator-test` refers to `<repository-root>/packages/http-client-java/generator/http-client-generator-test`.
- Always use absolute paths when changing directories or running scripts.

# Update Node.js packages for latest dependencies

Steps:

1. Run `ncu -u` on `package.json` in the root and on the two `package.json` files in `generator/http-client-generator-clientcore-test` and `generator/http-client-generator-test`.
2. Update package versions in `peerDependencies` (keep the semver ranges) in the root `package.json` to match the corresponding package versions listed in `devDependencies`.
3. Update package versions in `override` (keep the semver ranges) in the other two `package.json` files to match the corresponding package versions in the root `package.json`.
4. Save the files and run `npm install` in the root so that `package-lock.json` is updated.
5. Commit the changes to `package.json` and `package-lock.json`.
6. If there is an update to the `http-specs` or `azure-http-specs` libraries, run `Generate.ps1` in `generator/http-client-generator-test` and commit the generated changes in that folder.
7. If there is an update to the `http-specs` library, run `Generate.ps1` in `generator/http-client-generator-clientcore-test` and commit the generated changes in that folder.

# Prepare for minor/patch release

Steps:

1. Bump the minor or patch version of `@typespec/http-client-java` in the three `package.json` files.
2. Save the files and run `npm install` in the root so that `package-lock.json` is updated.

The publish workflow (to NPM) will be automatically triggered after the PR is merged: https://dev.azure.com/azure-sdk/internal/_build?definitionId=7294

# Add end-to-end (e2e) test case

Typical task: `add e2e test case for <package>, scenario is <url-to-tsp-file>`.

1. The source files for the generated client under test are located in `generator/http-client-generator-test/src/main/java/<package>`.
2. Read the `Builder` and `Client` Java files to understand the client structure and available APIs.
3. Read the Java model classes under `generator/http-client-generator-test/src/main/java/<package>/models` to understand the data types used by the APIs.
4. Read the TypeSpec file at the given `<url-to-tsp-file>` to understand the scenario. The TypeSpec file contains the expected HTTP request and response in the `@scenarioDoc` decorator.
5. Optionally, check for a `client.tsp` in the same folder (replace `main.tsp` with `client.tsp` in the URL). Use it if present.
6. Review a few existing test cases in `generator/http-client-generator-test/src/test/java/` to learn the test structure and patterns used. Do not read file under `**/generated` folder.
7. Add a new test class in `generator/http-client-generator-test/src/test/java/<package>/` named `<Scenario>Tests.java`, following existing conventions. The test class should not extend other class.
