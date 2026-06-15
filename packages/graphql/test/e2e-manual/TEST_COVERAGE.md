# E2E Manual Test Coverage

Manual validation of the GraphQL emitter against all TypeSpec patterns and GraphQL-specific features.
Each schema is emitted and the SDL output is verified for correctness.

## Running

```bash
export PATH="$HOME/.npm-global/bin:$PATH"
cd ~/code/typespec

# Build (required after code changes)
npx -y node@22 $HOME/.npm-global/bin/pnpm --filter @typespec/graphql run build

# Run e2e manual tests
npx -y node@22 $HOME/.npm-global/bin/pnpm --filter @typespec/graphql exec vitest run test/e2e-manual/emit.test.ts

# SDL output files are written to test/e2e-manual/output/
```

## Schema 01-core: Content Platform

Patterns: operations, models, scalars, enums, interfaces, unions, nullability, spread, extends, deprecation, circular refs, input/output split, Records.

| # | Pattern | Result |
|---|---------|--------|
| 1 | `@query`, `@mutation`, `@subscription` | Correct |
| 2 | `@Interface` (default) → `ReactableInterface` suffix | Correct |
| 3 | `@Interface(#{interfaceOnly: true})` → no suffix (`Node`, `Connection`) | Correct |
| 4 | `@compose(...)` single + multi (`Article implements Node`, `Review implements Node & ReactableInterface`) | Correct |
| 6 | `@specifiedBy(url)` on scalars | Correct |
| 7 | `GraphQL.ID` → `ID!` | Correct |
| 8 | Model in both input + output (`User` → `type User` + `input UserInput`) | Correct |
| 9 | Input-only model (`CreatePostInput`) | Correct |
| 10 | Nested input models (`CreateArticleInput` → `CreateAuthorInput` → `CreateReviewPolicyInput`) | Correct |
| 11 | Named union (`SearchResult`) | Correct |
| 12 | Scalar variant in union (`NotificationContentMessageUnionVariant`) | Correct |
| 14 | Anonymous union return → auto-named (`GetContentUnion`) | Correct |
| 15 | Anonymous union property → auto-named (`FeedItemContentUnion`) | Correct |
| 19 | `extends` (field flattening) | **BUG: fields not flattened (API-5279)** |
| 20 | `...spread` (Timestamps/Auditable fields on User) | Correct |
| 21 | `Record<string>` → `scalar RecordOfString` | Correct |
| 22 | `Record<Model>` → `scalar RecordOfMetric` | Correct |
| 25 | Alias as union (`Publishable = Post \| Article`) | Correct |
| 26 | Simple enum → CONSTANT_CASE | Correct |
| 27 | Enum with string values (`IMAGE_JPEG`) | Correct |
| 28 | `#deprecated` member → `@deprecated(reason: "...")` | Correct |
| 29 | Custom scalar (`DateTime`, `URL`, `Long`) | Correct |
| 30 | `field: T \| null` → no `!` | Correct |
| 31 | `field?: T` → no `!` | Correct |
| 33 | `T[] \| null` → `[T!]` | Correct |
| 34 | `(T \| null)[]` → `[T]!` | Correct |
| 35 | `(T \| null)[] \| null` → `[T]` | Correct |
| 36 | `field?: T[]` → `[T!]` (no outer `!`) | Correct |
| 37 | TypeSpec `interface` keyword → prefixed ops (`boardOpsGetBoard`) | Correct |
| 39 | Self-reference (`Comment.replies`) | Correct |
| 40 | Mutual reference (`User↔Post`) | Correct |
| 45 | All-optional model (`PostFilter`) | Correct |
| 54 | Deprecated field (`body @deprecated`) | Correct |
| 55 | Deprecated operation (`publishDraft @deprecated`) | Correct |
| 56 | Interface inheritance chain (`PagedConnection implements Connection`) | Correct |
| 59 | extends + spread combined | **BUG: extends portion missing (API-5279)** |
| 60 | Circular input model (`CreateCommentInput.replies`) | Correct |
| 69 | Single-variant union → unwrapped (`getWrapped: Article!`) | Correct |

## Schema 02-generics: Template Models

Patterns: template instantiation, nested generics, recursive generics, generic input.

| # | Pattern | Result |
|---|---------|--------|
| 16 | Template model `<T>` → `PagedResponseOfUser` | Correct |
| 17 | Nested generic → `BatchResultOfPost` references `PagedResponseOfPost` | Correct |
| 57 | Generic as input → `CreateInputOfTagInput` | Correct |
| 72 | Recursive generic → `TreeNodeOfPost.children: [TreeNodeOfPost!]!` | Correct |

## Schema 03-visibility: Visibility Filtering

Patterns: read-only exclusion, create-only exclusion, default visibility, empty input pruning, query/mutation split.

| # | Pattern | Result |
|---|---------|--------|
| 41 | `@visibility(Lifecycle.Read)` excluded from input (`AccountInput` has no `id`/`createdAt`) | Correct |
| 42 | `@visibility(Lifecycle.Create)` excluded from output (`Account` has no `password`) | Correct |
| 43 | Default (no decorator) → both contexts (`username`, `displayName`) | Correct |
| 44 | All-read-only model as mutation input → param pruned (`triggerJob` has no `info`) | Correct |
| — | Query/Mutation input split → `UserProfileQueryInput` vs `UserProfileMutationInput` | Correct |

## Schema 04-records: Record Types

Patterns: Record<string>, Record<Model>, Record<unknown>, Record<never>.

| # | Pattern | Result |
|---|---------|--------|
| 21 | `Record<string>` → `scalar RecordOfString` | Correct |
| 22 | `Record<Model>` → `scalar RecordOfMetric` | Correct |
| 23 | `Record<never>` → no fields contributed (StrictConfig has only own fields) | Correct |
| 24 | `Record<unknown>` nullable → `rawData: RecordOfUnknown` | Correct |

## Schema 05-union-input: Union as Input

Patterns: union in mutation parameter → @oneOf input object.

| # | Pattern | Result |
|---|---------|--------|
| 49/67 | Union as mutation param → `input PetInput @oneOf { cat: CatInput, dog: DogInput }` | Correct |

## Schema 06-descriptions: Documentation and Deprecation

Patterns: @doc on types/fields/params, #deprecated directive.

| # | Pattern | Result |
|---|---------|--------|
| 52 | `@doc` / `/** */` on fields → field descriptions | Correct |
| 53 | `@doc` on operations → query/mutation descriptions | Correct |
| 54 | `#deprecated` on field → `@deprecated(reason: "...")` | Correct |
| — | `@doc` on parameters → arg descriptions | Correct |

## Schema 07-opfields: @operationFields with Visibility

Patterns: operation fields on models, excluded from input types, interaction with visibility and query/mutation split.

| # | Pattern | Result |
|---|---------|--------|
| 5 | `@operationFields(op1, op2)` → fields with args on output type | Correct |
| — | Operation fields excluded from input types | Correct |
| — | Warning emitted when @operationFields model used as input | Correct |
| — | @operationFields + visibility filtering (read-only excluded from input) | Correct |
| — | @operationFields + query/mutation input split | Correct |

## Schema 08-gaps: Remaining Patterns

Patterns: optional+nullable, constrained generic.

| # | Pattern | Result |
|---|---------|--------|
| 18 | Constrained generic `<L extends string>` → resolves to `String` | Correct |
| 32 | `field?: T \| null` → no `!` | Correct |

## Schema 09-nested-empty: Known Crash (API-5280)

Edge case: model with property whose type is fully visibility-filtered.

| # | Pattern | Result |
|---|---------|--------|
| — | Nested empty model from visibility filtering | **CRASH: Unknown GraphQL type "InnerInput" (API-5280)** |

## Not Tested

| # | Pattern | Reason |
|---|---------|--------|
| 13 | Union flattening (spread) | TypeSpec union spread `...Union` syntax not supported |
| 38 | Generic interface extends | Not included (low priority) |

## Known Bugs

| Ticket | Summary |
|--------|---------|
| API-5278 | Record<T> scalars duplicated for input/output context (`RecordOfString` + `RecordOfStringInput`) |
| API-5279 | Model `extends` does not flatten base model fields into child type |
| API-5280 | Emitter crashes when nested model property type is fully visibility-filtered to empty |
