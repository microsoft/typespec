---
id: installation
title: Installation
slug: /
---

# Installation

## Requirements

Install [Node.js 20 LTS](https://nodejs.org/en/download/) and ensure you can run the `npm` command in a command prompt:

```bash
npm --version
```

We recommend using npm 7+. To update npm, run `npm install -g npm`

## Install tsp

The first step is to install `tsp`, the TypeSpec compiler/CLI.

```bash
npm install -g @typespec/compiler
```

## Install the VS and VSCode extensions

TypeSpec provides extensions for the following editors:

- [Visual Studio Code](./editor/vscode.md)
- [Visual Studio](./editor/vs.md)

## Create a new TypeSpec project

Run the following command in a clean directory to create a new TypeSpec project.

```bash
tsp init
```

This will prompt you with a few questions. Pick the `Generic REST API` template, your project name, and select the `@typespec/openapi3` library.

Next, you can install the dependencies.

```bash
tsp install
```

You should now have a basic TypeSpec project setup with a structure looking like this:

```bash
main.tsp
tspconfig.yaml
package.json
node_modules/
tsp-output/
  @typespec/
    openapi3/
      openapi.yaml
```

- **main.tsp**: The entry point for your TypeSpec build. This file typically contains the main definitions for your models, services, and operations.
- **tspconfig.yaml**: Configuration file for the TypeSpec compiler, specifying options and settings for the build process.
- **package.json**: Contains metadata about the project, including dependencies, scripts, and other project-related information.
- **node_modules/**: Directory where npm installs the project's dependencies.
- **tsp-output/**: Directory where the TypeSpec compiler outputs generated files.
- **openapi.yaml**: The generated OpenAPI specification file for your API, detailing the API's endpoints, models, and operations. The output can vary based on the target format specified in the `tspconfig.yaml` file.

## Compile project

```bash
tsp compile .
```

You can also run `tsp compile . --watch` to automatically compile changes on save.
