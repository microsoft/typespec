# Mutator Framework

**WARNING: THIS PACKAGE IS EXPERIMENTAL AND WILL CHANGE**

This package provides utilities for building mutations of the TypeSpec type
graph. Mutations are modifications to the original type graph that live in a
parallel type graph and contain additional metadata relevant to consumers of
those mutated types.

At a high level you:

- Create mutation classes that control how each TypeSpec type (models,
  properties, unions, scalars, literals, operations, etc.) is traversed and
  transformed.
- Use strongly-typed helper APIs on mutation nodes to mutate into new types or
  traverse to related nodes.
- Instantiate a `MutationEngine` subtype (e.g. `SimpleMutationEngine`) with the
  `Typekit` from the TypeSpec program you want to mutate.

## Key Concepts

### Mutations

Mutations are abstract classes that control how each TypeSpec type kind is
traversed and transformed. They have a protocol based on a static `mutationInfo`
method that returns a unique `mutationKey` for that mutation. If a mutation with
the same key exists, it is reused; otherwise, a new mutation is constructed.

The `mutationInfo` method can also return a `Mutation` directly, useful for
constructing a mutation view "as if" the type graph looked different.

### Mutation Nodes

Mutation nodes represent individual type transformations. They are unique per
`(type, mutationKey)` pair. Connections between nodes are built lazily using
half-edges - mutations call `startXEdge()` methods to create a `MutationHalfEdge`
that gets connected when the target mutation is resolved.

### Key APIs

- `MutationEngine` – orchestrates creation, caching, and traversal of mutations.
- `SimpleMutationEngine` – a convenience engine with Simple\* mutation classes
  that expose a single mutated type per source type.
- `MutationOptions` – lets you parameterize a mutation run and provide a `mutationKey`.
- `MutationHalfEdge` – represents the head-end of a connection; the tail is set when
  the target mutation is resolved.
- `ModelMutation`, `ModelPropertyMutation`, `UnionMutation`, etc. – abstract base
  classes for crafting custom mutations per TypeSpec kind.
- `SimpleModelMutation`, `SimpleModelPropertyMutation`, etc. – concrete implementations
  that expose `mutationNode` and `mutatedType` properties.

## Getting Started

```ts
import type { Model, Program } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {
  SimpleModelMutation,
  SimpleMutationEngine,
  SimpleMutationOptions,
} from "@typespec/mutator-framework";

// Define custom options with a mutationKey
class RenameMutationOptions extends SimpleMutationOptions {
  constructor(readonly suffix: string) {
    super();
  }

  get mutationKey() {
    return this.suffix;
  }
}

// Define a custom mutation that renames models
class RenameModelMutation extends SimpleModelMutation<RenameMutationOptions> {
  mutate() {
    if ("name" in this.sourceType && typeof this.sourceType.name === "string") {
      this.mutationNode.mutate(
        (type) => (type.name = `${this.sourceType.name}${this.options.suffix}`),
      );
    }
    super.mutate();
  }
}

// Create the engine and run mutations
const tk = $(program);
const engine = new SimpleMutationEngine(tk, {
  Model: RenameModelMutation,
});

const options = new RenameMutationOptions("Suf");
const fooMutation = engine.mutate(fooModel, options);
console.log(fooMutation.mutatedType.name); // "FooSuf"
```

## Defining Custom Mutation Options

Options derive from `MutationOptions` (or `SimpleMutationOptions` for simple
mutations). Override the `mutationKey` getter to provide a unique cache key for
your configuration. Mutations are cached per `(type, mutationKey)` pair.

```ts
import { SimpleMutationOptions } from "@typespec/mutator-framework";

class RenameMutationOptions extends SimpleMutationOptions {
  constructor(readonly suffix: string) {
    super();
  }

  get mutationKey() {
    return this.suffix;
  }

  with(options: Partial<{ suffix: string }>) {
    return new RenameMutationOptions(options.suffix ?? this.suffix);
  }
}
```

## Writing Mutation Classes

Mutation classes are abstract classes that derive from the base classes included
in the framework. Override `mutate()` to perform your transformations.

### The `mutationInfo` Protocol

Each mutation class has a static `mutationInfo` method that is called to
determine the unique key for a mutation. The default implementation uses
`options.mutationKey`. Override this to implement context-sensitive mutation
keys based on reference types or other factors:

```ts
class RenameModelBasedOnReferenceMutation extends SimpleModelMutation<SimpleMutationOptions> {
  static mutationInfo(
    engine: SimpleMutationEngine<{ Model: RenameModelBasedOnReferenceMutation }>,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: SimpleMutationOptions,
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ): MutationInfo {
    // Different key based on whether this type was reached via a reference
    if (referenceTypes.length === 0) {
      return {
        mutationKey: options.mutationKey + "-no-ref",
        hasReference: false,
        isSynthetic: traits?.isSynthetic,
      };
    }
    return {
      mutationKey: options.mutationKey + "-has-ref",
      hasReference: true,
      isSynthetic: traits?.isSynthetic,
    };
  }

  mutate() {
    if (this.mutationInfo.hasReference) {
      this.mutationNode.mutate((type) => (type.name = `${this.sourceType.name}Reference`));
    }
    super.mutate();
  }
}
```

### Lazy Connections with Half-Edges

Connections between mutations are built lazily. Mutations provide `startXEdge()`
methods that return a `MutationHalfEdge`. Pass this half-edge to `engine.mutate()`
or related methods. When the target mutation is resolved, its mutation node is
connected to the originating mutation's node:

```ts
class SimpleModelMutation extends ModelMutation {
  // Creates a half-edge for connecting to a property mutation
  startPropertyEdge() {
    return new MutationHalfEdge("property", this, (tail) =>
      this.mutationNode.connectProperty(tail.mutationNode),
    );
  }

  mutate() {
    for (const prop of this.sourceType.properties.values()) {
      // Pass the half-edge so the connection is made when resolved
      this.engine.mutate(prop, this.options, this.startPropertyEdge());
    }
  }
}
```

### Replacing Referenced Types

Use `engine.replaceAndMutateReference()` to substitute a type with a different
one while preserving the reference chain. This is useful for wrapping types in
unions or other containers:

```ts
class UnionifyProperty extends SimpleModelPropertyMutation<SimpleMutationOptions> {
  mutate() {
    if (!this.engine.$.union.is(this.sourceType.type)) {
      // Create a union wrapping the original type
      const newUnionType = this.engine.$.union.create({
        name: "DynamicUnion",
        variants: [
          this.engine.$.unionVariant.create({ type: this.sourceType.type }),
          this.engine.$.unionVariant.create({ type: this.engine.$.builtin.string }),
        ],
      });

      // Update the mutation node
      this.mutationNode.mutate((prop) => {
        prop.type = newUnionType;
      });

      // Replace and mutate the reference
      this.type = this.engine.replaceAndMutateReference(
        this.sourceType,
        newUnionType,
        this.options,
        this.startTypeEdge(),
      );
    } else {
      super.mutate();
    }
  }
}
```

### Returning Mutations from `mutationInfo`

The `mutationInfo` method can return a `Mutation` directly instead of a
`MutationInfo` object. This is useful for completely substituting the mutation
for a different one:

```ts
class NullableReferencedModelMutation extends SimpleModelMutation<SimpleMutationOptions> {
  static mutationInfo(
    engine: SimpleMutationEngine<{ Model: NullableReferencedModelMutation }>,
    sourceType: Model,
    referenceTypes: MemberType[],
    options: SimpleMutationOptions,
    halfEdge?: MutationHalfEdge,
    traits?: MutationTraits,
  ) {
    // When accessed via a ModelProperty reference, return a union mutation instead
    if (referenceTypes.length > 0 && referenceTypes[0].kind === "ModelProperty") {
      const nullableUnion = engine.$.union.create({
        name: `${sourceType.name}NullableUnion`,
        variants: [
          engine.$.unionVariant.create({ name: "Value", type: sourceType }),
          engine.$.unionVariant.create({ name: "Null", type: engine.$.intrinsic.null }),
        ],
      });

      // Return a mutation for the union instead
      return engine.replaceAndMutateReference(referenceTypes[0], nullableUnion, options, halfEdge);
    }

    return super.mutationInfo(engine, sourceType, referenceTypes, options, halfEdge, traits);
  }
}
```

Mutation nodes also have a `replace` method. Returning a new mutation from MutationInfo makes the resulting Mutations look "as if" the source type graph were shaped differently. This is useful for doing things like normalizations of the type graph. The structure of the Mutations mimic this new structure. When you `replace` on a mutation node, the Mutation stays the same, but the mutated type graph is changed. This is useful for doing things like renaming things or swapping scalars in situations where you want to see both the source type and the mutated type in order to compare them.

## Mutation Caching

Mutations are automatically cached and reused. When you call `engine.mutate()`
with the same type and options (determined by `mutationKey`), you get back the
same mutation instance:

```ts
const barMutation = engine.mutate(Bar, new RenameMutationOptions({ suffix: "X" }));
const fooMutation = engine.mutate(Foo, new RenameMutationOptions({ suffix: "X" }));

// When traversing from Foo to its Bar property, we get the same mutation
expect(fooMutation.properties.get("prop")!.type === barMutation).toBe(true);
```

### Simple Mutation Classes

The `Simple*` mutation classes (e.g., `SimpleModelMutation`, `SimpleModelPropertyMutation`)
are concrete implementations that provide:

- A `mutationNode` property for accessing the underlying mutation node
- A `mutatedType` property for accessing the mutated TypeSpec type
- `startXEdge()` methods for creating half-edges to connected types

## Tips for Building Mutations

- **Always call `super.mutate()`** when you want the default traversal logic after your custom
  changes. Skipping it gives you full control, but you must handle traversal yourself.
- **Use `mutationKey`** to differentiate mutations. Mutations are cached per `(type, mutationKey)` pair.
- **Inspect `referenceTypes`** in `mutationInfo` to learn which `ModelProperty` or `UnionVariant`
  led to the current mutation. This enables context-sensitive mutations.
- **Use half-edges** for lazy connections. Call `startXEdge()` and pass the result to `engine.mutate()`.
- **Override `mutationInfo`** to return different mutation keys or substitute mutations entirely.
- **Use `replaceAndMutateReference`** when you need to substitute a type with a synthetic one.

## Additional Resources

- Browse the files under `packages/mutator-framework/src/mutation` to see the built-in
  mutation implementations.
- The unit tests in `simple-mutation-engine.test.ts` demonstrate end-to-end usage patterns,
  including custom mutation keys, reference replacements, and type substitutions.
