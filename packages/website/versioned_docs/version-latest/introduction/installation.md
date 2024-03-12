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

TypeSpec provides extension for the following editors:

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
package.json      # Package manifest defining your TypeSpec project as a Node package.
tspconfig.yaml # TypeSpec project configuration letting you configure emitters, emitter options, compiler options, etc.
main.tsp         # TypeSpec entrypoint
```

## Compile project

```bash
tsp compile .
```
