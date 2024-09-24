---
id: emitter-framework
title: Emitter framework
---

# Emitter framework

:::warning
The emitter framework has many issues in its current form and a V2 using a completely different approach is in the works. Use with caution.
:::

The emitter framework simplifies the process of creating emitters from TypeSpec to other assets, compared to manually navigating the type graph. This framework provides a straightforward way to manage all the types that TypeSpec might present, and helps you determine when you've covered all features.

The also solves complex problems such as constructing references between types, handling circular references, and propagating the context of the types you're emitting based on their containers or where they're referenced from. Additionally, it offers a class-based inheritance model that simplifies the extension and customization of existing emitters.

## How to get started

Before you start, make sure to read the 'Getting Started' section under the [emitter basics](./emitters-basics.md) topic. To use the framework, you will need an emitter library and a `$onEmit` function.

All of the emitter framework functionality can be found in `@typespec/compiler/emitter-framework`

## Creating your own emitter

When you create an emitter using the emitter framework, you will use various types from the framework. Here's a high-level overview of these types:

- `AssetEmitter`: This is the main type you will use in your `$onEmit` function. You can pass types to the asset emitter to emit, and instruct it to write types to disk or provide you with source files for further processing.
- `TypeEmitter`: This is the base class for most of your emit logic. Every TypeSpec type has a corresponding method on TypeEmitter. This is also where you will manage your emit context, making it easy to answer questions like "is this type inside something I care about" or "was this type referenced from something".
- `CodeTypeEmitter`: This is a subclass of `TypeEmitter` that simplifies the creation of source code.
- `StringBuilder`, `ObjectBuilder`, `ArrayBuilder`: These classes are likely to be used when implementing your `TypeEmitter` to help you build strings and object graphs. They handle the placeholders that result from circular references.

Let's explore each of these types in more detail.

### `AssetEmitter<T>`

The asset emitter drives the emit process. It has methods for taking TypeSpec types to emit, and maintains the state of your current emit process, including the declarations you've accumulated, current emit context, and converting your emitted content into files on disk.

To create your asset emitter, call `getAssetEmitter` on your emit context in `$onEmit`. It takes the TypeEmitter which is covered in the next section. Once created, you can call `emitProgram()` to emit every type in the TypeSpec graph. Alternatively, you can call `emitType(someType)` to emit specific types.

```typescript
import { createAssetEmitter } from "@typespec/compiler/emitter-framework";

export async function $onEmit(context: EmitContext) {
  const assetEmitter = createAssetEmitter(MyTypeEmitter);

  // emit my entire TypeSpec program
  assetEmitter.emitProgram();
  // or, maybe emit types just in a specific namespace
  const ns = context.program.resolveTypeReference("MyNamespace")!;
  assetEmitter.emitType(ns);

  // lastly, write your emit output into the output directory
  await assetEmitter.writeOutput();
}
```

### `TypeEmitter<T>`

This is the base class for writing logic to convert TypeSpec types into assets in your target language. Every TypeSpec type has at least one method on this base class, and many have multiple methods. For example, models have both `ModelDeclaration` and `ModelLiteral` methods to handle `model Pet { }` declarations and `{ anonymous: boolean }` literals respectively.

To support emitting all TypeSpec types, you should expect to implement all of these methods. But if you don't want to support emitting all TypeSpec types, you can either throw or just not implement the method, in which case the type will not be emitted.

The generic type parameter `T` is the type of emit output you are building. For example, if you're emitting source code, `T` will be `string`. If you're building an object graph like JSON, `T` will be `object`. If your `T` is `string`, i.e. you are building source code, you will probably want to use the `CodeTypeEmitter` subclass which is a bit more convenient, but `TypeEmitter<string>` will also work fine.

Here's a simple emitter that doesn't do much yet:

```typescript
class MyCodeEmitter extends CodeTypeEmitter {
  modelDeclaration(model: Model, name: string) {
    console.log("Emitting a model named", name);
  }
}
```

If you pass this to `getAssetEmitter` and call `assetEmitter.emitProgram()`, it will log all the models in the program to the console.

#### EmitterOutput

Most methods of the `TypeEmitter` must either return `T` or an `EmitterOutput<T>`. There are four kinds of `EmitterOutput`:

- `Declaration<T>`: A declaration, which has a name and is declared in a scope, and so can be referenced by other emitted types. Declarations are created by calling `this.emitter.result.declaration(name, value)` in your emitter methods. Scopes come from your current context, which is covered later in this document.
- `RawCode<T>`: Output that is in some way concatenated into the output but cannot be referenced (e.g. things like type literals). Raw code is created by calling `this.emitter.result.rawCode(value)` in your emitter methods.
- `NoEmit`: The type does not contribute any output. This is created by calling `this.emitter.result.none()` in your emitter methods.
- `CircularEmit`: Indicates that a circular reference was encountered, which is generally handled by the framework with Placeholders (see the next section). You do not need to create this result yourself, the framework will produce this when required.

When an emitter returns `T` or a `Placeholder<T>`, it behaves as if it returned `RawCode<T>` with that value.

To create these results, you use the `result.*()` APIs on `AssetEmitter`, which can be accessed via `this.emitter.result` in your methods.

With this in mind, we can make `MyCodeEmitter` a bit more functional:

```typescript
class MyCodeEmitter extends CodeTypeEmitter {
  // context and scope are covered later in this document
  programContext(program: Program): Context {
    const sourceFile = this.emitter.createSourceFile("test.txt");
    return {
      scope: sourceFile.globalScope,
    };
  }

  modelDeclaration(model: Model, name: string) {
    const props = this.emitter.emitModelProperties(model);
    return this.emitter.result.declaration(name, `declaration of ${name}`);
  }
}
```

If we have a TypeSpec program that looks like:

```typespec
model Pet {}
```

and we call `assetEmitter.writeOutput()`, we'll find `test.txt` contains the contents `"declaration of Pet"`.

In order to emit properties of `Pet`, we'll need to concatenate the properties of pets with the declaration we made and leverage builders to make that easy. These topics are covered in the next two sections.

#### Concatenating results

It is very rare that you only want to emit a declaration and nothing else. Probably your declaration will have various parts to it, and those parts will depend on the emit output of the parts of the type your emitting. For example, a declaration from a TypeSpec model will likely include members based on the members declared in the TypeSpec.

This is accomplished by calling `emit` or other `emit*` methods on the asset emitter from inside your `AssetEmitter` methods. For example, to emit the properties of a model declaration, we can call `this.emitter.emitModelProperties(model)`. This will invoke your the corresponding `AssetEmitter` method and return you the `EmitterOutput` result.

It is unlikely that you want to concatenate this result directly. For declarations and raw code, the `value` property is likely what you're interested in, but there are other complexities as well. So in order to concatenate results together, you probably want to use a builder.

#### Builders

Builders are helpers that make it easy to concatenate output into your final emitted asset. They do two things of note: they handle extracting the value from `Declaration` and `rawCode` output, and they handle `Placeholder` values that crop up due to circular references. Three `builders` are provided:

- Strings: Using the `code` template literal tag, you can concatenate `EmitterOutput`s together into a final string.
- Object: Constructing an `ObjectBuilder` with an object will replace any `EmitterOutput` in the object with its value and handle placeholders as necessary.
- Array: Constructing an `ArrayBuilder` will let you push `EmitterOutput` and pull out the value and placeholders as necessary.

Now with these tools, we can make `MyCodeEmitter` even more functional:

```typescript
class MyCodeEmitter extends CodeTypeEmitter {
  // context is covered later in this document
  programContext(program: Program): Context {
    const sourceFile = this.emitter.createSourceFile("test.txt");
    return {
      scope: sourceFile.globalScope,
    };
  }

  modelDeclaration(model: Model, name: string) {
    const props = this.emitter.emitModelProperties(model);
    return this.emitter.result.declaration(name, code`declaration of ${name} with ${props}`);
  }

  modelPropertyLiteral(property: ModelProperty): EmitterOutput<string> {
    return code`a property named ${property.name} and a type of ${this.emitter.emitType(
      property.type,
    )}`;
  }

  modelLiteral(model: Model) {
    return `an object literal`;
  }
}
```

Now given a TypeSpec program like:

```typespec
model Pet {
  position: {};
}
```

we will find `test.txt` contains the output

> declaration of Pet with a property named position and a type of an object literal

#### References between emitted types

A common scenario when emitting to most targets is handling how to make references between types. This can get pretty complex, especially when the declarations are emitted into different scopes. The emitter framework does a lot of heavy lifting for you by calculating the scopes between your current context and the declaration you're trying to reference.

How declarations arrive in different scopes is covered in the Context section later in this document.

Let's look at the `reference` signature on the TypeEmitter:

```typescript
  reference(
    targetDeclaration: Declaration<string>,
    pathUp: Scope<string>[],
    pathDown: Scope<string>[],
    commonScope: Scope<string> | null
  ): string | EmitEntity<string> {}
```

The `reference` function is called with:

- `targetDeclaration`: The declaration we're making a reference to.
- `pathUp`: The scopes between our current scope and the common scope.
- `pathDown`: The scopes between the common scope and the declaration we're referencing.
- `commonScope`: The nearest scope shared between our current scope and the target declaration.

So let's imagine we have declarations under the following scopes:

```
source file
  namespace A
    namespace B
      model M1
  namespace C
    model M2
```

If M1 references M2, `reference` will be called with the following arguments:

- `targetDeclaration`: M2
- `pathUp`: [namespace B, namespace A]
- `pathDown`: [namespace C]
- `commonScope`: source file

For languages which walk up a scope chain in order to find a reference (e.g. TypeScript, C#, Java, etc.), you generally won't need `pathUp`, you can just join the scopes in the `pathDown` resulting in a reference like `C.M2`. Other times you may need to construct a more path-like reference, in which case you can emit for example a `../` for every item in `pathUp`, resulting in a reference like `../../C/M2`.

When the declarations don't share any scope, `commonScope` will be null. This happens when the types are contained in different source files. In such cases, your emitter will likely need to import the target declaration's source file in addition to constructing a reference. The source file has an `imports` property that can hold a list of such imports.

We can update our example emitter to generate references by adding an appropriate `references` method:

```typescript
class MyCodeEmitter extends CodeTypeEmitter {
  // snip out the methods we implemented previously

  // If the model is Person, put it into a special namespace.
  // We will return to this in detail in the next section.
  modelDeclarationContext(model: Model, name: string): Context {
    if (model.name === "Person") {
      const parentScope = this.emitter.getContext().scope;
      const scope = this.emitter.createScope({}, "Namespace", parentScope);

      return {
        scope,
      };
    } else {
      return {};
    }
  }

  reference(
    targetDeclaration: Declaration<string>,
    pathUp: Scope<string>[],
    pathDown: Scope<string>[],
    commonScope: Scope<string> | null,
  ): string | EmitEntity<string> {
    const segments = pathDown.map((s) => s.name);
    segments.push(targetDeclaration.name);

    return `a reference to ${segments.join(".")}`;
  }
}
```

Now if we emit the following TypeSpec program:

```typespec
model Pet {
  person: Person;
}

model Person {
  pet: Pet;
}
```

We will find that `test.txt` contains the following text:

> declaration of Pet with a property named person and a type of a reference to Namespace.Person

#### Placeholders

Consider the following TypeSpec program:

```typespec
model Pet {
  owner: Person;
}

model Person {
  pet: Pet;
}
```

In order to emit `Pet`, we need to emit `Person`, so we go to emit that. But in order to emit `Person`, we need to emit `Pet`, which is what we're already trying to do! We're at an impasse. This is a circular reference.

The emitter framework handles circular references via `Placeholder`s. When a circular reference is encountered, the `value` of an `EmitterOutput` is set to a placeholder that is filled in when we've finished constructing the thing we referenced. So in the case above, when emitting `Person` and we come across the circular reference to `Pet`, we'll return a `Placeholder`. We'll then come back to `Pet`, finish it and return an `EmitterOutput` for it, and then set any `Placeholder`s waiting for `Pet` to that output.

If you're using the `Builder`s that come with the framework, you will not need to worry about dealing with `Placeholder` yourself.

#### Context

When emitting TypeSpec, it's often necessary to know the context in which you are emitting the type. One piece of required context is `scope`, which tells the emitter framework where you want to place your declarations. But you might also want to easily answer questions like: am I emitting a model inside a particular namespace? Or am I emitting a model that is referenced from the return type of an operation? The emitter framework makes managing this context fairly trivial.

Every method that results in an `EmitterOutput` has a corresponding method for setting lexical and reference context. We saw this above when we created `modelDeclarationContext` in order to put some models into a different namespace.

##### Lexical Context

Lexical context is available when emitting types that are lexically contained within the emitted entity in the source TypeSpec. For example, if we set `modelDeclarationContext`, that context will be visible when emitting the model's properties and any nested model literals.

##### Reference Context

Reference context is passed along when making references and otherwise propagates lexically. For example, if we set `modelDeclarationReferenceContext`, that context will be visible when emitting the model's properties and any nested model literals just like with lexical context. But unlike with lexical context, if the current model references another type, then the reference context will be visible when emitting the referenced model.

Note that this means that we may emit the same model multiple times. Consider the following TypeSpec program:

```typespec
model Pet {}
model Person {
  pet: Pet;
}
```

If, when emitting Person, we set the reference context to `{ refByPerson: true }`, we will call `emitModel` for `Pet` twice, once with no context set, and once again with the context we set when emitting `Person`. This behavior is very handy when you want to emit the same model different ways depending on how it is used, e.g. when your emit differs whether a model is an input type or output type, or when a model's properties differ based on any `@visibility` decorators and the context the model appears in (e.g. for Resources, whether it's being read, updated, created, deleted, etc.).

#### Scope

The scope that declarations are created in is set in using context. When emitting all of your TypeSpec program into the same file, and not emitting types into any kind of namespace, it suffices to set scope once in `programContext`. Call `this.emitter.createSourceFile("filePath.txt")` to create a source file, which comes with a scope ready to use.

To emit into different source files, e.g. if we want to emit using a "one class per file" pattern, move the into a more granular context method. For example, if we instead create source files in `modelDeclarationContext`, then declarations for each model will be in their own file.

If we want to emit into namespaces under a source file, we can create scopes manually. Call `this.emitter.createScope(objectReference, name, parentScope)`. The `objectReference` is an object with metadata about the scope. You might use this to emit e.g. a namespace declaration in your target language, but often it can just be an empty object (`{}`). Name is the name of the scope, used when constructing references. And parent scope is the scope this is found under.

Lets return to our previous example:

```typescript
  modelDeclarationContext(model: Model, name: string): Context {
    if (model.name === "Person") {
      const parentScope = this.emitter.getContext().scope;
      const scope = this.emitter.createScope({}, "Namespace", parentScope);

      return {
        scope,
      };
    } else {
      return {};
    }
  }
```

We can now see how this results in the `Person` model being located in a nested scope - because we set `scope` on the context to a new scope we created via `this.emitter.setScope`.

### Extending `TypeEmitter`

TypeEmitters are classes and explicitly support subclassing, so you can customize an existing emitter by extending it and overriding any methods you want to customize in your subclass. In fact, emitters you find out in the ecosystem are likely not to work without creating a subclass, because they only know how to emit types, but you need to provide the scope for any declarations it wants to create. For example, if we have a base `TypeScript Emitter` that can convert TypeSpec into TypeScript, we might extend it to tell it to put all declarations in the same file:

```typescript
class MyTsEmitter extends TypeScriptEmitter {
  programContext(program: Program): Context {
    const sourceFile = this.emitter.createSourceFile("test.txt");
    return {
      scope: sourceFile.globalScope,
    };
  }
}
```

Or, if we want one class or interface per file, we might instead do something like:

```typescript
class MyTsEmitter extends TypeScriptEmitter {
  modelDeclarationContext(program: Program): Context {
    const sourceFile = this.emitter.createSourceFile("test.txt");
    return {
      scope: sourceFile.globalScope,
    };
  }
  // and similar for other declarations: Unions, Enums, Interfaces, and Operations.
}
```

This way, each model will be emitted in its own file.
