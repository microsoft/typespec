---
changeKind: feature
packages:
  - "@typespec/mutator-framework"
---

Support replacing member references with alternate types during mutation.

```ts
return engine.replaceAndMutateReference(referenceTypes[0], alternateType, options, halfEdge);
```