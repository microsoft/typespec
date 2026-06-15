# Mutation Pipeline Architecture

## Overview

The GraphQL emitter uses a four-stage mutation pipeline. Each stage owns a `SimpleMutationEngine` from `@typespec/mutator-framework`, takes a type graph as input, and produces a new (copied, not mutated-in-place) type graph as output. Emitters receive final mutated types and use `type.name` directly.

## Four Stages

| Stage | Scope | Owner | Description |
|-------|-------|-------|-------------|
| 1 | General TypeSpec | Skipped (handled by Stage 3) | Template expansion, visibility filtering |
| 2 | General Pinterest | pinterest library | Operation name normalization, transparent model/union unwrapping |
| 3 | General GraphQL | `@typespec/graphql` | All GraphQL-specific transforms (naming, splitting, scalars, etc.) |
| 4 | Pinterest GraphQL | pinterest library | V5_ prefix, delete mutation synthesis, forbidden union filtering |

```
Source Program
  → Stage 2 (General Pinterest)  → mutated types₂
  → Stage 3 (General GraphQL)    → mutated types₃
  → Stage 4 (Pinterest GraphQL)  → mutated types₄
  → Emitter (uses mutated types₄)
```

## Stage 3: General GraphQL (this emitter)

Implemented in `packages/graphql/src/mutation-engine/`. Transforms:

| Transform | Implementation | Example |
|-----------|---------------|---------|
| Template name expansion | `composeTemplateName()` in model mutation | `PagedResponse<User>` → `PagedResponseOfUser` |
| Anonymous union naming | Union mutation | `op getPet(): Cat \| Dog` → `GetPetUnion` |
| PascalCase types, camelCase fields, CONSTANT_CASE enums | Naming pipeline (`lib/naming.ts`) | `ad_account` → `AdAccount` |
| Input type naming + splitting | Model mutation with Input context | `User` → `UserInput` |
| Interface suffix | Model mutation with Interface context | `Animal` → `AnimalInterface` |
| Visibility filtering | Model mutation `mutateProperties` override | Read-only fields excluded from input |
| Operation-kind-aware input split | Schema mutator + type-usage variance | `UserQueryInput` vs `UserMutationInput` |
| Record-to-scalar | Model mutation `isRecordType` branch | `Record<string>` → `scalar RecordOfString` |
| Union flattening/collapsing | Union mutation | Single-variant union → inner type |
| Nullable union unwrap | Union mutation | `T \| null` → `T` with nullable decorator |
| BaseModel flattening | Model mutation `flattenBaseModel()` | `extends` fields merged into child |
| Interface prefix for TypeSpec `interface` keyword | Operation mutation | `interface BoardOps { get }` → `boardOpsGet` |
| @oneOf input for unions | Union mutation in Input context | `union Pet` as input → `input PetInput @oneOf` |

## Execution Model

1. Schema mutator (`schema-mutator.ts`) walks the schema namespace via `navigateTypesInNamespace`
2. For each type, decides context (Interface/Output/Input) and calls `engine.mutateModel/Enum/Scalar/Union/Operation`
3. Mutation classes transform via `mutate()` method, engine caches by `(type, mutationKey)`
4. Results collected in `mutatedTypes[]`, passed to `buildTypeGraph`
5. `buildTypeGraph` recursively registers all referenced types, producing a self-contained `TypeGraph`

## Caching

Mutations cached per `(type, mutationKey)`. `GraphQLMutationOptions` produces keys from `typeContext + operationKind`. Same model in Output vs Input context = separate cached mutations with different names.

## Orchestration

For the open-source emitter (standalone):
```typescript
// emitter.tsx $onEmit
const typeUsage = resolveTypeUsage(program, schema, omitUnreachable);
const engine = createGraphQLMutationEngine(program);
const typeGraph = mutateSchema(program, engine, schema, typeUsage);
const sdl = renderSchema(program, typeGraph);
```

For Pinterest (multi-stage):
```typescript
// pinterest library orchestrates all stages
export function mutate(program: Program) {
  runStage2(tk);                                    // General Pinterest
  runStage3(tk, createGraphQLMutationEngine);       // @typespec/graphql
  runStage4(tk);                                    // Pinterest GraphQL
}
```

## Constraints

- Emitter receives pre-mutated types — no name composition or prefix logic in emitter code
- Query/Mutation field names are NOT prefixed (operations exempt from type prefixing)
- Copy, not mutate in place — each stage produces a parallel type graph
- Each stage is independent — no state leaks between stages
