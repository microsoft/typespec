---
id: emitter-framework
title: Emitter framework
---

The emitter framework is designed to make writing TypeSpec emitters easier and to enable sharing and composing of emitter components. Based on patterns found in JS front-end libraries, the emitter framework provides a component model and a large number of built-in components for a variety of languages that make it easy to write well-formatted source text.

This document will go over the architecture of the emitter framework and help you get started trying it out in your emitter.

:::caution
The emitter framework is still experimental and is under active development. Only TypeScript is well supported at the moment. Breaking changes will happen, though hopefully they will be rare and easy to manage. We are releasing the emitter framework in this early state to get more feedback about its usage across a wider range of scenarios, so please let us know your feedback. And of course, contributions are welcome!
:::

## Overall Architecture

The emitter framework has four separate but related areas:

1. **alloy**: a framework for code generation that provides a React-like functional component model, manages symbols and references, renders and formats source text, and does other things useful regardless of what language you're emitting. [Alloy](https://alloy-framework.github.io/alloy) is not part of TypeSpec, and we are developing it to be useful even if you aren't writing a TypeSpec emitter. [Read the documentation for the Alloy framework](https://alloy-framework.github.io/alloy/guides/getting-started/).
2. **alloy language components**: Libraries of components for various languages. For example, allows for declaring a variable in TypeScript, and then creating a reference to that variable such that any necessary imports and package.json dependencies are added. [Read the documentation for these components](https://alloy-framework.github.io/alloy/guides/getting-started/).
3. **typekits**: A convenient way to pull information from the TypeSpec type graph.
4. **emitter framework**: builds off of alloy and its language components to provide TypeSpec-aware components and utilities. For example, while the alloy language component for TypeScript interfaces allows manually declaring members, the emitter framework component can take a TypeSpec data type and convert it directly into a TypeScript interface.

When you are writing a TypeSpec emitter, you will draw on components and APIs from each of these areas.

## How to get started

We recommend you read the alloy documentation to understand its component model, reactivity system, formatting capabilities, and so forth. Alloy's [core concepts](https://alloy-framework.github.io/alloy/guides/basic-concepts/) document is a good place to start.

Also, make sure to read the 'Getting Started' section under the [emitter basics](./emitters-basics.md) topic. To use the framework, you will need an emitter library and a `$onEmit` function.

## Add necessary dependencies

There are a few dependencies needed to use the emitter framework:

```sh
npm install --save-peer @alloy-js/core @alloy-js/typescript @typespec/emitter-framework
```

This is in addition to the dependencies installed from the emitter template as described in [emitter basics](./emitters-basics.md).

## $onEmit basics

The main job of your onEmit function is to establish the overall structure of your emit output. This is done by using the following APIs and components:

- [`Output`](https://alloy-framework.github.io/alloy/reference/core/components/output/), which sets up a bunch of context, takes formatting options like `printWidth`, registers external symbols for libraries you're going to use, and does a few other things.
- [`SourceDirectory`](https://alloy-framework.github.io/alloy/reference/core/components/sourcedirectory/) which creates a source directory at a given path.
- [`SourceFile`](https://alloy-framework.github.io/alloy/reference/core/components/sourcefile/) component from `@alloy-js/core`, or from an alloy language component library such as [TypeScript](https://alloy-framework.github.io/alloy/reference/typescript/components/sourcefile/).
- `writeOutput` from `@typespec/emitter-framework`, which renders all your emitter content and writes it to disk.

For example, your `$onEmit` function could look like this:

```tsx
import { Output, SourceDirectory, SourceFile } from "@alloy-js/core";
import type { EmitContext } from "@typespec/compiler";
import { writeOutput } from "@typespec/emitter-framework";

export async function $onEmit(context: EmitContext) {
  await writeOutput(
    <Output>
      <SourceDirectory path="src" />
      <SourceFile path="README.md" filetype="md">
        Hello world!
      </SourceFile>
    </Output>,
    context.emitterOutputDir,
  );
}
```

If you run this emitter, you will see a `src` directory and a `README.md` file in your `tsp-output` directory.

## TypeScript Emitter Framework Components

The TypeScript emitter framework wraps components from the Alloy TypeScript component library by adding a `type` prop that accepts a TypeSpec type, allowing for easy translation of TypeSpec to TypeScript:

- `<ClassMethod type={Operation}>` - emit a TypeSpec operation as a class method.
- `<EnumDeclaration type={Union | Enum} />` - emit a TypeSpec union or enum as a TypeScript enum.
- `<FunctionDeclaration type={Operation}>` - emit a TypeSpec operation as a function declaration.
- `<InterfaceDeclaration type={Model | Interface}>` - emit a TypeSpec model or interface as a TypeScript interface type.
- `<TypeAliasDeclaration type={Scalar} />` - emit a scalar type as a TypeScript Type Alias.
- `<TypeDeclaration type={Type} />` - emit a TypeSpec type as an appropriate TypeScript type declaration.
- `<TypeExpression type={Type} />` - emit a TypeSpec type as an appropriate TypeScript type expression.
- `<UnionDeclaration type={Union | Enum} />` - emit a TypeSpec Union or Enum as a TypeScript type declaration for a union.
- `<UnionExpression type={Union | Enum} />` - emit a TypeSpec Union or Enum as a TypeScript union expression.

There are also some additional components handy for emitting TypeScript from TypeSpec:

- `<ArrayExpression elementType={Type} />` - emit a TypeScript array type of the given type.
- `<RecordExpression elementType={Type} >` - emit a TypeScript record type of the given type.

### Example TypeScript emitter

This example emitter will emit TypeScript types for some TypeSpec types.

```tsx
import { For, Output, SourceDirectory, SourceFile } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { EmitContext } from "@typespec/compiler";
import { writeOutput } from "@typespec/emitter-framework";

export async function $onEmit(context: EmitContext) {
  // get some models from the type graph
  const types = getInterestingTypes();
  await writeOutput(
    <Output>
      <SourceDirectory path="src">
        <ts.SourceFile path="index.ts">
          <For each={types}>{(type) => <ts.TypeDeclaration type={type} />}</For>
        </ts.SourceFile>
      </SourceDirectory>
      <SourceFile path="README.md" filetype="md">
        Hello world!
      </SourceFile>
    </Output>,
    context.emitterOutputDir,
  );
}
```

## Typekits

Typekits provide convenient access to many compiler APIs that your emitter is likely to need. For example, typekits provide APIs to examine type relationships (like "is this a subtype of a string"), extract decorator metadata (like "give me the documentation for this type"), or even create types on the fly.

Typekits are extensible, and libraries can provide additional typekits to provide APIs useful for emitters supporting that library. For example, the HTTP library provides typekits to query HTTP metadata and pull together many different pieces of metadata into a useful object model.

### Using typekits

#### 1. Import any extensions you need

If you are writing an emitter that needs HTTP metadata, place the following import somewhere in your compilation. It only needs to exist once as only its side effects are important.

```ts
// reflect on http metadata
import "@typespec/http/experimental/typekit";
```

#### 2. Import `$`

Import `$` in any source files you need to use compiler APIs:

```ts
import { $ } from "@typespec/compiler/experimental/typekit";
```

Any extensions you've imported will be available on the `$` object.

#### 3. Use typekits

```ts
if ($.scalar.extendsString(maybeString)) {
  console.log("Have a string scalar!");
}
```

### Default typekits

The typekits that are always available are the following:

- **array**: reflect on and create array types
- **builtin**: references to all built-in types like scalars
- **enum**: reflect on and create enum types
- **enumMember**: reflect on and create enum members
- **literal**: reflect on and create literal types
- **model**: reflect on and create model types
- **modelProperty**: reflect on and create model properties
- **operation**: reflect on and create operation types
- **record**: reflect on and create record types
- **type**: generic type utilities and query metadata applicable to multiple types (e.g. docs and built-in constraints)
- **union**: reflect on and create union types
- **unionVariant**: reflect on and create union variants
- **value**: reflect on and create values

### Http typekits

Http typekits are added with this import:

```ts
import "@typespec/http/experimental/typekit";
```

It adds useful methods to the default typekits:

- **model**: check if a model is well-known to HTTP like `HttpFile`
- **modelProperty**: reflect on http-specific metadata applied to model properties like `@header`, `@query`, etc.

It also adds the following typekits:

- **httpOperation**: get a useful object model for HTTP operations which contains various important bits of information like path, verb, parameters, return types, etc.
- **httpPart**: reflect on HTTP parts
- **httpRequest**: reflect on the request of HTTP operations
- **httpResponse**: reflect on the response of HTTP operations
