---
jsApi: true
title: "[E] NodeFlags"

---
## Enumeration Members

| Enumeration Member | Value | Description |
| :------ | :------ | :------ |
| `DescendantErrorsExamined` | `1` | <p>If this is set, the DescendantHasError bit can be trusted. If this not set, children need to be visited still to see if DescendantHasError should be set.</p><p>Use the parser's `hasParseError` API instead of using this flag directly.</p> |
| `DescendantHasError` | `4` | <p>Indicates that a child of this node (or one of its children, transitively) has a parse error.</p><p>Use the parser's `hasParseError` API instead of using this flag directly.</p> |
| `None` | `0` | - |
| `Synthetic` | `8` | Indicates that a node was created synthetically and therefore may not be parented. |
| `ThisNodeHasError` | `2` | <p>Indicates that a parse error was associated with this specific node.</p><p>Use the parser's `hasParseError` API instead of using this flag directly.</p> |
