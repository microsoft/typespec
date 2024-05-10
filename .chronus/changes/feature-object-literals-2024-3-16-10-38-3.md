---
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Decorator API: Legacy marshalling logic

With the introduction of values, the decorator marshalling behavior has changed in some cases. This behavior is opt-in by setting the `valueMarshalling` package flag to `"new"`, but will be the default behavior in future versions. It is strongly recommended to adopt this new behavior as soon as possible.


  Example: 
  ```tsp
  extern dec multipleOf(target: numeric | Reflection.ModelProperty, value: valueof numeric);
  ```
  Will now emit a deprecated warning because `value` is of type `valueof string` which would marshall to `Numeric` under the new logic but as `number` previously.

  To opt-in you can add the following to your library js/ts files.
  ```ts
  export const $flags = definePackageFlags({
    decoratorArgMarshalling: "new",
  });
  ```
