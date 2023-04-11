[JS Api](../index.md) / NodeFlags

# Enumeration: NodeFlags

## Table of contents

### Enumeration Members

- [DescendantErrorsExamined](NodeFlags.md#descendanterrorsexamined)
- [DescendantHasError](NodeFlags.md#descendanthaserror)
- [None](NodeFlags.md#none)
- [Synthetic](NodeFlags.md#synthetic)
- [ThisNodeHasError](NodeFlags.md#thisnodehaserror)

## Enumeration Members

### DescendantErrorsExamined

• **DescendantErrorsExamined** = ``1``

If this is set, the DescendantHasError bit can be trusted. If this not set,
children need to be visited still to see if DescendantHasError should be
set.

Use the parser's `hasParseError` API instead of using this flag directly.

___

### DescendantHasError

• **DescendantHasError** = ``4``

Indicates that a child of this node (or one of its children,
transitively) has a parse error.

Use the parser's `hasParseError` API instead of using this flag directly.

___

### None

• **None** = ``0``

___

### Synthetic

• **Synthetic** = ``8``

Indicates that a node was created synthetically and therefore may not be parented.

___

### ThisNodeHasError

• **ThisNodeHasError** = ``2``

Indicates that a parse error was associated with this specific node.

Use the parser's `hasParseError` API instead of using this flag directly.
