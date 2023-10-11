---
jsApi: true
title: "[V] directorySeparator"

---
```ts
const directorySeparator: "/" = "/";
```

Internally, we represent paths as strings with '/' as the directory separator.
When we make system calls (eg: LanguageServiceHost.getDirectory()),
we expect the host to correctly handle paths in our specified format.
