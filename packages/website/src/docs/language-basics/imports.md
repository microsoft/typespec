---
id: imports
title: Imports
---

# Import

Imports add files or libraries to your Cadl program. When you compile a Cadl file, you provide a path to your root Cadl file, by convention called "main.cadl". From there, any files you import are added to your program. If you import a directory, Cadl will look for a `main.cadl` file inside that directory.

The path you import must either begin with `"./"` or `"../"` or otherwise be an absolute path. The path must either refer to a directory, or else have an extension of either ".cadl" or ".js". The following demonstrates how to use imports to assemble a Cadl program from multiple files:

## Import Cadl file

```cadl
import "./models/foo.cadl";
```

## Import Js file

```cadl
import "./decorators.js";
```

## Import a library

The import value can be name one of the package dependencies. In that case cadl will lookup for the `package.json` file and check the `cadlMain` entry (or default to `main` if absent) to decide what is the library entrypoint to load.

```cadl
import "@cadl-lang/rest";
```

```json
// ./node_modules/@cadl-lang/rest/package.json
{
  "cadlMain": "./lib/main.cadl"
}
```

which result in `./node_modules/@cadl-lang/rest/lib/main.cadl` to be imported

## Import a directory

If the import value is a directory it will lookup if that directoy is a node package and follow the npm package [lookup logic](#import-a-library) or if the directory contains a `main.cadl`.

```cadl
import "./models"; // same as `import "./models/main.cadl";
```

```cadl
import "./path/to/local/module"; // Assuming this path is a cadl package, it will load it using the cadlMain file.
```
