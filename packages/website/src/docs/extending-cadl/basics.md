---
id: basics
title: Creating a Cadl Library
---

# Creating a Cadl library

Cadl libraries are packages that contain Cadl types, decorators, emitters, linters, and other bits of reusable code. Cadl libraries are [npm packages](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry) with some additional cadl-specific metadata and conventions. The following will show how to establish a new Cadl library, add some types to it, and distribute it on the public npm registry. Later sections will cover more details on how to write [decorators](../decorators), [emitters](../emitters) and [linters](../linters).

This document assumes you will be using [TypeScript](https://typescriptlang.org) to develop your library, but you should feel free to skip the TypeScript steps if you want to use plain JavaScript.

## Prerequisites

You will need both node and npm installed. Additionally, if you intend to develop multiple libraries together, you will likely want to establish a monorepo as this will make developing the libraries in tandem much easier. Cadl itself uses [rush.js](https://rushjs.io/).

## Canonical package structure

The following is a high level overview of the contents of a Cadl package. These files are explained in more detail in the subsequent sections.

- **dist/index.js** - the main file for your node library
- **lib/main.cadl** - the main file for your Cadl types (optional)
- **src/index.ts** - the main file for your node library in TypeScript
- **src/lib.ts** - the Cadl library definition file
- **package.json** - metadata about your Cadl package

## Initial setup

### 1. Initialize your package directory &amp; package.json

Run the following commands:

```bash
> mkdir myLibrary
> cd myLibrary
> npm init
```

After filling out the wizard, you will have a package.json file that defines your cadl library.

Unlike node libraries which support CommonJS (cjs), Cadl libraries must be Ecmascript Modules. So open your `package.json` and add the following top-level configuration key:

```json
  "type": "module"
```

### 2. Install Cadl dependencies

Run the following command:

```bash
npm install @cadl-lang/compiler
```

You may have need of other dependencies in the Cadl standard library depending on what you are doing. E.g. if you want to use the metadata found in `@cadl-lang/openapi` you will need to install that as well.

### 2. Define your main files

Your package.json needs to refer to two main files: your node module main file, and your Cadl main. The node module main file is the `"main"` key in your package.json file, and defines the entrypoint for your library when consumed as a node library, and must reference a js file. The Cadl main defines the entrypoint for your library when consumed from a Cadl program, and may reference either a js file (when your library doesn't contain any cadl types) or a Cadl file.

```json
  "main": "dist/index.js",
  "cadlMain": "lib/main.cadl"
```

### 3. Install and initialize TypeScript

Run the following commands:

```bash
> npm install -D typescript
> npx tsc --init --strict
```

This will create `tsconfig.json`. But we need to make a couple changes to this. Open `tsconfig.json` and set the following settings:

```json
    "moduleResolution": "node",
    "module": "ESNext",
    "target": "es2018",
    "rootDir": "./src",
    "outDir": "./dist",
```

### 4. Create `lib.ts`

Open `./src/lib.ts` and create your library definition that registers your library with the Cadl compiler and defines any diagnostics your library will emit. The following shows an example:

```typescript
import { createCadlLibrary } from "@cadl-lang/compiler";

export const myLibrary = createCadlLibrary({
  name: "myLibrary",
  diagnostics: {},
});

// optional but convenient
export const { reportDiagnostic, createDiagnostic, createStateSymbol } = myLibrary;
```

Diagnostics are used for linters and decorators which are covered in subsequent topics.

### 5. Create `index.ts`

Open `./src/index.ts` and import your library definition:

```typescript
import { myLibrary } from "./lib.js";
```

### 6. Build TypeScript

Cadl can only import JavaScript files, so any time changes are made to TypeScript sources, they need to be compiled before they are visible to Cadl. To do so, run `npx tsc -p .` in your library's root directory. You can also run `npx tsc -p --watch` if you would like to re-run the TypeScript compiler whenever files are changed.

### 7. Add your main Cadl file

Open `./lib/main.cadl` and import your JS entrypoint. This ensures that when cadl imports your library, the code to define the library is run. In later topics when we add decorators, this import will ensure those get exposed as well.

```cadl
import "../dist/index.js";
```

## Adding Cadl types to your library

Open `./lib/main.cadl` and add any types you want to be available when users import this library. It is also strongly recommended you put these types in a namespace that corresponds with the library name. For example, your `./lib/main.cadl` file might look like:

```cadl
import "../dist/index.js";

namespace MyLibrary;
model Person {
  name: string;
  age: uint8;
}
```

## Publishing your Cadl library

To publish to the public npm registry, follow [their documentation](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages).

## Importing your Cadl library

Once your Cadl library is published, your users can install and use it just like any of the Cadl standard libraries. First, they have to install it:

```bash
npm install $packageName
```

Next, they import it into their Cadl program and use the namespace (if desired):

```cadl
import "MyLibrary";
using MyLibrary;

model Employee extends Person {
  job: string;
}
```

## Next steps

Cadl libraries can contain more than just types. Read the subsequent topics for more details on how to write [decorators](../decorators), [emitters](../emitters) and [linters](../linters).
