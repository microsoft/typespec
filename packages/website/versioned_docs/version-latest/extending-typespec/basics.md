---
id: basics
title: Creating a TypeSpec Library
---

# Creating a TypeSpec library

A TypeSpec library is a package that includes TypeSpec types, decorators, emitters or linters. These libraries are [npm packages](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry) with some additional TypeSpec-specific metadata and conventions. This guide will walk you through the process of creating a new TypeSpec library, adding types to it, and distributing it on the public npm registry. Further sections will delve into the specifics of creating [decorators](create-decorators.md), [emitters](./emitters-basics.md) and [linters](./linters.md).

While this guide assumes that you'll be using [TypeScript](https://typescriptlang.org) to develop your library, you can skip the TypeScript-related steps if you prefer to use plain JavaScript.

## Prerequisites

You'll need to have both Node and npm installed. If you're planning to develop multiple libraries simultaneously, it's recommended to set up a monorepo to simplify the development process. TypeSpec itself uses [pnpm](https://pnpm.io/).

## Setting up with templates

You can use the following templates:

```bash
# Create a TypeSpec library (Decorators & Linters) with TypeScript enabled.
tsp init --template library-ts

# Create a TypeSpec emitter with TypeScript enabled.
tsp init --template emitter-ts
```

## Standard package structure

Here's a high-level overview of what a TypeSpec package typically contains. Each of these files will be explained in more detail in the following sections.

- **dist/index.js** - The main file for your Node library
- **lib/main.tsp** - The main file for your TypeSpec types (optional)
- **src/index.ts** - The main file for your Node library in TypeScript
- **src/lib.ts** - The file that defines your TypeSpec library
- **package.json** - Metadata about your TypeSpec package

## Step 1: Initial setup

You can skip this step if you've used one of the templates above.

### a. Initialize your package directory & package.json

Run the following commands:

```bash
> mkdir myLibrary
> cd myLibrary
> npm init
```

After completing the wizard, you'll have a package.json file that defines your TypeSpec library.

Unlike Node libraries which support CommonJS (cjs), TypeSpec libraries must be ECMAScript Modules. To specify this, open your `package.json` and add the following top-level configuration key:

```jsonc
  "type": "module"
```

### b. Install TypeSpec dependencies

Run the following command:

```bash
npm install --save-peer @typespec/compiler
```

You might need to install other dependencies from the TypeSpec standard library. For example, if you want to use the metadata found in `@typespec/openapi`, you'll need to install that as well.

Refer to the [dependency section](#step-3-defining-dependencies) for more information on defining your dependencies.

### c. Define your main files

Your package.json needs to refer to two main files: your Node module main file, and your TypeSpec main. The Node module main file is specified by the `"main"` key in your package.json file, and it defines the entry point for your library when it's used as a Node library. This must reference a JS file. The TypeSpec main defines the entry point for your library when it's used from a TypeSpec program, and it can reference either a JS file (when your library doesn't contain any TypeSpec types) or a TypeSpec file.

```jsonc
  "main": "dist/src/index.js",
  "tspMain": "lib/main.tsp"
```

### d. Install and initialize TypeScript

Run the following commands:

```bash
npm install -D typescript
npx tsc --init --strict
```

This will create a `tsconfig.json` file. You'll need to make a few changes to this file. Open `tsconfig.json` and set the following settings:

```jsonc
"module": "Node16",           // This and next setting tells TypeScript to use the new ESM import system to resolve types.
"moduleResolution": "Node16",
"target": "es2019",
"rootDir": ".",
"outDir": "./dist",
"sourceMap": true,
```

### e. Create `lib.ts`

Open `./src/lib.ts` and create your library definition that registers your library with the TypeSpec compiler and defines any diagnostics your library will emit. Make sure to export the library definition as `$lib`.

:::warning
If `$lib` is not accessible from your library package (for example, `import {$lib} from "my-library";`), some features such as linting and emitter option validation will not be available.
:::

For example:

```typescript
import { createTypeSpecLibrary } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "myLibrary",
  diagnostics: {},
} as const);

// Optional but convenient, these are meant to be used locally in your library.
export const { reportDiagnostic, createDiagnostic } = $lib;
```

Diagnostics are used for linters and decorators, which are covered in subsequent topics.

### f. Set package flags

You can optionally set any package flags by exporting a `$flags` const that is initialized with the `definePackageFlags`. Like `$lib`, this value must be exported from your package.

It is strongly recommended to set `valueMarshalling` to `"new"` as this will be the default behavior in future TypeSpec versions.

```typescript
export const $flags = definePackageFlags({
  valueMarshalling: "new",
});
```

### g. Create `index.ts`

Open `./src/index.ts` and import your library definition:

```typescript
// Re-export $lib so the compiler can access it and register your library correctly.
export { $lib } from "./lib.js";
```

### h. Build TypeScript

TypeSpec can only import JavaScript files, so any changes made to TypeScript sources need to be compiled before they are visible to TypeSpec. To do this, run `npx tsc -p .` in your library's root directory. If you want to re-run the TypeScript compiler whenever files are changed, you can run `npx tsc -p . --watch`.

Alternatively, you can add these as scripts in your `package.json` to make them easier to invoke. Consider adding the following:

```jsonc
  "scripts": {
    "clean": "rimraf ./dist ./temp",
    "build": "tsc -p .",
    "watch": "tsc -p . --watch",
    "test": "node --test ./dist/test"
  }
```

You can then run `npm run build` or `npm run watch` to build or watch your library.

### i. Add your main TypeSpec file

Open `./lib/main.tsp` and import your JS entrypoint. This ensures that when TypeSpec imports your library, the code to define the library is run. When we add decorators in later topics, this import will ensure those get exposed as well.

```typespec
import "../dist/index.js";
```

## Step 2: Adding TypeSpec types to your library

Open `./lib/main.tsp` and add any types you want to be available when users import this library. It's strongly recommended to put these types in a namespace that corresponds with the library name. For example, your `./lib/main.tsp` file might look like:

```typespec
import "../dist/index.js";

namespace MyLibrary;
model Person {
  name: string;
  age: uint8;
}
```

## Step 3: Defining dependencies

When defining dependencies in a TypeSpec library, follow these rules:

- Use `peerDependencies` for all TypeSpec libraries (and the compiler) that you use in your own library or emitter.
- Use `devDependencies` for other TypeSpec libraries that are only used in tests.
- Use `dependencies` or `devDependencies` for any other packages, depending on whether they're used in library code or in test/dev scripts.

TypeSpec libraries are defined using `peerDependencies` to avoid having multiple versions of the compiler or library running at the same time.

**Example**

```jsonc
{
  "dependencies": {
    "yaml": "~2.3.1", // This is a regular package this library/emitter will use
  },
  "peerDependencies": {
    // These are all TypeSpec libraries this library/emitter depends on
    "@typespec/compiler": "~0.43.0",
    "@typespec/http": "~0.43.1",
    "@typespec/openapi": "~0.43.0",
  },
  "devDependencies": {
    // This TypeSpec library is only used in the tests but is not required to use this library.
    "@typespec/versioning": "~0.43.0",
    // TypeScript is only used during development
    "typescript": "~5.0.2",
  },
}
```

## Step 4: Testing your TypeSpec library

TypeSpec provides a testing framework to assist in testing libraries. The examples here are shown using Node.js's built-in test framework (available in Node 20+), but any other JS test framework can be used that will provide more advanced features like vitest, which is used in this project.

### a. Add devDependencies

Ensure that you have the following in your `package.json`:

```json
"devDependencies": {
  "@types/node": "~18.11.9",
  "source-map-support": "^0.5.21"
}
```

Also add a `vitest.config.ts` file at the root of your project.

```ts
import { defineConfig, mergeConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // testTimeout: 10000, // Uncomment to increase the default timeout
    isolate: false, // Your test shouldn't have side effects to this will improve performance.
  },
});
```

### b. Define the testing library

The first step is to define how your library can be loaded from the test framework. This will allow your library to be reused by other library tests.

1. Create a new file `./src/testing/index.ts` with the following content

```ts
import { createTestLibrary, findTestPackageRoot } from "@typespec/compiler/testing";

export const MyTestLibrary = createTestLibrary({
  name: "<name-of-npm-pkg>",
  // Set this to the absolute path to the root of the package. (e.g. in this case this file would be compiled to ./dist/src/testing/index.js)
  packageRoot: await findTestPackageRoot(import.meta.url),
});
```

2. Add an `exports` for the `testing` endpoint to `package.json` (update with correct paths)

```jsonc
{
  // ...
  "main": "dist/src/index.js",
  "exports": {
    ".": {
      "default": "./dist/src/index.js",
      "types": "./dist/src/index.d.ts",
    },
    "./testing": {
      "default": "./dist/src/testing/index.js",
      "types": "./dist/src/testing/index.d.ts",
    },
  },
}
```

### c. Define the test host and test runner for your library

Define some of the test framework base pieces that will be used in the tests. There are 2 functions:

- `createTestHost`: This is a lower-level API that provides a virtual file system.
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
  const host = await createMyTestHost();
  return createTestWrapper(host, { autoUsings: ["My"] });
}
```

### d. Write tests

After setting up that infrastructure you can start writing tests. By default Node.js will run all files matching these patterns:

```
**/*.test.?(c|m)js
**/*-test.?(c|m)js
**/*_test.?(c|m)js
**/test-*.?(c|m)js
**/test.?(c|m)js
**/test/**/*.?(c|m)js
```

[See nodejs doc](https://nodejs.org/api/test.html)

```ts
import { createMyTestRunner } from "./test-host.js";
import { describe, beforeEach, it } from "node:test";

describe("my library", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createMyTestRunner();
  });

  // Check everything works fine
  it("does this", async () => {
    const { Foo } = await runner.compile(`
      @test model Foo {}
    `);
    strictEqual(Foo.kind, "Model");
  });

  // Check diagnostics are emitted
  it("errors", async () => {
    const diagnostics = await runner.diagnose(`
       model Bar {}
    `);
    expectDiagnostics(diagnostics, { code: "...", message: "..." });
  });
});
```

#### e. `@test` decorator

The `@test` decorator is a decorator loaded in the test environment. It can be used to collect any decorable type.
When using the `compile` method it will return a `Record<string, Type>` which is a map of all the types annotated with the `@test` decorator.

```ts
const { Foo, CustomName } = await runner.compile(`
  @test model Foo {}

  model Bar {
    @test("CustomName") name: string
  }
`);

Foo; // type of: model Foo {}
CustomName; // type of : Bar.name
```

#### f. Install vscode extension for the test framework

If you are using VSCode, you can install the [Node test runner](https://marketplace.visualstudio.com/items?itemName=connor4312.nodejs-testing) to run your tests from the editor. This will also allow you to easily debug your tests.

After installing the extension, you should be able to discover, run, and debug your tests from the test explorer.

## Step 5: Publishing your TypeSpec library

To publish your library to the public npm registry, follow the instructions in the [npm documentation](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages).

## Step 6: Importing your TypeSpec library

Once your TypeSpec library is published, users can install and use it just like any of the standard TypeSpec libraries. First, they need to install it:

```bash
npm install $packageName
```

Next, they can import it into their TypeSpec program and use the namespace (if desired):

```typespec
import "MyLibrary";
using MyLibrary;

model Employee extends Person {
  job: string;
}
```

## Step 7: Next steps

TypeSpec libraries can contain more than just types. For more details on how to write [decorators](./create-decorators.md), [emitters](./emitters-basics.md) and [linters](./linters.md), refer to the subsequent topics.
