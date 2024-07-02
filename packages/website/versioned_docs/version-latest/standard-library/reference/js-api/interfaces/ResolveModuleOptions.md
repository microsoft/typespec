---
jsApi: true
title: "[I] ResolveModuleOptions"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `baseDir` | `string` | - |
| `directoryIndexFiles?` | `string`[] | <p>When resolution reach a directory without package.json look for those files to load in order.</p><p>**Default**</p><code>["index.mjs", "index.js"]</code> |
| `resolveMain?` | (`pkg`: `any`) => `string` | <p>When resolution reach package.json returns the path to the file relative to it.</p><p>**Default**</p><code>pkg.main</code> |
