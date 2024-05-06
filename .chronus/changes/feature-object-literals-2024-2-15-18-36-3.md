---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: feature
packages:
  - "@typespec/compiler"
---

Values In TypeSpec [See docs](https://tspwebsitepr.z22.web.core.windows.net/prs/3022/docs/next/language-basics/values)

Object and array literals
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
