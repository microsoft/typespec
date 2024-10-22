---
jsApi: true
title: "[I] PackageJson"

---
Type for package.json https://docs.npmjs.com/cli/configuring-npm/package-json

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| `bugs?` | `object` | - |
| `bugs.email?` | `string` | - |
| `bugs.url?` | `string` | - |
| `dependencies?` | `Record`<`string`, `string`\> | - |
| `description?` | `string` | Package description |
| `devDependencies?` | `Record`<`string`, `string`\> | - |
| `exports?` | `null` \| `Exports` | Subpath exports to define entry points of the package. [Read more.](https://nodejs.org/api/packages.html#subpath-exports) |
| `homepage?` | `string` | - |
| `main?` | `string` | - |
| `name` | `string` | Package name |
| `peerDependencies?` | `Record`<`string`, `string`\> | - |
| `private?` | `boolean` | - |
| `tspMain?` | `string` | - |
| `type?` | `"module"` \| `"commonjs"` | - |
| `version?` | `string` | Package version |
