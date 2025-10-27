# Mutator Framework

** WARNING: THIS PACKAGE IS EXPERIMENTAL AND WILL CHANGE **

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

The key APIs are:

- `MutationEngine` – orchestrates creation, caching, and traversal of mutation nodes.
- `SimpleMutationEngine` – a convenience engine that exposes a single default mutation subgraph.
- `MutationOptions` – lets you parameterize a mutation run and cache its results.
- `ModelMutation`, `ModelPropertyMutation`, `UnionMutation`, `UnionVariantMutation`,
  `OperationMutation`, etc. – base classes for crafting custom mutations per TypeSpec kind.
- `MutationSubgraph` – creates an isolated graph of mutated types that can be inspected or
  retrieved later.
- `ModelMutationNode`, `ModelPropertyMutationNode`, `UnionMutationNode`, etc. -
  nodes which represent the possible mutation of a particular type graph type.

## Getting Started

```ts
import type { Model, Program } from "@typespec/compiler";
import { $, type Typekit } from "@typespec/compiler/typekit";
import { SimpleMutationEngine } from "@typespec/mutator-framework";

// Create a typekit for the program
const tk: Typekit = $(program);

// Instantiate an engine for running the mutations.
// Might be the built-in SimpleMutationEngine, or a
// custom `MutationEngine` subclass.
const engine = new SimpleMutationEngine(tk, {
  Model: RenameModelMutation, // defined later in this guide
});
const renamedMutation = engine.mutate(someType);
const mutatedType = renamedMutation.mutatedType;
```

## Defining Custom Mutation Options

Options derive from `MutationOptions`. They let you tune mutations (for example,
to switch on features or change naming rules) and provide a cache key used to
memoize results. Extend the class and override `cacheKey()` to represent your
configuration.

```ts
// rename-mutations.ts
import { MutationOptions } from "@typespec/mutator-framework";

export class RenameMutationOptions extends MutationOptions {
  constructor(
    readonly prefix: string,
    readonly suffix: string,
  ) {
    super();
  }

  override cacheKey() {
    return `${this.prefix}-${this.suffix}`;
  }
}
```

## Creating a Custom Mutation Engine

`MutationEngine` is responsible for coordinating mutation nodes and subgraphs. Supply constructors
for each type kind you want to customize. Anything you omit defaults to the base implementations
(`ModelMutation`, `ModelPropertyMutation`, etc.).

You can also register additional mutation subgraphs. Each subgraph represents an isolated view of
the mutated graph. This is useful when you want to compare alternative transformations side by side
(for example, with different naming conventions).

```ts
// rename-mutations.ts
import { MutationEngine, type MutationSubgraph } from "@typespec/mutator-framework";
import type { Typekit } from "@typespec/compiler/typekit";

export class RenameMutationEngine extends MutationEngine<{ Model: RenameModelMutation }> {
  constructor(typekit: Typekit) {
    super(typekit, { Model: RenameModelMutation });
    this.registerSubgraph("prefix");
    this.registerSubgraph("suffix");
  }

  getPrefix(options: RenameMutationOptions): MutationSubgraph {
    return this.getMutationSubgraph(options, "prefix");
  }

  getSuffix(options: RenameMutationOptions): MutationSubgraph {
    return this.getMutationSubgraph(options, "suffix");
  }
}
```

The base `MutationEngine` does not define a default subgraph. If you just need a single mutated
view, use the `SimpleMutationEngine`. It auto-registers a `"subgraph"` and wires
`getDefaultMutationSubgraph` for you:

```ts
import { SimpleMutationEngine } from "@typespec/mutator-framework";

const engine = new SimpleMutationEngine(tk, {
  Model: RenameModelMutation,
});
```

## Writing Mutation Classes

Mutation classes derive from the base classes included in the framework. Each class receives the
engine, the source TypeSpec type, the list of reference members that referenced that type (if any),
and the options. Override `mutate()` to perform your transformations.

Inside `mutate()` you can:

- Traverse connected types via `this.engine.mutate(...)` or `this.engine.mutateReference(...)`.
- Retrieve or create mutation nodes with `this.getMutationNode()`.
- Mutate values using `this.mutateType()` or `engine.mutateType(...)`.
- Switch subgraphs by calling `this.engine.getMutationSubgraph(...)`.

### Example: Renaming Models in Multiple Subgraphs

```ts
// rename-mutations.ts
import { ModelMutation } from "@typespec/mutator-framework";

export class RenameModelMutation extends ModelMutation<
  RenameMutationOptions,
  { Model: RenameModelMutation },
  RenameMutationEngine
> {
  get withPrefix() {
    return this.getMutatedType(this.engine.getPrefix(this.options));
  }

  get withSuffix() {
    return this.getMutatedType(this.engine.getSuffix(this.options));
  }

  mutate() {
    if ("name" in this.sourceType && typeof this.sourceType.name === "string") {
      this.mutateType(this.engine.getPrefix(this.options), (model) => {
        model.name = `${this.options.prefix}${model.name}`;
      });

      this.mutateType(this.engine.getSuffix(this.options), (model) => {
        model.name = `${model.name}${this.options.suffix}`;
      });
    }

    // Always call super.mutate() if you still want the base implementation
    // to traverse properties, base models, indexers, etc. with the same options.
    super.mutate();
  }
}
```

### Running the Mutation

```ts
import type { Model, Program } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { RenameMutationEngine, RenameMutationOptions } from "./rename-mutations.js";

export function applyRename(program: Program, fooModel: Model) {
  const engine = new RenameMutationEngine($(program));
  const options = new RenameMutationOptions("Pre", "Suf");

  const fooMutation = engine.mutate(fooModel, options);
  const prefixFoo = fooMutation.withPrefix;
  const suffixFoo = fooMutation.withSuffix;

  const propMutation = fooMutation.properties.get("prop")!;
  const barMutation = propMutation.type as RenameModelMutation;

  return {
    prefixFoo,
    suffixFoo,
    barWithSuffix: barMutation.withSuffix,
  };
}
```

### Example: Mutating Referenced Types

`ModelPropertyMutation` exposes `mutateReference` and `replaceReferencedType`
helpers that make it easy to mutate types referenced by properties. When
mutating references, a clone of the referenced type is made, so changes to not
affect the referenced type. This enables references to reference a unique type
with mutations that are particular to that type when referenced in that context.
For example, if the model property contains a decorator that affects the
mutation of a referenced scalar.

```ts
import type { Model, Program } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import {
  ModelMutation,
  ModelPropertyMutation,
  MutationOptions,
  SimpleMutationEngine,
} from "@typespec/mutator-framework";

class UnionifyOptions extends MutationOptions {}

class UnionifyModel extends ModelMutation<
  UnionifyOptions,
  UnionifyMutations,
  SimpleMutationEngine<UnionifyMutations>
> {
  get unionified() {
    return this.getMutatedType();
  }
}

class UnionifyProperty extends ModelPropertyMutation<
  UnionifyOptions,
  UnionifyMutations,
  SimpleMutationEngine<UnionifyMutations>
> {
  get unionified() {
    return this.getMutatedType();
  }

  mutate() {
    if (!this.engine.$.union.is(this.sourceType.type)) {
      const unionVariant = this.engine.$.unionVariant.create({ type: this.sourceType.type });
      const fallbackVariant = this.engine.$.unionVariant.create({
        type: this.engine.$.builtin.string,
      });

      const unionType = this.engine.$.union.create({ variants: [unionVariant, fallbackVariant] });

      this.type = this.replaceReferencedType(
        this.engine.getDefaultMutationSubgraph(this.options),
        unionType,
      );
    } else {
      super.mutate();
    }
  }
}

interface UnionifyMutations {
  Model: UnionifyModel;
  ModelProperty: UnionifyProperty;
}

export function createUnionifyEngine(program: Program) {
  const tk = $(program);
  return new SimpleMutationEngine(tk, {
    Model: UnionifyModel,
    ModelProperty: UnionifyProperty,
  });
}

export function unionifyModel(program: Program, fooModel: Model) {
  const engine = createUnionifyEngine(program);
  const fooMutation = engine.mutate(fooModel, new UnionifyOptions());
  const propMutation = fooMutation.properties.get("prop")!;

  return {
    property: propMutation.unionified,
    model: fooMutation.unionified,
  };
}
```

## Core Mutation Base Classes

| Class                   | Source Type                    | Responsibilities                                           |
| ----------------------- | ------------------------------ | ---------------------------------------------------------- |
| `ModelMutation`         | `Model`                        | Traverses base models, properties, and indexers.           |
| `ModelPropertyMutation` | `ModelProperty`                | Mutates referenced types, exposes `replaceReferencedType`. |
| `UnionMutation`         | `Union`                        | Iterates over variants and lazy-loads their mutations.     |
| `UnionVariantMutation`  | `UnionVariant`                 | Handles referenced variant types.                          |
| `ScalarMutation`        | `Scalar`                       | Provides access to scalar definitions and projections.     |
| `LiteralMutation`       | string/number/boolean literals | Provides literal values and traversal control.             |
| `OperationMutation`     | `Operation`                    | Mutates parameters, return types, and decorators.          |
| `InterfaceMutation`     | `Interface`                    | Walks operations declared on the interface.                |
| `IntrinsicMutation`     | `Intrinsic`                    | Surfaces intrinsic TypeSpec types.                         |

Each class inherits from the foundational `Mutation` class, which provides
shared helpers for mutated types (`getMutatedType`) and nodes
(`getMutationNode`). Override them or add convenience getters/setters to tailor
the experience for your consumers.

## Working with Mutation Subgraphs

The engine builds mutation nodes inside a `MutationSubgraph`. Each subgraph
captures a set of mutations that share the same options and transformation
logic.

```ts
const prefixGraph = engine.getPrefix(renameOptions);
const prefixFoo = engine.getMutatedType(prefixGraph, Foo);

const suffixGraph = engine.getSuffix(renameOptions);
const suffixFoo = engine.getMutatedType(suffixGraph, Foo);

console.log(prefixFoo.name, suffixFoo.name);
```

When you call `engine.mutate(type, options)` the engine automatically creates mutation nodes in all
registered subgraphs for the provided options. Subsequent calls reuse the cached nodes, so you can
freely navigate the mutation graph without re-running your transformation logic.

## Tips for Building Mutations

- **Always call `super.mutate()`** when you want the default traversal logic after your custom
  changes. Skipping it gives you full control, but you must handle traversal yourself.
- **Use `MutationOptions` subclasses** whenever your mutation behavior depends on input
  configuration. Return a stable `cacheKey()` to reuse work.
- **Inspect `referenceTypes`** to learn which `ModelProperty` or `UnionVariant` led to the current
  mutation node. This helps you emit diagnostics or perform context-sensitive logic.
- **Mutate lazily**. Mutations only run once per `(type, options)` pair. If you expose getters that
  trigger work, they should go through `engine.mutate(...)` so the cache stays consistent.
- **Prefer `SimpleMutationEngine`** unless you need named subgraphs. You can graduate to a custom
  engine later.

## Additional Resources

- Browse the rest of the files under `packages/mutator-framework/src/mutation` to see the built-in
  mutation implementations.
- The unit tests in `mutation-engine.test.ts` demonstrate more end-to-end usage patterns, including
  multi-subgraph mutations and reference replacements.
