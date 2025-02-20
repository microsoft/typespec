# Contribute to TypeSpec extension manual testing

This section describes manual testing of the TypeSpec extension.

## Test Environment

- Windows
- Linux

## Prerequisite

- Install [Node.js 20](https://nodejs.org/download/) or above. (Verify by running `node --version`)
- Install Npm 7 or above. (Verify by running `npm --version`)
- Install [TypeSpec Compiler CLI](https://typespec.io/docs/): `"npm install -g @typespec/compiler"`. (Verify by running `tsp --version`)

## Test Cases

There are four cases for TypeSpec extension manual testing. Click the corresponding links for specific test steps.

- [Create TypeSpec Project from A Template](https://github.com/microsoft/typespec/tree/main/packages/typespec-vscode/test/manual/create-typespec-project-test-case.md) - New TypeSpec projects can be created using a variety of templates for specific purposes.

- [Generate from TypeSpec](https://github.com/microsoft/typespec/tree/main/packages/typespec-vscode/test/manual/generate-from-typespec-test-case.md) - Different emitter types can be used to generate different codes to meet specific purposes.
- [Import TypeSpec from OpenAPI3](https://github.com/microsoft/typespec/tree/main/packages/typespec-vscode/test/manual/import-typespec-from-openapi3-test-case.md) - Using the OpenAPI3 TypeSpec emitter, you can import a TypeSpec file from a specified OpenAPI3 document.
- [TypeSpec Extension Basic Features](https://github.com/microsoft/typespec/tree/main/packages/typespec-vscode/test/manual/typespec-extension-basic-features-test-case.md) - The TypeSpec for VS Code extension provides TypeSpec language support for VS Code.

## Issue Report

If you find any problems during testing, please submit the [issue](https://github.com/microsoft/typespec/issues).
