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

## Install cadl compiler

First step is to install the cadl compiler/cli

```bash
npm install -g @cadl-lang/compiler
```

## Install the VS and VSCode extensions

The cli comes bundled with extensions for VS and VSCode. Install them via:

```bash
cadl code install
cadl vs install
```

If you are using the VSCode insiders build, pass the `--insiders` option to the `cadl code install` command.

## Create first Cadl Project

To get your first Cadl project started run in a fresh directory

```bash
cadl init
```

This will prompt you with a few question, pick the `Generic Rest API` template.

Next, you can install the dependencies

```bash
cadl install
```

You should now have a basic Cadl project setup with a structure looking like

```bash
package.json      # Package manifest defining your cadl project as a node package.
cadl-project.yaml # Cadl project configuration letting you configure emitters, emitter options, compiler options, etc.
main.cadl         # Cadl entrypoint
```

## Compile project

```bash
cadl compile .
```
