---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Serialize numeric default and example values as strings when the property or its scalar type uses `@encode(string)`, including values that come from a typed `const` and the items of arrays and tuples, also behind a nullable union. They were written as JSON numbers, and an `int64` value that a JavaScript number can't represent exactly was written as `null`. Object items of tuples, and of arrays behind a nullable union, now also use their model's encoded names and property encodings, as plain arrays already did. Property default values now keep their exact type, so an object default behind a union, such as `pet?: Pet | null = #{ name: "a" }`, keeps its properties instead of being written as `{}`. Serializing an object default or example whose type is a recursive union no longer overflows the stack.
