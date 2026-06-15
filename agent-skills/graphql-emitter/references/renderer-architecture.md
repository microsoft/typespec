# Renderer Architecture

The renderer is Phase 2 of the emitter: thin JSX components that iterate the TypeGraph and emit GraphQL SDL declarations. All structural logic lives in the mutation engine — the renderer never re-inspects type structure.

## Core Principles

### 1. No GraphQLTypeExpression component

Use `resolveGraphQLTypeName(type)` directly in field components. This pure function maps mutated types to GraphQL names — std scalars get mapped (string → String), everything else uses `type.name` directly. By render time, `type.name` IS the final GraphQL name.

### 2. No pre-classified buckets — renderer walks TypeGraph

The inter-phase contract is `TypeGraph = { globalNamespace: Namespace }`. The renderer walks `typeGraph.globalNamespace` and classifies types at render time using decorator state:
- `isInterface(program, model)` → emit as `interface`
- `isInputType(model)` → emit as `input`
- `getOperationKind(program, op)` → route to Query/Mutation/Subscription

### 3. Thin components

Type components are wrappers around `@alloy-js/graphql` primitives. No business logic. No conditional rendering based on type structure.

```tsx
function ObjectType(props: { type: Model }) {
  const { program } = useTsp();
  const properties = [...props.type.properties.values()];
  return (
    <gql.ObjectType name={props.type.name} description={getDoc(program, props.type)}>
      {properties.map((prop) => <Field property={prop} />)}
    </gql.ObjectType>
  );
}
```

### 4. Nullability is inline

Determined at the field level using decorator state set during mutation:
```ts
const nullable = isNullable(prop) || prop.optional;
const isList = type.kind === "Model" && isArrayModelType(type);
const elemNullable = isList && hasNullableElements(prop);
```

### 5. Name resolution is singular

All type name resolution goes through `resolveGraphQLTypeName(type)`. If a name is wrong, the fix is in the mutation engine, never in the renderer.

## Schema Component (orchestrator)

`src/components/schema.tsx` iterates the TypeGraph namespace and renders all declarations:

```tsx
function Schema() {
  const { typeGraph } = useGraphQLSchema();
  const ns = typeGraph.globalNamespace;

  const scalars = [...ns.scalars.values()];
  const enums = [...ns.enums.values()];
  const unions = [...ns.unions.values()];
  const models = [...ns.models.values()];
  const operations = [...ns.operations.values()];

  // Classify operations by kind, models by decorator state
  // Render each group with appropriate component
}
```

## Test Strategy

| Layer | Test location | Asserts on |
|-------|--------------|------------|
| Mutations | `test/mutation-engine/` | Type structure, names, decorator state |
| Components | `test/components/` | Rendered SDL from single component |
| Integration | `test/e2e.test.ts` | Full schema output |
| Manual validation | `test/e2e-manual/` | SDL files for visual inspection |

Tests belong where the invariant is established. A mutation bug is tested in the mutation layer, not by asserting on SDL output.
