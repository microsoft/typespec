---
id: imports
title: Imports
---

# Import

Imports add files or libraries to your TypeSpec program. When you compile a TypeSpec file, you provide a path to your root TypeSpec file, by convention called "main.tsp". From there, any files you import are added to your program. If you import a directory, TypeSpec will look for a `main.tsp` file inside that directory.

The path you import must either begin with `"./"` or `"../"` or otherwise be an absolute path. The path must either refer to a directory, or else have an extension of either ".tsp" or ".js". The following demonstrates how to use imports to assemble a TypeSpec program from multiple files:

## Import TypeSpec file

```typespec
import "./models/foo.tsp";
```

## Import Js file

```typespec
import "./decorators.js";
```

## Import a library

The import value can be name one of the package dependencies. In that case TypeSpec will lookup for the `package.json` file and check the `tspMain` entry (or default to `main` if absent) to decide what is the library entrypoint to load.

```typespec
import "@typespec/rest";
```

```json
// ./node_modules/@typespec/rest/package.json
{
  "tspMain": "./lib/main.tsp"
}
```

which result in `./node_modules/@typespec/rest/lib/main.tsp` to be imported

## Import a directory

If the import value is a directory it will lookup if that directory is a Node package and follow the npm package [lookup logic](#import-a-library) or if the directory contains a `main.tsp`.

```typespec
import "./models"; // same as `import "./models/main.tsp";
```

```typespec
import "./path/to/local/module"; // Assuming this path is a TypeSpec package, it will load it using the tspMain file.
```
