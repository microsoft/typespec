---
jsApi: true
title: "[I] ResolveModuleOptions"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `baseDir` | `string` | - |
| `directoryIndexFiles`? | `string`[] | When resolution reach a directory without package.json look for those files to load in order.<br /><br />**Default**<br /><br />` ["index.mjs", "index.js"] ` |
| `resolveMain`? | (`pkg`) => `string` | When resolution reach package.json returns the path to the file relative to it.<br /><br />**Default**<br /><br />` pkg.main ` |
