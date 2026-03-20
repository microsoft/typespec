---
title: 0.64 - January 2025
releaseDate: 2025-01-15
version: "0.64"
---

## Notable changes

### Open API 3.1

The `@typespec/openapi3` package now supports emitting Open API 3.1 specs. To emit Open API 3.1 specs, set the `openapi-versions` emitter option to `["3.1.0"]`. By default, the emitter will continue emitting Open API 3.0 specs.

## Features

### @typespec/compiler

- [#5415](https://github.com/microsoft/typespec/pull/5415) Added support for emitter selections for init template.
- [#5316](https://github.com/microsoft/typespec/pull/5316) Compiler trace will be sent to IDE as trace log through language server
- [#5594](https://github.com/microsoft/typespec/pull/5594) Support Emitters section in Init Template when creating TypeSpec project in vscode
- [#5294](https://github.com/microsoft/typespec/pull/5294) Add capacities in TypeSpec Language Server to support "Scaffolding new TypeSpec project" in IDE

### @typespec/http

- [#5153](https://github.com/microsoft/typespec/pull/5153) Adds getStreamMetadata JS API to simplify getting stream metadata from operation parameters and responses.

### @typespec/openapi3

- [#5372](https://github.com/microsoft/typespec/pull/5372) Adds support for @typespec/json-schema decorators with Open API 3.0 and 3.1 emitters.
- [#5372](https://github.com/microsoft/typespec/pull/5372) Adds support for emitting Open API 3.1 models using the `openapi-versions` emitter configuration option.
  Open API 3.0 is emitted by default.

### typespec-vscode

- [#5312](https://github.com/microsoft/typespec/pull/5312) integrate client SDK generation
- [#5314](https://github.com/microsoft/typespec/pull/5314) Rename vscode extension from "TypeSpec for VS Code" to "TypeSpec"
- [#5594](https://github.com/microsoft/typespec/pull/5594) Support Emitters section in Init Template when creating TypeSpec project in vscode
- [#5294](https://github.com/microsoft/typespec/pull/5294) Support "Create TypeSpec Project" in vscode command and EXPLORER when no folder opened
  Add Setting "typespec.initTemplatesUrls" where user can configure additional template to use to create TypeSpec project
  example:

```
{
  "typespec.initTemplatesUrls": [
    {
      "name": "displayName",
      "url": "https://urlToTheFileContainsTemplates"
    }],
}
```

Support "Install TypeSpec Compiler/CLI globally" in vscode command to install TypeSpec compiler globally easily

## Bug Fixes

### @typespec/compiler

- [#5295](https://github.com/microsoft/typespec/pull/5295) Fix incorrectly returning a positive `BigInt` for a negative `Numeric`.
- [#5353](https://github.com/microsoft/typespec/pull/5353) Meta property are auto-completed, current only supported '::type', '::parameters', '::returnType'
- [#5180](https://github.com/microsoft/typespec/pull/5180) Fixed serialization of object examples on unions
- [#5525](https://github.com/microsoft/typespec/pull/5525) Enum-driven visibility decorators and projections now interact correctly.

### @typespec/rest

- [#5455](https://github.com/microsoft/typespec/pull/5455) In some scenarios, the options for the `@path` decorator do not accurately reflect the provided parameters, including the `#{allowReserved: true}` which is the `x-ms-skip-url-encoding` option. This change addresses and fixes this issue.

### @typespec/openapi3

- [#5172](https://github.com/microsoft/typespec/pull/5172) Allow void to be the response body type when other fields are present in the model. Previously, using `void` as a response body type would fail compilation if the model contained other fields (like `statusCode`).
- [#5456](https://github.com/microsoft/typespec/pull/5456) Fix: OpenAPI YAML converts strings to boolean

### @typespec/internal-build-utils

- [#5312](https://github.com/microsoft/typespec/pull/5312) resolve the program crash when there is no package name in package.json

### typespec-vscode

- [#5413](https://github.com/microsoft/typespec/pull/5413) Do not start TypeSpec Language Server when there is no workspace opened
- [#5131](https://github.com/microsoft/typespec/pull/5131) Support 'See Document' quick action to view the details of linter rules
- [#5428](https://github.com/microsoft/typespec/pull/5428) improve console output when tsp-server not found
