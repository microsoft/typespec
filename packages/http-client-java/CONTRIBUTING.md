# Contributing to TypeSpec Java Emitter Library

## Prerequisite

Install [Node.js](https://nodejs.org/) 20 or above. (Verify by running `node --version`)

Install [Java](https://docs.microsoft.com/java/openjdk/download) 17 or above. (Verify by running `java --version`)

Install [Maven](https://maven.apache.org/download.cgi). (Verify by running `mvn --version`)

## Project Structure

The TypeSpec Java Emitter Library is a Node.js package.
It publishes to [npm `@typespec/http-client-java`](https://www.npmjs.com/package/@typespec/http-client-java).

As a Node.js package, the entry of the library is written in TypeScript, under `emitter` folder.

As a Java code generator, part of the implementation is written in Java, under `generator` folder.
Java code is packaged into a JAR file, and included in the Node.js package. The JAR file is called at runtime by TypeScript code.

## Build and Pack

["Setup.ps1" script](https://github.com/microsoft/typespec/blob/main/packages/http-client-java/Setup.ps1) builds TypeScript code and Java code, and packs them into "typespec-http-client-java-[version].tgz".

One can use npm to install the `@typespec/http-client-java` tgz locally.

```
npm install [path-to-typespec-http-client-java-tgz]
```

## Unit Tests

From the `generator` directory, run:

```
mvn --no-transfer-progress --define spotless.skip=true test
```

This runs the unit tests in `http-client-generator-core`, `http-client-generator-mgmt`, and `http-client-generator`.
It does not require generated clients or a Spector server. Omit `--define spotless.skip=true` to also apply Java formatting.

<!-- cspell:ignore Dtest Dsurefire -->

When selecting tests with `-Dtest=...`, disable the automatically activated end-to-end test profile with `-P '!test'`.
For a multi-module run, add `-Dsurefire.failIfNoSpecifiedTests=false` if some modules have no matching tests.

## End-to-end Tests

There are 2 end-to-end test modules:

- `packages/http-client-java/generator/http-client-generator-clientcore-test` for testing of unbranded code
- `packages/http-client-java/generator/http-client-generator-test` for testing of branded code

Their folder structure is identical. In the following sub-sections, the script or command should be invoked in one of the two folders.

### Set-up the environment

["Setup.ps1" script in test module](https://github.com/microsoft/typespec/blob/main/packages/http-client-java/generator/http-client-generator-clientcore-test/Setup.ps1) builds the emitter, and sets up the test environment.

Internally, it does

1. Build the `@typespec/http-client-java` tgz locally. See [Build and Pack](#build-and-pack).
2. Re-install the tgz (along with other dependencies) in the test module.

### Debug emitter's `.ts` code

1. In vscode, toggle `Auto Attach` as `Always` (click `ctrl+shift+p` and input `Toggle Auto Attach`, choose the option `Always`). You may need to restart vscode after setting.

2. Run below commands to link packages/http-client-java/http-client-generator-test to packages/http-client-java, so that you can debug emitter's .ts code directly.

```
$ cd packages/http-client-java
$ npm link
$ cd packages/http-client-java/generator/http-client-generator-test
$ npm link ../../
```

3. After changing emitter's code, run `npm run build:emitter`.

4. When running `tsp compile` on test cases under `http-client-generator-test`, it will go to the break point you set in `.ts`(e.g. `code-model-builder.ts`) file.

### Generate the test code

If the feature or bug fix involves code change on generated code, you will need to re-generate the test code in one or both of the test modules.

["Generate.ps1" script](https://github.com/microsoft/typespec/blob/main/packages/http-client-java/generator/http-client-generator-clientcore-test/Generate.ps1) (internally it calls the "Setup.ps1" script) generates the code for end-to-end testing.
The code is generated from TypeSpec source from [npm `@typespec/http-specs` package](https://www.npmjs.com/package/@typespec/http-specs).

### Run the end-to-end tests

["Spector-Tests.ps1" script](https://github.com/microsoft/typespec/blob/main/packages/http-client-java/generator/http-client-generator-clientcore-test/Spector-Tests.ps1) starts the spector server, and run all the Java tests.

When writing / updating Java tests, you can manually

1. Start the test server with `npm run spector-serve` (or `npm run spector-start` to start as a background process, `npm run spector-stop` to stop).
2. Run the Java tests in the module.

## Sync Java Dependency Versions

From this package directory, run `pwsh eng\versioning\Sync-Versions.ps1` to sync
`Project.Dependency`, generator/module POMs, the customization POM, and the generated-POM
template with Azure SDK for Java's version files. Use `-WhatIf` to preview changes.

`eng\versioning\external_dependencies.txt` lists the packages to sync; append `;version`
to pin a package. The script prefers the first (released) version in `version_client.txt`,
then falls back to `external_dependencies.txt`. Unlisted dependencies are unchanged.

Run the script's offline tests with `pwsh eng\versioning\Sync-Versions.Tests.ps1`.

## SSE generation checks

Each supported operation transports complete `sseMetadata`, including the streamed
union's cross-language definition ID and references to emitter-composed object schemas
for the stream base and concrete event wrappers. The emitter registers each cached
synthetic base and wrapper exactly once in `schemas.objects`, links them with ordinary
parent/child relationships, and initially marks them with only the non-propagating
`sse` schema usage. A final emitter-approved convenience consumer adds `output` and
`public` to its complete shared base/wrapper set; protocol-only consumers do not.
Registration is not emission: `sse` classifies envelopes, while ordinary visibility
usage makes them eligible for generation. Their required, read-only `eventName` and
`value` properties carry the base contract and typed payload reference. Explicit
consumer-driven tracking gives ordinary payload models their public/output and JSON
usage without propagating `sse`. Internal convenience consumers retain the existing
public envelope placement.

Each synthetic `ObjectSchema` also carries source rendering metadata: the stream name,
event wire name (absent on the base), and terminal status. This descriptor does not
classify the schema or duplicate payloads, inheritance, Java names, or visibility.
The Java YAML loader distinguishes it from operation-level `sseMetadata`.

The emitter's `sse-utils.ts` constructs schemas using raw stream/event-derived naming
patterns. It owns SSE composition such as `Events` singularization, `StreamEvent`
suffixes, and event-prefix overlap, but it does not sanitize those patterns as Java
identifiers. The Java transformer and `CodeNamer` are the single owners of final Java
validity, digit expansion, punctuation handling, and reserved-name escaping.
`CodeModelBuilder` retains eligibility checks, payload processing, namespace resolution,
usage tracking, and one cached schema bundle per effective union owner.

The registered schemas pass through ordinary schema naming after ordinary objects,
groups, enums, unions, and constants, using the same namespace exclusions and suffix
rules without renaming ordinary models. There is no separate SSE name allocator.
Different raw names can therefore converge after Java normalization and fail the strict
SSE generated source-path checks instead of receiving compatibility suffixes. The
generic ordinary-model duplicate-file policy remains warning-only and does not provide
a new global uniqueness guarantee.

`CodeModel` remains a data POJO. SSE admission checks the rendering facts consumed by
generation: operation and schema metadata must agree on the stream, event name, terminal
status, and event base type. It does not scan unused schemas or revalidate the emitter's
property layout, registration counts, or complete inheritance graph.
After mapping service clients, an early backend gate considers only their actual input
operations. It preserves wrapper and sync-direction settings, effective paging/LRO
precedence, and proxy/request readiness without inspecting rendered methods.
`SseUtil` preflights eligible source paths and the common package required by the
envelopes' package-private constructors, and returns only eligible schema identities.
`ClientMapper` then maps each eligible registered `ObjectSchema` through the configured
ordinary `ModelMapper.map(ObjectSchema)`. The mapper reads schema-local metadata,
resolves the base type through normal inheritance, and derives its serializer type.
There is no contextual mapper overload or installed mapping state.
Normal inheritance recursion and genuine same-schema
cache hits reuse canonical models; conflicting schema identities or rendering metadata
remain errors. The model registry, packages, and module are finalized once after SSE
model mapping and before constructing sync/async convenience clients, preserving the
existing phase boundary.

`ClientMethod` retains only the resolved event and serializer types plus terminal wire
names. Normal model writing applies `ModelUtil.isGeneratingModel` and
`JavaPackage.addModel`; the shared final `ModelTemplate.write` dispatches both bases
and event wrappers to `SseEventModelTemplate` before ordinary JSON handling, including
through `StreamSerializationModelTemplate`. Payload DTOs keep their ordinary template.
Helper emission applies the same model-generation filter to SSE bases in `Client.models`
and emits only their serializers and common runtime resources. SSE-only registrations
do not create envelope/helper files or model package/module entries. Synthetic envelopes
remain excluded from cross-language model definitions, model tests, GraalVM inputs, and
Fluent/ARM preprocessing.

Distinct effective union owners claiming one ID are errors only after both streams
otherwise pass typed-SSE eligibility; unsupported literal, nullable, content-type, or
namespace shapes warn and retain their ordinary binary response contract without
claiming the ID. Typed SSE convenience methods are restricted to Azure-v1 data-plane
generation. Fluent/ARM and other non-data-plane generation retain ordinary binary value
and response methods. There is no schema fingerprinting or structural deduplication.
Duplicate event factories, mapper cache aliases, and generated source paths fail before
SSE files are written.

For focused changes, run the test module's `Setup.ps1`, then compile `tsp/sse.tsp`
or the Spector `streaming/sse/main.tsp` into separate output directories using the
default `tspconfig.yaml`. Do not run full `Generate.ps1`. Compare the named fixture's
sources before copying affected generated sources and metadata, excluding
`module-info.java`. The shared Spector streams contain unnamed or literal events and
therefore verify unsupported-stream binary fallback rather than typed SSE generation.
Compile `tsp/sse-name-collisions.tsp` and its generated Maven project to check ordinary
SSE references and response-lambda names against request parameters and
grouped-parameter locals. Special event, payload, runtime-helper, serializer, and Flux
import collisions are currently outside the supported test scope.

Run the emitter's schema/naming tests and the generator's metadata, path-preflight,
template, and mapper tests. The retained
`tsptest.sse.models.implementation.sse.ServerSentEventStreamTests` exercises the actual
generated named serializer, merged `ServerSentEventStreamHelper`, client API shape,
framing, terminal delivery, and lifecycle.

## Format Code

Before creating pull request, the code is required to be well-formatted.

Run `npm run format` in "packages/http-client-java" folder.
It formats TypeScript code as well as Java code.

## Lint and Type-check

Run `npm run lint` in "packages/http-client-java" to lint and type-check the emitter source and tests.
Java CI runs `npm run typecheck` before the emitter unit tests; it does not require the root-only linter.

## Add Change Description

A change description is required to pass CI of your pull request.

Run `pnpm chronus add` in repository root to add change description.
