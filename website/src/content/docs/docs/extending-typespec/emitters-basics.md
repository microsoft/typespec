---
title: Emitters
---

TypeSpec emitters are libraries that utilize various TypeSpec compiler APIs to reflect on the TypeSpec compilation process and generate artifacts. The TypeSpec standard library includes emitters for OpenAPI version 3.0, JSON Schema, and Protocol Buffers (Protobuf). However, you might want to emit TypeSpec to a different output format. One of the main advantages of TypeSpec is its ease of use as a single source of truth for all data shapes, and the simplicity of creating an emitter contributes significantly to this.

## Emitter design

TypeSpec is designed to support many protocols and many output formats. It is important that an emitter is designed to select only the part of the TypeSpec spec that makes sense for them. Having emitters designed correctly will allow a user to define multiple layers of their API in a single TypeSpec document, allowing tools to view the entire picture of the service.

For example assuming a User wants to emit `openapi3` and `protobuf` but each API has a different set of operations and is split into different namespaces.

It is important that there is a way for the openapi3 emitter and protobuf emitter to select only the part of the spec that applies to them. For instance, the protobuf emitter should not try to emit the http service namespace and fail because of missing annotations.

## Getting started

TypeSpec emitters are a unique type of TypeSpec library, so they follow the same initial setup instructions.

Set up the boilerplate for an emitter using our template:

```bash
tsp init --template emitter-ts
```

Alternatively, follow [these steps](./basics.md) to initialize a TypeSpec library.

## $onEmit

A TypeSpec emitter exports a function named `$onEmit` from its main entry point. It takes two arguments:

- _context_: The current context, including the current program being compiled
- _options_: Custom configuration options selected for this emitter

For instance, the following code will write a text file to the output directory:

```typescript
import { EmitContext, emitFile, resolvePath } from "@typespec/compiler";

export async function $onEmit(context: EmitContext) {
  if (!context.program.compilerOptions.noEmit) {
    await emitFile(context.program, {
      path: resolvePath(context.emitterOutputDir, "hello.txt"),
      content: "Hello world\n",
    });
  }
}
```

You can now compile a TypeSpec program by passing your library name to --emit, or add it to your `tspconfig.yaml`.

### Custom configuration options

To provide custom options to your emitter, you need to register the options with the compiler by setting `emitter.options` in your library definition to the JSON schema for the options you want to use. The compiler provides a helper to simplify this:

- _JSONSchemaType_: Takes a TypeScript interface and returns a type that assists you in filling in the JSON schema for that type.

The following example extends the hello world emitter to be configured with a name:

```ts file=src/internal-lib.ts
export const $lib = createTypeSpecLibrary({
  name: "MyEmitter",
  diagnostics: {
    // Add diagnostics here.
  },
  state: {
    // Add state keys here for decorators.
  },
});
```

```ts file=src/lib.ts
import {
  JSONSchemaType,
  createTypeSpecLibrary,
  EmitContext,
  resolvePath,
} from "@typespec/compiler";
import { internalLib } from "./lib.js";

export interface EmitterOptions {
  "target-name": string;
}

const EmitterOptionsSchema: JSONSchemaType<EmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "target-name": { type: "string", nullable: true },
  },
  required: [],
};

export const $lib = createTypeSpecLibrary({
  internal: internalLib,
  emitter: {
    options: EmitterOptionsSchema,
  },
});

export async function $onEmit(context: EmitContext<EmitterOptions>) {
  const outputDir = resolvePath(context.emitterOutputDir, "hello.txt");
  const name = context.options.targetName;
  await context.program.host.writeFile(outputDir, `hello ${name}!`);
}
```

### Emitter options known format:

### `absolute-path`

Specify that the value for this option should resolve to an absolute path. e.g. `"{project-root}/dir"`.

:::important
It is recommended that all options that involve path use this. Using relative path can be confusing for users on as it is not clear what the relative path is relative to. And more importantly relative path if not careful are resolved relative to the `cwd` in Node file system which result in spec only compiling from the the project root.
:::

Example:

```js
{
  "asset-dir": { type: "string", format: "absolute-path", nullable: true },
}
```

### Configuration options convention

- Name options `kebab-case`. So it can be inline with the rest of the cli
- Name options should not contain dots (`.`). Using a dot will conflict with using nested configuration values.
- An option called `output-dir` can be created and should override the compiler `output-dir`

#### Emitter options vs. decorators

The general guideline is to use a decorator when the customization is intrinsic to the API itself. In other words, when all uses of the TypeSpec program would use the same configuration. This is not the case for `outputFilename` because different users of the API might want to emit the files in different locations depending on how their code generation pipeline is set up.

## Emitting TypeSpec types to assets on disk

One of the main tasks of an emitter is to identify types to emit. There are three primary methods:

1. The [emitter framework](./emitter-framework.md), which simplifies the process of emitting all your TypeSpec types (or a subset, if you prefer).
2. The Semantic Walker, which allows you to easily execute code for every type in the program.
3. Custom traversal, which offers more flexibility than the previous two methods, albeit with some added complexity.

### Emitter Framework

The emitter framework handles many complex issues for you while offering an easy-to-use API to convert your TypeSpec into source code or other object graphs. Visit the [emitter framework](./emitter-framework.md) page for more information.

### Semantic Walker

The Semantic Walker visits every type in the TypeSpec program and calls any callbacks you provide for that type. To use it, import `navigateProgram` from `@typespec/compiler`. Starting a walk requires two parameters - the program to walk, and an object with callbacks for each type. For instance, if we want to do something for every model in the program, we could do the following in our `$onEmit` function:

```typescript
navigateProgram(program, {
  model(m) {
    // emit m
  },
});
```

You can provide a callback for every kind of TypeSpec type. The walker will call your callback pre-order, i.e., it will invoke your callback as soon as it encounters a type for the first time. You can invoke a callback post-order instead by prefixing the type name with `exit`, for example, `exitModel(m)`.

Note that the semantic walker will visit all types in the program, including built-in TypeSpec types and TypeSpec types defined by any libraries you're using. You must filter out any types you do not intend to emit. Sometimes this can be quite challenging, so a custom traversal may be easier.

### Custom traversal

Often, you'll want to emit specific types, such as types that have a particular decorator or are in a specific namespace. In such cases, it's often easier to write a custom traversal to find and emit those types. Once you have a type, you can access its various fields and emit those types as well if needed.

For instance, let's say we want to emit a text file of model names but only if it has an `@emitThis` decorator. We could filter out such models in the Semantic Walker `model` callback, but it's more efficient to implement `@emitThis` such that it keeps a list of all the types it's attached to and iterate that list. We can then traverse into types it references if needed.

The following example will emit models with the `@emitThis` decorator and also any models referenced by that model.

[See creating decorator documentation for more details](./create-decorators.md)

```typescript
import { DecoratorContext, Model } from "@typespec/compiler";
import { StateKeys } from "./lib.js";

// Decorator Setup Code

// @emitThis decorator
export function $emitThis(context: DecoratorContext, target: Model) {
  context.program.stateSet(StateKeys.emitThis).add(target);
}

export async function $onEmit(context: EmitContext) {
  for (const model of program.stateSet(emitThisKey)) {
    emitModel(model);
  }
}

function emitModel(model: Model) {
  // emit this model
  for (const prop of model.properties.values()) {
    // recursively emit models referenced by the parent model
    emitModel(prop.type);
  }
}
```

### Resolving a TypeSpec type

Sometimes you might want to access a known TypeSpec type in the type graph, for example, a model that you have defined in your library.

A helper is provided on the program to do that.

```ts
program.resolveTypeReference(reference: string): Type | undefined;
```

The reference must be a valid TypeSpec reference (like you would have it in a TypeSpec document)

**Example**

```ts
program.resolveTypeReference("TypeSpec.string"); // Resolve TypeSpec string intrinsic type
program.resolveTypeReference("MyOrg.MyLibrary.MyEnum"); // Resolve `MyEnum` defined in `MyOrg.MyLibrary` namespace.
```

Error example

```ts
program.resolveTypeReference("UnknownModel"); // Resolve `[undefined, diagnostics]` where diagnostics is an array of diagnostic explaining why reference is invalid.
program.resolveTypeReference("model Foo {}"); // Resolve `[undefined, diagnostics]` where diagnostics is an array of diagnostic explaining why reference is invalid.
```

## Emitting files to disk

Since an emitter is a Node library, you could use standard `fs` APIs to write files. However, this approach has a drawback - your emitter will not work in the browser, and will not work with the test framework that depends on storing emitted files in an in-memory file system.

Instead, use the compiler's `host` interface to access the file system. This API is equivalent to the Node API but works in a broader range of scenarios.

To know where to emit files, the emitter context has an `emitterOutputDir` property that is automatically resolved using the `emitter-output-dir` built-in emitter options. By default, this is set to `{cwd}/tsp-output/{emitter-name}`, but it can be overridden by the user. Do not use the `compilerOptions.outputDir`.

## Dealing with scalars

Scalars are types in TypeSpec that are most likely represented by a primitive or built-in data structure in the target language.

The recommended logic for emitting a scalar is as follows:

1. If the scalar is a known scalar (e.g., `int32`), emit the known mapping.
2. Otherwise, check the scalar `baseScalar` and go back to step 1.
   2.1 After resolving which scalar to use, apply any decorators.

:::note
If the scalar is generic and doesn't have a mapping (e.g., integer), we recommend substituting it with the next closest mapping (e.g., integer->int64) and emitting a warning.
:::

### Examples

```tsp
@minValue(10)
scalar myInt32 extends int32;

@minValue(20)
scalar specializedInt32 extends myInt32;
```

| Scalar             | Expected type | Description                                                                                                                                 |
| ------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `int16`            | `int16`       | Simple case, emitter can know it is an int16                                                                                                |
| `myInt32`          | `int32`       | Emitter doesn't know what myInt32 is. Check baseScalar, sees it is an int32, applies minValue decorator.                                    |
| `specializedInt32` | `int32`       | Emitter doesn't know what specializedInt32 is. Check baseScalar, finds myInt32 knows that it is an int32 now and applies minValue override. |
| `float`            | `float64`     | Emitter knows float but doesn't have a mapping. Emit `float64` and a warning.                                                               |

## Managing Default Values

Several TypeSpec types have a `default` property that can be used to specify a default value. For example, the following model has a default value of `true` for the `isActive` property:

```tsp
model User {
  isActive?: boolean = true;
}
```

These values can be accessed in the emitter using the `default` property on the `ModelProperty` type.

```ts
const modelProp: ModelProperty = ...;   // the isActive ModelProperty type
const defaultValue = modelProp.default; // value: true
```

It's important that emitters handle default values consistently. Default values SHOULD NOT be used as client-side default values. Instead, they should be used to specify a default value for the server-side implementation. For example, if a model property has a default value of `true`, the server-side implementation should use that value if the client does not provide a value. Default values SHOULD be expressed in documentation to properly communicate the server-side default.
