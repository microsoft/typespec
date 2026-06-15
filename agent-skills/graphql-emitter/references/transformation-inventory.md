# Transformation Inventory

All transforms implemented in Stage 3 (General GraphQL) of the mutation pipeline, organized by type kind.

## Model Transforms

| Transform | File | What it does |
|-----------|------|-------------|
| Template name expansion | `mutations/model.ts` | `PagedResponse<User>` → `PagedResponseOfUser` |
| Input type naming | `mutations/model.ts` via naming pipeline | Appends `Input` suffix in Input context |
| Interface suffix | `mutations/model.ts` via naming pipeline | Appends `Interface` suffix in Interface context |
| Input qualifier | `mutations/model.ts` via naming pipeline | `UserQueryInput` / `UserMutationInput` for operation-kind variance |
| Visibility filtering | `mutations/model.ts` `mutateProperties` | Excludes properties based on lifecycle visibility filter |
| Record-to-scalar | `mutations/model.ts` | `Record<T>` with no own properties → custom scalar |
| BaseModel flattening | `mutations/model.ts` `flattenBaseModel` | Copies inherited properties into child, clears baseModel |
| Decorator arg re-mutation | `mutations/model.ts` `mutateDecoratorTypeArgs` | @compose args mutated in Interface context |

## Operation Transforms

| Transform | File | What it does |
|-----------|------|-------------|
| Field name sanitization | `mutations/operation.ts` | camelCase via `applyFieldNamePipeline` |
| Interface prefix | `mutations/operation.ts` | `interface BoardOps { get }` → `boardOpsGet` |
| Parameter context | `mutations/operation.ts` `mutateParameters` | Params mutated with Input context + visibility |
| Return type context | `mutations/operation.ts` `mutateReturnType` | Return mutated with Output context |
| Empty param pruning | `mutations/operation.ts` | Removes params whose type was visibility-filtered to empty |

## Union Transforms

| Transform | File | What it does |
|-----------|------|-------------|
| Nullable unwrap | `mutations/union.ts` | `T \| null` → inner type + nullable decorator |
| Single-variant collapse | `mutations/union.ts` | `union Wrap { x: Foo }` → `Foo` |
| Scalar variant wrapping | `mutations/union.ts` | `union R { cat: Cat, msg: string }` → wrapper model |
| Union flattening | `mutations/union.ts` | Deduplicates after resolving nested variants |
| @oneOf input conversion | `mutations/union.ts` | Union in input context → `input PetInput @oneOf` |

## Scalar Transforms

| Transform | File | What it does |
|-----------|------|-------------|
| GraphQL.ID recognition | `mutations/scalar.ts` | `GraphQL.ID` → renamed to `ID`, baseScalar cleared |
| Custom scalar mapping | `mutations/scalar.ts` | `int64` → `Long` (via mapping table) |
| Name sanitization | `mutations/scalar.ts` | PascalCase via naming pipeline |
| @specifiedBy propagation | `mutations/scalar.ts` | URL from decorator or mapping table |

## Enum Transforms

| Transform | File | What it does |
|-----------|------|-------------|
| CONSTANT_CASE members | `mutations/enum.ts` | `PendingReview` → `PENDING_REVIEW` |
| Type name sanitization | `mutations/enum.ts` | PascalCase via naming pipeline |

## Schema-Level Orchestration

| Transform | File | What it does |
|-----------|------|-------------|
| Type usage resolution | `type-usage.ts` | Determines Input/Output/both per type |
| Unreachable filtering | `schema-mutator.ts` | Skips types not reachable from operations |
| Context-aware emission | `schema-mutator.ts` | Same type emitted in multiple contexts |
| Input operation variance | `schema-mutator.ts` | Detects when query/mutation need different input types |
| @operationFields warning | `schema-mutator.ts` | Warns when @operationFields model used as input |
| Type collision detection | `schema-mutator.ts` | Reports duplicate names in mutatedTypes |
| Transitive type discovery | `type-graph.ts` | Recursively registers property-referenced types |

## Not Transforms (Emitter Rendering)

These stay in the renderer — they're SDL construction details, not type-graph transforms:

| Item | Why |
|------|-----|
| Array unwrapping for `[Type!]!` | Emitter detail: reads array model indexer |
| Nullability `!` suffix logic | Emitter detail: reads nullable/optional state |
| Root type grouping (Query/Mutation/Subscription) | Emitter logic: routes by operation kind |
| @compose → `implements` clause | Emitter logic: reads composition state |
| Description/deprecation directives | Emitter logic: reads doc/deprecated state |
