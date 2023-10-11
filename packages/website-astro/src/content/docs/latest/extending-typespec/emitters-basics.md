---
id: emitters
title: Emitters
---

# Writing emitters

TypeSpec emitters are libraries that use various TypeSpec compiler APIs to reflect on the typespec compilation and produce generated artifacts. The typespec standard library includes an emitter for OpenAPI version 3.0, but odds are good you will want to emit TypeSpec to another output format. In fact, one of TypeSpec's main benefits is how easy it is to use TypeSpec as a source of truth for all data shapes, and the ease of writing an emitter is a big part of that story.

## Getting started

TypeSpec emitters are a special kind of TypeSpec library and so have the same getting started instructions. Follow [these steps](#todo) to initialize a typespec library.

## $onEmit

A TypeSpec emitter exports a function named `$onEmit` from its main entrypoint. It receives two arguments:

- _context_: The current context including the current progfam being compiled
- _options_: Custom configuration options selected for this emitter

For example, the following will write a text file to the output directory:

```typescript
import { EmitContext } from "@typespec/compiler";
import Path from "path";

export async function $onEmit(context: EmitContext) {
  const outputDir = Path.join(context.emitterOutputDir, "hello.txt");
  await context.program.host.writeFile(outputDir, "hello world!");
}
```

You can now compile a TypeSpec program passing your library name to --emit, or add it to your `tspconfig.yaml`.

### Custom configuration options

To pass your emitter custom options, the options must be registered with the compiler by setting `emitter.options` in your library definition to the JSON schema for the options you want to take. The compiler has a helper to make this easier:

- _JSONSchemaType_: Takes a TypeScript interface and returns a type that helps you fill in the JSON schema for that type.

The following example extends the hello world emitter to be configured with a name:

```typescript
import { JSONSchemaType, createTypeSpecLibrary } from "@typespec/compiler";
import Path from "path";

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
  name: "MyEmitter",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema,
  },
});

export async function $onEmit(context: EmitContext<EmitterOptions>) {
  const outputDir = Path.join(context.emitterOutputDir, "hello.txt");
  const name = context.options.targetName;
  await context.program.host.writeFile(outputDir, `hello ${name}!`);
}
```

### Configuration options convention

- Name options `kebab-case`. So it can be inline with the rest of the cli
- An option called `output-dir` can be created and should override the compiler `output-dir`

#### Emitter options vs. decorators

The general guideline is to use a decorator when the customization is intrinsic to the API itself. In other words, when all uses of the TypeSpec program would use the same configuration. This is not the case for `outputFilename` because different users of the API might want to emit the files in different locations depending on how their code generation pipeline is set up.

## Emitting TypeSpec types to assets on disk

One of the main tasks of an emitter is finding types to emit. There are three main approaches:

1. The [emitter framework](./emitter-framework.md), which makes it relatively easy to emit all your TypeSpec types (or a subset, if you wish).
1. The Semantic Walker, which lets you easily run code for every type in the program
1. Custom traversal, which gives you a lot more flexibility than either of the previous approaches at the cost of some complexity.

### Emitter Framework

The emitter framework provides handles a lot of hard problems for you while providing an easy-to-use API to convert your TypeSpec into source code or other object graphs. Visit the [emitter framework](./emitter-framework.md) page to learn more.

### Semantic Walker

The Semantic Walker will visit every type in the TypeSpec program and call any callbacks you provide for that type. To use, import `navigateProgram` from `@typespec/compiler`. Starting a walk needs two parameters - the program to walk, and an object with callbacks for each type. For example, if we want to do something for every model in the program, we could do the following in our `$onEmit` function:

```typescript
navigateProgram(program, {
  model(m) {
    // emit m
  },
});
```

You can provide a callback for every kind of TypeSpec type. The walker will call your callback pre-order, i.e. as soon as it sees a type for the first time it will invoke your callback. You can invoke callback post-order instead by prefixing the type name with `exit`, for example `exitModel(m)`.

Note that the semantic walker will visit all types in the program including built-in TypeSpec types and typespec types defined by any libraries you're using. Care must be taken to filter out any types you do not intend to emit. Sometimes this is quite difficult, so a custom traversal may be easier.

### Custom traversal

Often times you will want to emit specific types, for example types that have a particular decorator or are in a particular namespace. In such cases it is often easier to write a custom traversal to find and emit those types. Once you have a type, you can access its [various fields](#todo) to and emit those types as well if needed.

For example, let's say we want to emit a text file of model names but only if it has an `@emitThis` decorator. We could filter out such models in the Semantic Walker `model` callback, but it is more efficient to implement `@emitThis` such that it keeps a list of all the types its attached to and iterate that list. We can then traverse into types it references if needed.

The following example will emit models with the `@emitThis` decorator and also any models referenced by that model.

[See creating decorator documentation for more details](./create-decorators.md)

```typescript
import { DecoratorContext, Model, createStateSymbol } from "@typespec/compiler";

// Decorator Setup Code

const emitThisKey = createStateSymbol("emitThis");

// @emitThis decorator
export function $emitThis(context: DecoratorContext, target: Model) {
  context.program.stateSet(emitThisKey).add(target);
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

### Resolving a typespec type

Sometimes you might want to get access to a known TypeSpec type in the type graph, for example a model that you have defined in your library.

A helper is provided on the program to do that.

```ts
program.resolveTypeReference(reference: string): Type | undefined;
```

The reference must be a valid typespec reference(Like you would have it in a typespec document)

**Example**

```ts
program.resolveTypeReference("TypeSpec.string"); // Resolve typespec string intrinsic type
program.resolveTypeReference("MyOrg.MyLibrary.MyEnum"); // Resolve `MyEnum` defined in `MyOrg.MyLibrary` namespace.
```

Error example

```ts
program.resolveTypeReference("UnknownModel"); // Resolve `[undefined, diagnostics]` where diagnostics is an array of diagnostic explaining why reference is invalid.
program.resolveTypeReference("model Foo {}"); // Resolve `[undefined, diagnostics]` where diagnostics is an array of diagnostic explaining why reference is invalid.
```

## Emitting files to disk

Since an emitter is a node library, you could use standard `fs` APIs to write files. However, this approach has a drawback - your emitter will not work in the browser, and will not work with the test framework that depends on storing emitted files in an in-memory file system.

Instead, use the compiler [`host` interface](#todo) to access the file system. The API is equivalent to the node API but works in a wider range of scenarios.

In order to know where to emit files, the emitter context has a `emitterOutputDir` property that is automatically resolved using the `emitter-output-dir` built-in emitter options. This is set to `{cwd}/tsp-output/{emitter-name}` by default, but can be overridden by the user. Do not use the `compilerOptions.outputDir`

## Handling scalars

Scalars are types in TypeSpec that most likely have a primitive or built-in datastructure representing those in the target language.

Recommended logic for emitting scalar is to:

1. If scalar is a known scalar(e.g. `int32`), emit the known mapping.
2. Otherwise check scalar `baseScalar` and go back to `1.`
   2.1 After resolving which scalar apply any decorators

:::note
If the scalar is generic and doesn't have a mapping (e.g. integer), we recommend substituting it with the next closest mapping (e.g. integer->int64) and emitting a warning.
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

## Handling Default Values

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

It is important that emitters handle default values in a consistent way. Default values SHOULD NOT be used as client-side default values. Instead, they should be used as a way to specify a default value for the server-side implementation. For example, if a model property has a default value of `true`, the server-side implementation should use that value if the client does not provide a value. Default values SHOULD be expressed in documentation to properly communicate the service-side default.
