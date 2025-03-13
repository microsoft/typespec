---
title: Package Manager
---

TypeSpec uses node package linking to manage dependencies. Any package manager that produce a `node_modules` directory should work:

- npm 7+. To update npm, run `npm install -g npm`
- pnpm
- yarn

:::caution
Yarn will not automatically install implicit peerDependencies. TypeSpec libraries rely on this. Watch for warnings for any missing dependencies.
:::
