# E2E Testing Strategy

## Overview

The emitter validates correctness through two test suites:

1. **Inline snapshot tests** (`test/e2e.test.ts`) — small focused schemas, one pattern per test, asserts on exact SDL output
2. **Manual validation suite** (`test/e2e-manual/emit.test.ts`) — large interconnected schemas, writes SDL to files for inspection, asserts on key properties

Both use `emitSingleSchemaWithDiagnostics` from `test/test-host.ts` which compiles TypeSpec, runs the emitter, validates the output via `buildSchema()`, and returns the SDL string + diagnostics.

## Test Matrix

Coverage documented in `test/e2e-manual/TEST_COVERAGE.md`. Patterns tested:

### GraphQL Decorators

| # | Pattern | Expected Output |
|---|---------|----------------|
| 1 | `@query`, `@mutation`, `@subscription` | Root type grouping |
| 2 | `@Interface` (default) | `interface FooInterface { ... }` |
| 3 | `@Interface(#{interfaceOnly: true})` | `interface Foo { ... }` only, no suffix |
| 4 | `@compose(A, B)` | `type X implements A & B { ... }` |
| 5 | `@operationFields(op1, op2)` | Fields with args on object type |
| 6 | `@specifiedBy(url)` | `scalar X @specifiedBy(url: "...")` |
| 7 | `GraphQL.ID` | Field typed as `ID!` |
| 8 | Model in both contexts | `type Foo` + `input FooInput` |
| 9 | Input-only model | `input FooInput` only |
| 10 | Nested input models | Cascading `input` types |
| 11 | Named union | `union Pet = Cat \| Dog` |
| 12 | Scalar variant in union | Wrapper model generated |
| 14 | Anonymous union (return) | `GetPetUnion` |
| 15 | Anonymous union (property) | `FeedItemContentUnion` |

### TypeSpec Language Patterns

| # | Pattern | Expected Output |
|---|---------|----------------|
| 16 | Template model `<T>` | `PagedResponseOfUser` |
| 17 | Nested generic | `BatchResultOfPost` → `PagedResponseOfPost` |
| 18 | Constrained param `<S extends string>` | Resolves to concrete type |
| 19 | `extends` | All fields flattened into child |
| 20 | `...spread` | Spread fields appear on model |
| 21-24 | `Record<T>` variants | Custom scalar (`RecordOfString`, etc.) |
| 25 | Alias as union | Named union |
| 26-28 | Enums | CONSTANT_CASE, string values, @deprecated |
| 29 | Custom scalar | `scalar DateTime` |

### Nullability

| # | Pattern | Expected Output |
|---|---------|----------------|
| 30 | `field: T \| null` | No `!` |
| 31 | `field?: T` | No `!` |
| 32 | `field?: T \| null` | No `!` |
| 33 | `T[] \| null` | `[T!]` |
| 34 | `(T \| null)[]` | `[T]!` |
| 35 | `(T \| null)[] \| null` | `[T]` |
| 36 | `field?: T[]` | `[T!]` (no outer `!`) |

### Other

| # | Pattern | Expected Output |
|---|---------|----------------|
| 37-38 | TypeSpec `interface` keyword | Prefixed operations (`boardOpsGetBoard`) |
| 39-40 | Self/mutual reference | Recursive types |
| 41-43 | Visibility filtering | Read-only excluded from input, create-only from output |
| 44 | All-read-only as mutation input | Parameter pruned |
| 49/67 | Union as input | `@oneOf` input object |
| 57 | Generic as input | `CreateInputOfTagInput` |
| 60 | Circular input | Recursive input type |
| 69 | Single-variant union | Unwrapped to inner type |
| 72 | Recursive generic | `TreeNodeOfPost.children: [TreeNodeOfPost!]!` |

## Running Tests

```bash
export PATH="$HOME/.npm-global/bin:$PATH"

# Inline snapshot tests
npx -y node@22 $HOME/.npm-global/bin/pnpm --filter @typespec/graphql exec vitest run test/e2e.test.ts

# Manual validation (writes SDL to test/e2e-manual/output/)
npx -y node@22 $HOME/.npm-global/bin/pnpm --filter @typespec/graphql exec vitest run test/e2e-manual/emit.test.ts

# Full suite
npx -y node@22 $HOME/.npm-global/bin/pnpm --filter @typespec/graphql exec vitest run
```

## Known Gaps

| Ticket | Issue |
|--------|-------|
| API-5278 | Record<T> scalars duplicated per input/output context |
| API-5280 | Crash when nested model property type is fully visibility-filtered |
