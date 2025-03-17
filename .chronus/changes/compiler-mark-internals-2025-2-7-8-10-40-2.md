---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Move AST related APIS to `@typespec/compiler/ast` package. This is to mark a clear separation for the AST types and APIs which are considered for advanced usage and might change at any time.
  - All `*Node` types
  - `exprIsBareIdentifier`
  - `getFirstAncestor`
  - `getIdentifierContext`
  - `getNodeAtPosition`
  - `getNodeAtPositionDetail`
  - `hasParseError`
  - `isImportStatement`
  - `parse`
  - `parseStandaloneTypeReference`
  - `positionInRange`
  - `visitChildren`
