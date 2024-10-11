---
id: imports
title: Imports
---

Imports are used to include files or libraries into your TypeSpec program. When compiling a TypeSpec file, you specify the path to your root TypeSpec file, typically named "main.tsp". From this root file, any imported files are added to your program. If a directory is imported, TypeSpec will search for a `main.tsp` file within that directory.

The path specified in the import must either start with `"./"` or `"../"`, or be an absolute path. The path should either point to a directory, or have an extension of either ".tsp" or ".js". The examples below illustrate how to use imports to assemble a TypeSpec program from multiple files:

## Importing a TypeSpec file

```typespec
import "./models/foo.tsp";
```

## Importing a JavaScript file

```typespec
import "./decorators.js";
```

## Importing a library

The import value can be the name of one of the package dependencies.

```typespec
import "/rest";
```

```json
// ./node_modules/@typespec/rest/package.json
{
  "exports": {
    ".": { "typespec": "./lib/main.tsp" }
  }
}
```

This results in `./node_modules/@typespec/rest/lib/main.tsp` being imported.

### Package resolution algorithm

When trying to import a package TypeSpec follows the following logic

1. Parse the package name from the import specificier into `pkgName` and `subPath` (e.g. `@scope/lib/named` => pkgName: `@scope/lib` subpath: `named` )
1. Look to see if `pkgName` is itself(Containing package)
1. Otherwise lookup for a parent folder with a `node_modules/${pkgName}` sub folder
1. Reading the `package.json` of the package
   a. If `exports` is defined respect the [ESM logic](https://github.com/nodejs/node/blob/main/doc/api/esm.md) to resolve the `typespec` condition(TypeSpec will not respect the `default` condition)
   b. If `exports` is not found or for back compat the `.` export is missing the `typespec` condition fallback to checking `tspMain` or `main`

## Importing a directory

If the import value is a directory, TypeSpec will check if that directory is a Node package and follow the npm package [lookup logic](#importing-a-library), or if the directory contains a `main.tsp` file.

```typespec
import "./models"; // equivalent to `import "./models/main.tsp";
```

```typespec
import "./path/to/local/module"; // Assuming this path is a TypeSpec package, it will load it using the tspMain file.
```
