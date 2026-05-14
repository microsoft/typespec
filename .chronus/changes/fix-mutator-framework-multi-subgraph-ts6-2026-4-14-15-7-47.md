---
changeKind: feature
packages:
  - "@typespec/mutator-framework"
---

Add multi-subgraph support to `ModelPropertyMutation` with a new `buildTypeEdges()` override point, an optional `typeOverride` parameter on `mutate()`, and a new `TypeEdgeSpec` interface. Also fixes TypeScript 6 type cast compatibility.

```ts
// Override buildTypeEdges() to wire independent type edges per subgraph
class MyPropertyMutation extends ModelPropertyMutation<...> {
  protected buildTypeEdges(): TypeEdgeSpec[] {
    return [
      { referenceToFollow: this.sourceType, halfEdge: this.subgraphAEdge() },
      { typeToFollow: myExplicitType, halfEdge: this.subgraphBEdge() },
    ];
  }
}
```
