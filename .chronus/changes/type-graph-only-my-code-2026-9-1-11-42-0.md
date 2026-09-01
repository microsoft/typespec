---
changeKind: feature
packages:
  - "@typespec/html-program-viewer"
---

Hide the types coming from the compiler standard library and the loaded libraries from the type graph navigation tree. They can be shown again with the new toolbar button of the navigation pane, or by default with the new `defaultOnlyProjectCode` prop. Navigating to one of those types(from a link or a saved path) still shows it, with a notice that the tree does not list it.
