---
id: installation
title: Installation
---

# Installation

## Requirements

Install [Node.js 16 LTS](https://nodejs.org/en/download/) and ensure you are able to run the `npm` command in a command prompt:

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

The cli comes bundled with extensions for VS and VSCode. Install them via:

```bash
tsp code install
tsp vs install
```

If you are using the VSCode insiders build, pass the `--insiders` option to the `tsp code install` command.

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
