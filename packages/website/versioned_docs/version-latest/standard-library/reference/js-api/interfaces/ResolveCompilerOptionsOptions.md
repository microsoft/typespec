---
jsApi: true
title: "[I] ResolveCompilerOptionsOptions"

---
## Extends

- `ConfigToOptionsOptions`

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `args?` | `Record`<`string`, `string`\> | Any arguments to interpolate the config. | ConfigToOptionsOptions.args |
| `configPath?` | `string` | Explicit config path. | - |
| `cwd` | `string` | Current working directory. This will be used to interpolate `{cwd}` in the config. | ConfigToOptionsOptions.cwd |
| `entrypoint` | `string` | Absolute entrypoint path | - |
| `env?` | `Record`<`string`, `undefined` \| `string`\> | Environment variables. | ConfigToOptionsOptions.env |
| `overrides?` | `Partial`<`TypeSpecConfig`\> | Compiler options to override the config | ConfigToOptionsOptions.overrides |
