---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add warning when `@list` is used with no paging navigation information. Operations decorated with `@list` now require at least one of `@nextLink`, `@pageIndex`, or `@continuationToken`.

```typespec
// This will now emit a warning: no paging navigation information
@list op list(): {
  @pageItems items: string[];
};

// Correct: has nextLink
@list op list(): {
  @pageItems items: string[];
  @nextLink next: string;
};
```
