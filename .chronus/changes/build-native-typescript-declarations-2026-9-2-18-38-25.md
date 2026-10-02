---
changeKind: internal
packages:
  - "@typespec/tspd"
  - "@typespec/astro-utils"
  - "@typespec/website"
---

Use TypeScript 7 for workspace compilation while keeping TypeScript 6 private to TypeDoc and Astro's checker, which still require the JavaScript compiler API.