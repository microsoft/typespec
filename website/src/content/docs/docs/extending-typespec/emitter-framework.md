---
id: emitter-framework
title: Emitter framework
---

The emitter framework is designed to make writing TypeSpec emitters much easier and to enable sharing and composing of emitter components. Based on patterns found in JS front-end libraries, the emitter framework provides a component model and a large number of built-in components for a variety of languages that make it easy to write well-formatted source text.

This document will go over the overall architecture of the emitter framework and help you get started trying out in your emitter.

::: caution
The emitter framework is still highly experimental and is under very active development. Only TypeScript is well supported at the moment. Breaking changes will happen, though hopefully they will be rare and easy to manage. We are releasing the emitter framework in this early state because to get more feedback about its usage across a wider range of scenarios, so please let us know your feedback. And of course, contributions are welcome!
:::

## Overall Architecture

The emitter framework is has four separate but related areas:

1. **alloy**: a framework for code generation that provides a React-like functional component model, manages symbols and references, renders and formats source text, and other things useful regardless of what language you're emitting. [Alloy](https://alloy-project.github.io/alloy) is not part of TypeSpec, and we are developing it to be useful even if you aren't writing a TypeSpec emitter. [Read the documentation for the Alloy framework](https://alloy-framework.github.io/alloy/guides/getting-started/).
2. **alloy language components**: Libraries of components for various languages. For example, allows for declaring a variable in TypeScript, and then creating a reference to that variable such that any necessary imports and package.json dependencies are added. [Read the documentation for these components](https://alloy-framework.github.io/alloy/guides/getting-started/).
3. **typekits**: A convenient way to pull information from the TypeSpec type graph.
4. **emitter framework**: builds off of alloy and its language components to provide TypeSpec-aware components and utilities. For example, while the alloy language component for TypeScript interfaces allows manually declaring members, the emitter framework component can take a TypeSpec data type and convert it directly into a TypeScript interface.

When you are writing a TypeSpec emitter, you will draw on components and APIs from each of these areas.

## How to get started

We recommend you read the alloy documentation to understand its component model, reactivity system, formatting capabilities, and so forth. Alloy's [core concepts](https://alloy-framework.github.io/alloy/guides/basic-concepts/) document is a good place to start. 

Also, make sure to read the 'Getting Started' section under the [emitter basics](./emitters-basics.md) topic. To use the framework, you will need an emitter library and a `$onEmit` function. Once you have a good understanding of Alloy, and have your emitter project set up.

## Add necessary dependencies

There are a few dependencies needed to use the emitter framework:

```sh
> npm install --save-peer @alloy-js/core @alloy-js/typescript @typespec/emitter-framework
```

This is in addition to the dependencies installed from the emitter template as described in [emitter basics](./emitters-basics.md).

## $onEmit basics

The main job of your onEmit function is to establish the overall structure of your emit output. This is done by using the following APIs and components:

* [`Output`](https://alloy-framework.github.io/alloy/reference/core/components/output/), which sets up a bunch of context, takes formatting options like `printWidth`, registers external symbols for libraries you're going to use, and a few other things.
* [`SourceDirectory`](https://alloy-framework.github.io/alloy/reference/core/components/sourcedirectory/) which creates a source directory at a given path.
* [`SourceFile`](https://alloy-framework.github.io/alloy/reference/core/components/sourcefile/) component from `@alloy-js/core`, or from an alloy language component library such as [TypeScript](https://alloy-framework.github.io/alloy/reference/typescript/components/sourcefile/).
* `writeOutput` from `@typespec/emitter-framework`, which renders all your emitter content and puts it on disk.

So for example, your `$onEmit` function could look like this:

```tsx
import { Output, SourceDirectory, SourceFile } from "@alloy-js/core";
import { EmitContext } from "@typespec/compiler";
import { writeOutput } from "@typespec/emitter-framework";

export async function $onEmit(context: EmitContext) {
  await writeOutput(
    <Output>
      <SourceDirectory path="src" />
      <SourceFile path="README.md" filetype="md">
        Hello world!
      </SourceFile>
    </Output>,
    context.emitterOutputDir
  );
}
```
If you run this emitter, you will see a `src` directory and a `README.md` file in your `tsp-output` directory.

## TypeScript Emitter Framework Components

The TypeScript emitter framework wraps components from the Alloy TypeScript component library by adding a `type` prop that accepts a TypeSpec type, allowing for easy translation of TypeSpec to TypeScript:


* `<ClassMethod type={Operation}>` - emit a TypeSpec operation as a class method.
* `<EnumDeclaration type={Union | Enum} />` - emit a TypeSpec union or enum as a TypeScript enum.
* `<FunctionDeclaration type={Operation}>` - emit a TypeSpec operation as a function declaration.
* `<InterfaceDeclaration type={Model | Interface}>` - emit a TypeSpec model or interface as a TypeScript interface type.
* `<TypeAliasDeclaration type={Scalar} />` - emit a scalar type as a TypeScript Type Alias.
* `<TypeDeclaration type={Type} />` - emit a TypeSpec type as an appropriate TypeScript type declaration.
* `<TypeExpression type={Type} />` - emit a TypeSpec type as an appropriate TypeScript type expression.
* `<UnionDeclaration type={Union | Enum} />` - emit a TypeSpec Union or Enum as a TypeScript type declaration for a union.
* `<UnionExpression type={Union | Enum} />` - emit a TypeSpec Union or Enum as a TypeScript union expression.

There are also some additional components handy for emitting TypeScript from TypeSpec:

* `<ArrayExpression elementType={Type} />` - emit a TypeScript array type of the given type.
* `<RecordExpression elementType={Type} >` - emit a TypeScript record type of the given type.

### Example TypeScript emitter

This example emitter will emit TypeScript types for some TypeSpec types.

```tsx
import { Output, SourceDirectory, SourceFile } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { EmitContext } from "@typespec/compiler";
import { writeOutput } from "@typespec/emitter-framework";

export async function $onEmit(context: EmitContext) {
  // get some models from the type graph
  const types = getInterestingTypes();
  await writeOutput(
    <Output>
      <SourceDirectory path="src">
        <ts.SourceFile path="index.ts">
          <For each={types}>
            {(type) => <ts.TypeDeclaration type={type} />}
          </For>
        </ts.SourceFile>
      </SourceDirectory>
      <SourceFile path="README.md" filetype="md">
        Hello world!
      </SourceFile>
    </Output>,
    context.emitterOutputDir
  );
}
```
