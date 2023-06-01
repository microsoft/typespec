[JS Api](../index.md) / ResolveModuleOptions

# Interface: ResolveModuleOptions

## Table of contents

### Properties

- [baseDir](ResolveModuleOptions.md#basedir)
- [directoryIndexFiles](ResolveModuleOptions.md#directoryindexfiles)
- [resolveMain](ResolveModuleOptions.md#resolvemain)

## Properties

### baseDir

• **baseDir**: `string`

___

### directoryIndexFiles

• `Optional` **directoryIndexFiles**: `string`[]

When resolution reach a directory without package.json look for those files to load in order.

**`Default`**

```ts
["index.mjs", "index.js"]
```

___

### resolveMain

• `Optional` **resolveMain**: (`pkg`: `any`) => `string`

#### Type declaration

▸ (`pkg`): `string`

When resolution reach package.json returns the path to the file relative to it.

**`Default`**

```ts
pkg.main
```

##### Parameters

| Name | Type |
| :------ | :------ |
| `pkg` | `any` |

##### Returns

`string`
