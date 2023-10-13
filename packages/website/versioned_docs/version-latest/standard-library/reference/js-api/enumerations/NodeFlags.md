---
jsApi: true
title: "[E] NodeFlags"

---
## Enumeration Members

| Member | Value | Description |
| :------ | :------ | :------ |
| `DescendantErrorsExamined` | `1` | If this is set, the DescendantHasError bit can be trusted. If this not set,<br />children need to be visited still to see if DescendantHasError should be<br />set.<br /><br />Use the parser's `hasParseError` API instead of using this flag directly. |
| `DescendantHasError` | `4` | Indicates that a child of this node (or one of its children,<br />transitively) has a parse error.<br /><br />Use the parser's `hasParseError` API instead of using this flag directly. |
| `None` | `0` | - |
| `Synthetic` | `8` | Indicates that a node was created synthetically and therefore may not be parented. |
| `ThisNodeHasError` | `2` | Indicates that a parse error was associated with this specific node.<br /><br />Use the parser's `hasParseError` API instead of using this flag directly. |
