---
jsApi: true
title: "[I] ResolveModuleOptions"

---
## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| `baseDir` | `public` | `string` | - |
| `conditions?` | `readonly` | `string`[] | List of conditions to match in package exports |
| `directoryIndexFiles?` | `public` | `string`[] | When resolution reach a directory without package.json look for those files to load in order. **Default** `["index.mjs", "index.js"]` |
| `fallbackOnMissingCondition?` | `readonly` | `boolean` | If exports is defined ignore if the none of the given condition is found and fallback to using main field resolution. By default it will throw an error. |
| `resolveMain?` | `public` | (`pkg`: `any`) => `string` | When resolution reach package.json returns the path to the file relative to it. **Default** `pkg.main` |
