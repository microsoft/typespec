---
jsApi: true
title: "[T] LocationContext"

---
```ts
type LocationContext: ProjectLocationContext | CompilerLocationContext | SyntheticLocationContext | LibraryLocationContext;
```

Represent a location context in the mind of the compiler. This can be:
- the user project
- a library
- the compiler(standard library)
- virtual
