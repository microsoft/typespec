---
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Decorator API: Legacy marshalling logic

  If a library had a decorator with `valueof` one of those types `numeric`, `int64`, `uint64`, `integer`, `float`, `decimal`, `decimal128`, `null` it used to marshall those as JS `number` and `NullType` for `null`. With the introduction of values we have a new marshalling logic which will marshall those numeric types as `Numeric` and the others will remain numbers. `null` will also get marshalled as `null`.

  For now this is an opt-in behavior with a warning on decorators not opt-in having a parameter with a constraint from the list above.

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
