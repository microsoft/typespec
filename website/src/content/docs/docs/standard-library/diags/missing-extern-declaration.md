---
title: missing-extern-declaration
---

A function implementation is exported via `$functions` in a JS file but has no corresponding `extern fn` declaration in TypeSpec. Without the declaration, the function is silently ignored at runtime.

#### ❌ Incorrect

```js
// my-lib.js
export const $functions = { myFunction: (...args) => {} };
```

```tsp
// my-lib.tsp
// Missing: extern fn myFunction(): void;
```

#### ✅ Correct

```js
// my-lib.js
export const $functions = { myFunction: (...args) => {} };
```

```tsp
// my-lib.tsp
extern fn myFunction(): void;
```
