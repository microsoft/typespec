---
id: emitters
title: Emitters
---

# Writing emitters

Cadl emitters are libraries that use various Cadl compiler APIs to reflect on the cadl compilation and produce generated artifacts. The cadl standard library includes an emitter for OpenAPI version 3.0, but odds are good you will want to emit Cadl to another output format. In fact, one of Cadl's main benefits is how easy it is to use Cadl as a source of truth for all data shapes, and the ease of writing an emitter is a big part of that story.

## Getting started

Cadl emitters are a special kind of Cadl library and so have the same getting started instructions. Follow [these steps](#todo) to initialize a cadl library.

## $onEmit

A Cadl emitter exports a function named `$onEmit` from its main entrypoint. It receives two arguments:

- _program_: The current `Program` instance being compiled
- _options_: Custom configuration options selected for this emitter

For example, the following will write a text file to the output directory:

```typescript
import { Program } from "@cadl-lang/compiler";
import Path from "path";

export async function $onEmit(program: Program) {
  const outputPath = Path.join(program.compilerOptions.outputPath!, "hello.txt");
  await program.host.writeFile(outputPath, "hello world!");
}
```

You can now compile a Cadl program passing your library name to --emit, or add it to your `cadl-project.yaml`.

### Custom configuration options

To pass your emitter custom options, the options must be registered with the compiler by setting `emitter.options` in your library definition to the JSON schema for the options you want to take. The compiler has a helper to make this easier:

- _JSONSchemaType_: Takes a TypeScript interface and returns a type that helps you fill in the JSON schema for that type.

The following example extends the hello world emitter to be configured with a name:

```typescript
import { Program, createCadlLibrary, EmitOptionsFor, JSONSchemaType } from "@cadl-lang/compiler";
import Path from "path";

export interface EmitterOptions {
  targetName: string;
}

const EmitterOptionsSchema: JSONSchemaType<EmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    targetName: { type: "string", nullable: true },
  },
  required: [],
};

export const $lib = createCadlLibrary({
  name: "MyEmitter",
  diagnostics: {},
  emitter: {
    options: EmitterOptionsSchema,
  },
});

export async function $onEmit(program: Program, options: EmitterOptions) {
  const outputPath = Path.join(program.compilerOptions.outputPath!, "hello.txt");
  const name = options.targetName;
  await program.host.writeFile(outputPath, `hello ${name}!`);
}
```

#### Emitter options vs. decorators

Generally speaking, emitter options and decorators can solve the same problems: allowing the user to customize how the emit works. For example, the `outputPath` option could be passed on the command line, or we could have an `@outputPath` decorator that has the same effect. Which do you use?

The general guideline is to use a decorator when the customization is intrinsic to the API itself. In other words, when all uses of the Cadl program would use the same configuration. This is not the case for outputPath because different users of the API might want to emit the files in different locations depending on how their code generation pipeline is set up.

## Querying the program

One of the main tasks of an emitter is finding types to emit. There are two main approaches: using the Semantic Walker, which lets you easily run code for every type in the program, and doing a custom traversal, which gives you a lot more flexibility.

### Semantic Walker

The Semantic Walker will visit every type in the Cadl program and call any callbacks you provide for that type. To use, import `navigateProgram` from `@cadl-lang/compiler`. Starting a walk needs two parameters - the program to walk, and an object with callbacks for each type. For example, if we want to do something for every model in the program, we could do the following in our `$onEmit` function:

```typescript
navigateProgram(program, {
  model(m) {
    // emit m
  },
});
```

You can provide a callback for every kind of Cadl type. The walker will call your callback pre-order, i.e. as soon as it sees a type for the first time it will invoke your callback. You can invoke callback post-order instead by prefixing the type name with `exit`, for example `exitModel(m)`.

Note that the semantic walker will visit all types in the program including built-in Cadl types and cadl types defined by any libraries you're using. Care must be taken to filter out any types you do not intend to emit. Sometimes this is quite difficult, so a custom traversal may be easier.

### Custom traversal

Often times you will want to emit specific types, for example types that have a particular decorator or are in a particular namespace. In such cases it is often easier to write a custom traversal to find and emit those types. Once you have a type, you can access its [various fields](#todo) to and emit those types as well if needed.

For example, let's say we want to emit a text file of model names but only if it has an `@emitThis` decorator. We could filter out such models in the Semantic Walker `model` callback, but it is more efficient to implement `@emitThis` such that it keeps a list of all the types its attached to and iterate that list. We can then traverse into types it references if needed.

The following example will emit models with the `@emitThis` decorator and also any models referenced by that model.

```typescript
import {
  DecoratorContext,
  Model,
  createStateSymbol,
  createDecoratorDefinition,
} from "@cadl-lang/compiler";

// Decorator Setup Code

const emitThisKey = createStateSymbol("emitThis");

const emitThisDef = createDecoratorDefinition({
  name: "@emitThis",
  target: ["Model"],
  args: [],
} as const);

// @emitThis decorator
export function $emitThis(context: DecoratorContext, target: Model) {
  if (!emitThisDef.validate(context, target)) {
    return;
  }
  context.program.stateSet(emitThisKey).add(target);
}

export async function $onEmit(program: Program) {
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

## Emitting files to disk

Since an emitter is a node library, you could use standard `fs` APIs to write files. However, this approach has a drawback - your emitter will not work in the browser, and will not work with the test framework that depends on storing emitted files in an in-memory file system.

Instead, use the compiler [`host` interface](#todo) to access the file system. The API is equivalent to the node API but works in a wider range of scenarios.

In order to know where to emit files, the compiler has options with an `outputPath` property. This is set to the current working directory's `cadl-output` directory by default, but can be overridden by the user.
