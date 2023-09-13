---
jsApi: true
title: "[I] ResolveCompilerOptionsOptions"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `args`? | `Record`< `string`, `string` \> | Any arguments to interpolate the config. |
| `configPath`? | `string` | Explicit config path. |
| `cwd`? | `string` | Current working directory. This will be used to interpolate `{cwd}` in the config.<br /><br />**Default**<br /><br />to `process.cwd()` |
| `entrypoint` | `string` | Absolute entrypoint path |
| `env`? | `Record`< `string`, `undefined` \| `string` \> | Environment variables.<br /><br />**Default**<br /><br />` process.env ` |
| `overrides`? | `Partial`< `TypeSpecConfig` \> | Compiler options to override the config |
