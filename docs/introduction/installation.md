---
id: installation
title: Installation
---

# Installation

## Requirements

Install [Node.js 20 LTS](https://nodejs.org/en/download/) and ensure you are able to run the `npm` command in a command prompt:

```bash
npm --version
```

It is recommended to have npm 7+. To update npm run `npm install -g npm`

## Install tsp compiler

First step is to install the tsp compiler/cli

```bash
npm install -g @typespec/compiler
```

## Install the VS and VSCode extensions

TypeSpec provides extension for the following editors:

- [Visual Studio Code](./editor/vscode.md)
- [Visual Studio](./editor/vscode.md)

## Create first TypeSpec Project

To get your first TypeSpec project started run in a fresh directory

```bash
tsp init
```

This will prompt you with a few question, pick the `Generic Rest API` template, your project name, and select the `@typespec/openapi3` library.

Next, you can install the dependencies

```bash
tsp install
```

You should now have a basic TypeSpec project setup with a structure looking like

```bash
package.json      # Package manifest defining your typespec project as a node package.
tspconfig.yaml # TypeSpec project configuration letting you configure emitters, emitter options, compiler options, etc.
main.tsp         # TypeSpec entrypoint
```

## Compile project

```bash
tsp compile .
```
