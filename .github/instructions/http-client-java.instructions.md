---
applyTo: "packages/http-client-java/**/*"
---

# Java client emitter

This package is outside the pnpm workspace. Run package commands from the absolute path to `packages/http-client-java`, and pass `--registry=https://pkgs.dev.azure.com/azure-sdk/public/_packaging/azure-sdk-for-js/npm/registry/` to npm commands.

Add required changelog entries from the repository root with:

```sh
pnpm chronus add @typespec/http-client-java --kind="$KIND" --message="$SUMMARY"
```

## Dependency updates

1. Run `ncu -u` for the root `package.json` and the package files in `generator/http-client-generator-clientcore-test` and `generator/http-client-generator-test`.
2. Keep root peer dependency ranges aligned with root development dependencies.
3. Keep the test projects' overrides aligned with the root dependencies.
4. Run `npm install` at the package root and commit the package and lockfile changes.
5. If `http-specs` or `azure-http-specs` changed, regenerate `generator/http-client-generator-test`. If `http-specs` changed, also regenerate `generator/http-client-generator-clientcore-test`.
6. Add a `dependencies` changelog entry.

## Generator changes

The TypeScript emitter produces `code-model.yaml`; the Java generator consumes it.

1. Add or update a focused test before changing behavior.
2. Build the generator:

   ```sh
   mvn clean install --define spotless:skip --define skipTests --no-transfer-progress -T 1C -f ./generator/pom.xml
   ```

3. Build the emitter with `npm run build:emitter`.
4. Format with `npm run format`.
5. Run `pwsh Setup.ps1` in the relevant generator test project after each emitter or generator change.
6. Compile the scenario with `npx tsp compile <path-to-main.tsp>` and inspect `tsp-output/**/code-model.yaml` and generated sources.
7. For tracked scenarios, copy verified generated sources into `src`, excluding `module-info.java`, and run the focused Maven tests.
8. Add a `feature` or `fix` changelog entry.

Resource-based Java helpers live in `generator/http-client-generator-core/src/main/resources`. Templates start with imports and omit the license and package declarations because generation adds them. Keep helper class-name constants in `ClientModelUtil.java`.

## Spector end-to-end tests

1. Run `pwsh Setup.ps1` from `generator/http-client-generator-test`.
2. Inspect the generated client and model APIs under `src/main/java`.
3. Read the source TypeSpec scenario and nearby Java tests.
4. Add the handwritten test under `src/test/java`; do not edit generated test sources.
5. Start Spector with `npm run spector-start`, run the focused Maven test, and stop Spector with `npm run spector-stop`.
6. Add an `internal` changelog entry.

## Validation

- Run `npm run format`.
- Run `npm run build` and `npm test`.
- Run focused Maven tests for changed generator behavior.
- Do not delete or disable existing tests.
