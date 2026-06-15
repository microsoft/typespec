---
name: graphql-emitter
description: Architecture guide for the Pinterest GraphQL emitter (@typespec/graphql). Use when the agent needs to (1) work on the mutation engine or renderer components in packages/graphql, (2) understand the two-phase architecture (mutation → render), (3) add new mutations or structural transforms, (4) implement or modify rendering components that consume the TypeGraph, (5) understand how decorator state (nullable, oneOf, interface) flows from mutation to render, or (6) debug issues where types aren't correctly named, classified, or rendered. Covers the TypeGraph contract, key invariants, PR chain, and references to the design doc and prototype emitter.
---

# GraphQL Emitter Architecture

The GraphQL emitter at `packages/graphql/` transforms TypeSpec types into GraphQL SDL using a two-phase architecture: mutation (transform types) → render (emit SDL).

Related skills: `mutator-framework` (mutation engine API), `emitter-framework` (rendering/JSX patterns).

## Two-Phase Architecture

```
TypeSpec Program
  → Schema Mutator (schema-mutator.ts)
    → Mutation Engine (GraphQLMutationEngine)
      → Custom mutations (model, scalar, enum, union, operation)
    → Type Graph (buildTypeGraph)
  → Renderer (schema.tsx → components/)
    → alloy-js/graphql
    → printSchema() → SDL output
```

**Phase 1 — Mutation:** All structural transforms happen here. Names, input/output splitting, visibility filtering, interface suffixes, Record→scalar conversion, nullable unwrapping — everything. After mutation, `type.name` IS the final GraphQL name.

**Phase 2 — Render:** Thin JSX components that iterate the TypeGraph and emit declarations. No re-inspection of type structure. Components use `resolveGraphQLTypeName(type)` for field type names and decorator state (`isNullable`, `hasNullableElements`, `isInterface`, `isInputType`) for classification.

## Key Files

| File | Role |
|------|------|
| `src/emitter.tsx` | Entry point (`$onEmit`). Lists schemas, builds TypeGraph, renders SDL. |
| `src/mutation-engine/schema-mutator.ts` | Orchestrates mutation. Walks namespace, decides what to mutate and in which context. |
| `src/mutation-engine/engine.ts` | `GraphQLMutationEngine` — wraps `MutationEngine` with typed methods. |
| `src/mutation-engine/mutations/model.ts` | Model mutation: naming, Record→scalar, visibility filtering, baseModel flattening. |
| `src/mutation-engine/mutations/operation.ts` | Operation mutation: field name pipeline, interface prefix, param/return context. |
| `src/mutation-engine/mutations/union.ts` | Union mutation: nullable unwrap, single-variant collapse, @oneOf input, wrapper models. |
| `src/mutation-engine/mutations/scalar.ts` | Scalar mutation: std→builtin mapping, custom scalar naming, @specifiedBy. |
| `src/mutation-engine/type-graph.ts` | `buildTypeGraph`: packages mutated types into namespace, recursively registers property refs. |
| `src/type-usage.ts` | Resolves which types are Input/Output/both, tracks operation-kind variance. |
| `src/components/schema.tsx` | Root renderer: iterates TypeGraph, classifies models, renders declarations. |
| `src/components/types/object-type.tsx` | Renders `type Foo { ... }` from Model. |
| `src/components/types/input-type.tsx` | Renders `input FooInput { ... }` from Model. |
| `src/components/types/interface-type.tsx` | Renders `interface Foo { ... }` from Model. |
| `src/components/fields/field.tsx` | Renders a single field with type, nullability, description. |
| `src/components/fields/operation-field.tsx` | Renders operation as field with args (Query/Mutation/Subscription). |

## TypeGraph Contract

`TypeGraph = { globalNamespace: Namespace }` — a namespace containing all mutated types.

**Who provides root types:** The schema-mutator explicitly adds models, enums, scalars, unions, and operations to `mutatedTypes[]`.

**Who provides transitive types:** `buildTypeGraph` recursively follows model property edges and operation signatures to register referenced types (e.g., nested generics, Record scalars). Takes a `shouldIncludeRef` filter to exclude std/library scalars.

**`type.isFinished = true`** is set on all registered types (required by `navigateTypesInNamespace`'s `shouldNavigateTemplatableType` check). No `finishType()` is called (that would re-invoke decorators).

## Schema Mutator Patterns

The schema-mutator's `navigateTypesInNamespace` walk decides what enters the graph:

- **Models:** Interface context (if `@Interface`), Output context (if used as output or no usage), Input context (if used as input, with visibility filtering and query/mutation variance).
- **Unions (output):** Only push if `mutatedType.kind === "Union"` (nullable unwrap and single-variant collapse produce non-Union results that are already handled elsewhere).
- **Unions (input):** Only push if result is Model (`@oneOf`) or Union.
- **`pushMutatedModel`:** Detects Record→scalar replacement (`node.isReplaced`) and pushes the replacement scalar instead.

## Mutation Key Invariants

- `GraphQLMutationOptions` carries `typeContext` (Input/Output/Interface), `visibilityFilter`, and `operationKind`.
- Cache key = `typeContext + operationKind`. Same type in different contexts = separate mutations.
- Input variance: when visibility produces different property sets for query vs mutation, two input types are emitted (`UserQueryInput`, `UserMutationInput`).

## Renderer Decisions

1. **No `GraphQLTypeExpression` component.** Use `resolveGraphQLTypeName(type)` inline.
2. **No pre-classified buckets.** Walk TypeGraph, classify at render time using decorator state.
3. **Thin components.** Properties already have correct types/names/nullability from mutation. Components just map to alloy-js primitives.

## Build & Test Commands

```bash
export PATH="$HOME/.npm-global/bin:$PATH"

# Build
npx -y node@22 $HOME/.npm-global/bin/pnpm --filter @typespec/graphql run build

# Run all tests
npx -y node@22 $HOME/.npm-global/bin/pnpm --filter @typespec/graphql exec vitest run

# Run e2e manual validation (outputs SDL to test/e2e-manual/output/)
npx -y node@22 $HOME/.npm-global/bin/pnpm --filter @typespec/graphql exec vitest run test/e2e-manual/emit.test.ts
```

## Design Docs

Bundled in `references/` — read when you need deeper architectural context:
- [mutation-pipeline-design.md](references/mutation-pipeline-design.md) — Four-stage pipeline architecture
- [renderer-architecture.md](references/renderer-architecture.md) — Renderer decisions (no TypeExpression, no buckets, walk TypeGraph)
- [e2e-testing-strategy.md](references/e2e-testing-strategy.md) — 43-pattern test matrix
- [transformation-inventory.md](references/transformation-inventory.md) — All transforms by stage
