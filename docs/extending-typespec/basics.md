---
id: basics
title: Creating a TypeSpec Library
---

# Creating a TypeSpec library

TypeSpec libraries are packages that contain TypeSpec types, decorators, emitters, linters, and other bits of reusable code. TypeSpec libraries are [npm packages](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry) with some additional typespec-specific metadata and conventions. The following will show how to establish a new TypeSpec library, add some types to it, and distribute it on the public npm registry. Later sections will cover more details on how to write [decorators](create-decorators.md), [emitters](./emitters-basics.md) and [linters](./linters.md).

This document assumes you will be using [TypeScript](https://typescriptlang.org) to develop your library, but you should feel free to skip the TypeScript steps if you want to use plain JavaScript.

## Prerequisites

You will need both node and npm installed. Additionally, if you intend to develop multiple libraries together, you will likely want to establish a monorepo as this will make developing the libraries in tandem much easier. TypeSpec itself uses [rush.js](https://rushjs.io/).

## Canonical package structure

The following is a high level overview of the contents of a TypeSpec package. These files are explained in more detail in the subsequent sections.

- **dist/index.js** - the main file for your node library
- **lib/main.tsp** - the main file for your TypeSpec types (optional)
- **src/index.ts** - the main file for your node library in TypeScript
- **src/lib.ts** - the TypeSpec library definition file
- **package.json** - metadata about your TypeSpec package

## Initial setup

### 1. Initialize your package directory &amp; package.json

Run the following commands:

```bash
> mkdir myLibrary
> cd myLibrary
> npm init
```

After filling out the wizard, you will have a package.json file that defines your typespec library.

Unlike node libraries which support CommonJS (cjs), TypeSpec libraries must be Ecmascript Modules. So open your `package.json` and add the following top-level configuration key:

```json
  "type": "module"
```

### 2. Install TypeSpec dependencies

Run the following command:

```bash
npm install --save-peer @typespec/compiler
```

You may have need of other dependencies in the TypeSpec standard library depending on what you are doing. E.g. if you want to use the metadata found in `@typespec/openapi` you will need to install that as well.

See [dependency section](#defining-dependencies) for information on how to define your dependencies.

### 2. Define your main files

Your package.json needs to refer to two main files: your node module main file, and your TypeSpec main. The node module main file is the `"main"` key in your package.json file, and defines the entrypoint for your library when consumed as a node library, and must reference a js file. The TypeSpec main defines the entrypoint for your library when consumed from a TypeSpec program, and may reference either a js file (when your library doesn't contain any typespec types) or a TypeSpec file.

```json
  "main": "dist/index.js",
  "tspMain": "lib/main.tsp"
```

### 3. Install and initialize TypeScript

Run the following commands:

```bash
npm install -D typescript
npx tsc --init --strict
```

This will create `tsconfig.json`. But we need to make a couple changes to this. Open `tsconfig.json` and set the following settings:

```json
    "module": "Node16",           // This and next setting tells TypeScript to use the new ESM import system to resolve types.
    "moduleResolution": "Node16",
    "target": "es2019",
    "rootDir": "./src",
    "outDir": "./dist",
```

### 4. Create `lib.ts`

Open `./src/lib.ts` and create your library definition that registers your library with the TypeSpec compiler and defines any diagnostics your library will emit. Make sure to export the library definition as `$lib`.

:::warn
If `$lib` is not accessible from your library package (`import {$lib} from "my-library";`) some functionality will be unavailable like validation of emitter options, linter rules, etc.
:::

The following shows an example:

```typescript
import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "myLibrary",
  diagnostics: {},
} as const);

// Optional but convenient, those are meant to be used locally in your library.
export const { reportDiagnostic, createDiagnostic, createStateSymbol } = myLibrary;
```

Diagnostics are used for linters and decorators which are covered in subsequent topics.

### 5. Create `index.ts`

Open `./src/index.ts` and import your library definition:

```typescript
// Re-export $lib to the compiler can get access to it and register your library correctly.
export { $lib } from "./lib.js";
```

### 6. Build TypeScript

TypeSpec can only import JavaScript files, so any time changes are made to TypeScript sources, they need to be compiled before they are visible to TypeSpec. To do so, run `npx tsc -p .` in your library's root directory. You can also run `npx tsc -p --watch` if you would like to re-run the TypeScript compiler whenever files are changed.

### 7. Add your main TypeSpec file

Open `./lib/main.tsp` and import your JS entrypoint. This ensures that when typespec imports your library, the code to define the library is run. In later topics when we add decorators, this import will ensure those get exposed as well.

```typespec
import "../dist/index.js";
```

## Adding TypeSpec types to your library

Open `./lib/main.tsp` and add any types you want to be available when users import this library. It is also strongly recommended you put these types in a namespace that corresponds with the library name. For example, your `./lib/main.tsp` file might look like:

```typespec
import "../dist/index.js";

namespace MyLibrary;
model Person {
  name: string;
  age: uint8;
}
```

## Defining Dependencies

Defining dependencies in a TypeSpec library should be following these rules:

- use `peerDependencies` for all TypeSpec libraries(+ compiler) that you use in your own library/emitter
- use `devDependencies` for the other typespec libraries used only in tests
- use `dependencies`/`devDependencies` for any other packages depending if using in library code or in test/dev scripts

TypeSpec libraries are defined using `peerDependencies` so we don't end-up with multiple versions of the compiler/library running at the same time.

**Example**

```jsonc
{
  "dependencies": {
    "yaml": "~2.3.1" // This is a regular package this library/emitter will use
  },
  "peerDependencies": {
    // Those are all TypeSpec libraries this library/emitter depend on
    "@typespec/compiler": "~0.43.0",
    "@typespec/http": "~0.43.1",
    "@typespec/openapi": "~0.43.0"
  },
  "devDependencies": {
    // This TypeSpec library is only used in the tests but is not required to use this library.
    "@typespec/versioning": "~0.43.0",
    // Typescript is only used during development
    "typescript": "~5.0.2"
  }
}
```

## Publishing your TypeSpec library

To publish to the public npm registry, follow [their documentation](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages).

## Importing your TypeSpec library

Once your TypeSpec library is published, your users can install and use it just like any of the TypeSpec standard libraries. First, they have to install it:

```bash
npm install $packageName
```

Next, they import it into their TypeSpec program and use the namespace (if desired):

```typespec
import "MyLibrary";
using MyLibrary;

model Employee extends Person {
  job: string;
}
```

## Next steps

TypeSpec libraries can contain more than just types. Read the subsequent topics for more details on how to write [decorators](./create-decorators.md), [emitters](./emitters-basics.md) and [linters](./linters.md).

## Testing

TypeSpec provides a testing framework to help testing libraries. Examples here are shown using `mocha` but any other JS test framework can be used.

### Define the testing library

First step is to define how your library can be loaded from the test framework. This will let your library to be reused by other library test.

1. Create a new file `./src/testing/index.ts` with the following content

```ts
export const MyTestLibrary = createTestLibrary({
  name: "<name-of-npm-pkg>",
  // Set this to the absolute path to the root of the package. (e.g. in this case this file would be compiled to ./dist/src/testing/index.js)
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
```

2. Add an `exports` for the `testing` endpoint to `package.json` (update with correct paths)

```json
{
  // ...
  "main": "dist/src/index.js",
  "exports": {
    ".": "./dist/src/index.js",
    "./testing": "./dist/src/testing/index.js"
  },
  "typesVersions": {
    "*": {
      "*": ["./dist/src/index.d.ts"],
      "testing": ["./dist/src/testing/index.d.ts"]
    }
  }
}
```

### Define the test host and test runner for your library

Define some of the test framework base pieces that will be used in the tests. There is 2 functions:

- `createTestHost`: This is a lower level api that provide a virtual file system.
- `createTestRunner`: This is a wrapper on top of the test host that will automatically add a `main.tsp` file and automatically import libraries.

Create a new file `test/test-host.js` (change `test` to be your test folder)

```ts
import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { RestTestLibrary } from "@typespec/rest/testing";
import { MyTestLibrary } from "../src/testing/index.js";

export async function createMyTestHost() {
  return createTestHost({
    libraries: [RestTestLibrary, MyTestLibrary], // Add other libraries you depend on in your tests
  });
}
export async function createMyTestRunner() {
  const host = await createOpenAPITestHost();
  return createTestWrapper(host, { autoUsings: ["My"] });
}
```

### Write tests

After setting up that infrastructure you can start writing tests.

```ts
import { createMyTestRunner } from "./test-host.js";

describe("my library", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createMyTestRunner();
  });

  // Check everything works fine
  it("does this", () => {
    const { Foo } = runner.compile(`
      @test model Foo {}
    `);
    strictEqual(Foo.kind, "Model");
  });

  // Check diagnostics are emitted
  it("errors", () => {
    const diagnostics = runner.diagnose(`
       model Bar {}
    `);
    expectDiagnostics(diagnostics, { code: "...", message: "..." });
  });
});
```

#### `@test` decorator

The `@test` decorator is a decorator loaded in the test environment. It can be used to collect any decorable type.
When using the `compile` method it will return a `Record<string, Type>` which is a map of all the types annoted with the `@test` decorator.

```ts
const { Foo, CustomName } = runner.compile(`
  @test model Foo {}

  model Bar {
    @test("CustomName") name: string
  }
`);

Foo; // type of: model Foo {}
CustomName; // type of : Bar.name
```
