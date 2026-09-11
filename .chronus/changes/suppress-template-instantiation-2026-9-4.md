---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Suppress a diagnostic reported inside a template where the template was instantiated

```tsp
model Widget {
  #suppress "some-rule" "Not applicable here"
  page: Page<WidgetItem>;
}
```

Previously the `#suppress` directive was only looked up on the target and its parents, so a diagnostic coming from a template declaration could not be suppressed from the code that instantiated it.
