---
id: getting-started-http-01-setup
title: Setup
---

# Setup

:::note
Make sure to have installed the [editor extension](../../introduction/installation.md#install-the-vs-and-vscode-extensions) to get syntax highlighting and IntelliSense.
:::

1. Make a new folder somewhere.
2. Run `tsp init` and select the `Generic REST API` template.
3. Run `tsp install` to install dependencies.
4. Run `tsp compile .` to compile the initial file. You can either run `tsp compile . --watch` to automatically compile changes on save or keep running the command manually after that.

Resulting file structure:

```
main.tsp
tspconfig.yaml
package.json
node_modules/
tsp-output/
  @typespec/
    openapi3/
      openapi.yaml
```
