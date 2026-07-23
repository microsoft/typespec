---
applyTo: "packages/http-client-java/**/*"
---

- The directories mentioned in this instruction are relative to `<repository-root>/packages/http-client-java`. For example, the root is the folder `<repository-root>/packages/http-client-java`; the directory `generator/http-client-generator-test` refers to `<repository-root>/packages/http-client-java/generator/http-client-generator-test`.
- Always use absolute paths when changing directories or running scripts.
- Whenever calling `npm`, use `--registry=https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/`.

# Update Node.js packages for latest dependencies

Steps:

1. Run `ncu -u` on `package.json` in the root and on the two `package.json` files in `generator/http-client-generator-clientcore-test` and `generator/http-client-generator-test`.
2. Update package versions in `peerDependencies` (keep the semver ranges) in the root `package.json` to match the corresponding package versions listed in `devDependencies`.
3. Update package versions in `overrides` (keep the semver ranges) in the other two `package.json` files to match the corresponding package versions in the root `package.json`.
4. Save the files and run `npm install` in the root so that `package-lock.json` is updated.
5. Commit the changes to `package.json` and `package-lock.json`.
6. If there is an update to the `http-specs` or `azure-http-specs` libraries, run `Generate.ps1` in `generator/http-client-generator-test` and commit the generated changes in that folder.
7. If there is an update to the `http-specs` library, run `Generate.ps1` in `generator/http-client-generator-clientcore-test` and commit the generated changes in that folder.
8. Call `pnpm change add @typespec/http-client-java --kind=dependencies --message="<change-summary>"`. Commit the new md file in ".chronus" folder of repository root.

# Prepare for minor/patch release

Steps:

1. Checkout "main" branch, pull the latest changes.
2. Create a new branch. The name must follow the pattern "publish/http-client-java-<version>". Remind user that this branch must be pushed to remote upstream.
3. Invoke `pnpm prepare-publish --only @typespec/http-client-java` in repository root. Commit the changes.
4. Invoke `npm install` in the root to update `package-lock.json`. Commit the changes.
5. Update the two `package.json` files in `generator/http-client-generator-clientcore-test` and `generator/http-client-generator-test` to match the new version in the root `package.json`. Commit the changes.

The publish workflow (to NPM) will be automatically triggered after the PR is merged: https://dev.azure.com/azure-sdk/internal/_build?definitionId=7294

# Add end-to-end (e2e) test case

Typical task: `add e2e test case for <package>, scenario is <url-to-tsp-file>`.

- The execution of `mvn` and `npm` commands should be done in the test directory `<repository-root>/packages/http-client-java/generator/http-client-generator-test`.
- Only commit Java files written by you. Do not commit any generated files.
- If no scenario URL is provided, search the related files in either https://github.com/microsoft/typespec/tree/main/packages/http-specs/specs or https://github.com/Azure/typespec-azure/tree/main/packages/azure-http-specs/specs

0. Run `pwsh Setup.ps1` in `generator/http-client-generator-test` to set up the environment if not done before.
1. The source files for the generated client under test are located in `generator/http-client-generator-test/src/main/java/<package>`.
2. Read the `Builder` and `Client` Java files to understand the client structure and available APIs.
3. Read the Java model classes under `generator/http-client-generator-test/src/main/java/<package>/models` to understand the data types used by the APIs.
4. Read the TypeSpec file at the given `<url-to-tsp-file>` to understand the scenario. The TypeSpec file contains the expected HTTP request and response in the `@scenarioDoc` decorator.
5. Optionally, check for a `client.tsp` in the same folder (replace `main.tsp` with `client.tsp` in the URL). Use it if present.
6. Review a few existing test cases in `generator/http-client-generator-test/src/test/java/` to learn the test structure and patterns used. Do not read files under the `**/generated` folder.
7. Add a new test class in `generator/http-client-generator-test/src/test/java/<package>/` named `<Scenario>Tests.java`, following existing conventions. The test class should not extend any other class.
8. Make sure compilation passes (`mvn clean compile`).
9. Start Spector server by `npm run spector-start`.
10. Run the tests (`mvn test`). Make sure all tests pass.
11. Stop Spector server by `npm run spector-stop`.
12. Call `pnpm change add @typespec/http-client-java --kind=internal --message="<change-summary>"`. Commit the new md file in ".chronus" folder of repository root.

# Add feature or fix bug

- Run `npm run format` and commit the formatted code before finalizing. Do not include any other changes in the commit.
- Add a changelog entry: `pnpm change add @typespec/http-client-java --kind=<feature|fix> --message="<change-summary>"` (use `feature` for new features, `fix` for bug fixes). Commit the new md file in the ".chronus" folder of the repository root.

# Modify the code generator (emitter + generator e2e loop)

Use this workflow when a change requires modifying how client code is generated (not just adding tests).

The code generator has two connected parts, linked by a `code-model.yaml`:

- `emitter/` — TypeScript. Consumes the TypeSpec compiler output and produces `code-model.yaml`.
- `generator/` — Java. Consumes `code-model.yaml` and emits the Java client source.

After a compile, inspect `tsp-output/**/code-model.yaml` in the test module to see what the emitter passed to the generator.

## Edit → update emitter → test loop

1. Make the emitter (TypeScript) and/or generator (Java) changes.
2. Ensure the generator compiles: `mvn clean install --define spotless:skip --define skipTests --no-transfer-progress -T 1C -f ./generator/pom.xml` (from `<repository-root>/packages/http-client-java`).
3. Ensure the emitter builds: `npm run build:emitter`.
4. Format Java with `mvn spotless:apply --no-transfer-progress -T 1C --activate-profiles test -f ./generator/pom.xml` and TypeScript via `npm run format`.
5. Run `pwsh Setup.ps1` in `generator/http-client-generator-test`. This packs the emitter (bundling the freshly built generator jar) and installs it into the test module. Re-run it after every generator/emitter change you want reflected in generation.
6. Regenerate by compiling a spec. Do NOT hardcode the TypeSpec file name — it varies per feature, and sometimes you must author a new `<scenario>/main.tsp` first. The test module's `tspconfig.yaml` already configures the emitter and its output dir, so a plain compile is enough; output goes to `tsp-output/`:
   `npx tsp compile <path-to-tsp>`
   (Optionally add `--option "@typespec/http-client-java.emitter-output-dir=$PWD/tsp-output/<name>"` to isolate output into a subfolder for an easier diff.)
7. Verify the generated code under `tsp-output/**/src` is as expected. When the spec corresponds to sources tracked in `src/main/java`, compare against them and, if correct, copy the generated files into `src` (replacing existing files) but EXCLUDE `module-info.java`. Some specs do not map to `src` — in that case just verify the output, without comparing or copying.
8. When the spec maps to `src` and you copied the generated code in, run the tests (`mvn test`, or a targeted `--define "test=<pkg>.<Class>"`). Restart the Spector server if needed (`npm run spector-stop` then `npm run spector-start`). If the spec does not map to `src`, verifying the generated output (step 7) is sufficient.

## Emitting static helper classes from resource templates

Some helpers are shipped verbatim as resource templates rather than built up in code:

- `generator/http-client-generator/src/main/java/.../TypeSpecPlugin.java` — `writeHelperClasses(...)` emits per-client helper classes into the implementation subpackage via `JavaPackage.addJavaFromResources(packageName, resourceName[, fileName])`.
- Resource templates live under `generator/http-client-generator-core/src/main/resources/*.java` and must START with `import` statements — do NOT include a `package` line or the license header. The file factory injects the license header, the `package` statement, and reorders imports. The class name must match the resource/file name.
- Class-name constants live in `generator/http-client-generator-core/src/main/java/.../util/ClientModelUtil.java`.
