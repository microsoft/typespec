---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add syntax for declaring values. [See docs](https://typespec.io/docs/language-basics/values).

Object and array values
```tsp
@dummy(#{
  name: "John",
  age: 48,
  address: #{ city: "London" }
  aliases: #["Bob", "Frank"]
})
```

Scalar constructors

```tsp
scalar utcDateTime {
  init fromISO(value: string);
}

model DateRange {
  minDate: utcDateTime = utcDateTime.fromISO("2024-02-15T18:36:03Z");
}
```
