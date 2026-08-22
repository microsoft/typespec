---
changeKind: feature
packages:
  - "@typespec/emitter-framework"
---

Support declaration overrides in `Experimental_ComponentOverrides`

Only `reference` overrides were dispatched, so an emitter could customize how a type is referenced but not how it is declared, forcing it to fork the framework's declaration components. The C# `ClassDeclaration`, `Property` and `EnumDeclaration` now render through the override point.

```tsx
const overrides = Experimental_ComponentOverridesConfig().forTypeKind("ModelProperty", {
  declaration: (props) =>
    props.type.name === "id" ? (
      <props.Declaration {...props.declarationProps} name="Identifier" />
    ) : (
      props.default
    ),
});
```
