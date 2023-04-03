---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## Versioning

### `@versioned` {#@Versioning.versioned}

Identifies that the decorated namespace is versioned by the provided enum.

```typespec
dec Versioning.versioned(target: Namespace, versions: Enum)
```

#### Target

`Namespace`

#### Parameters

| Name     | Type   | Description |
| -------- | ------ | ----------- |
| versions | `Enum` |             |

### `@useDependency` {#@Versioning.useDependency}

Identifies that a namespace or a given versioning enum member relies upon a versioned package.

```typespec
dec Versioning.useDependency(target: EnumMember | Namespace, ...versionRecords: Array)
```

#### Target

`union EnumMember | Namespace`

#### Parameters

| Name           | Type          | Description |
| -------------- | ------------- | ----------- |
| versionRecords | `model Array` |             |

### `@added` {#@Versioning.added}

Identifies when the target was added.

```typespec
dec Versioning.added(target: unknown, version: EnumMember)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type         | Description |
| ------- | ------------ | ----------- |
| version | `EnumMember` |             |

### `@removed` {#@Versioning.removed}

Identifies when the target was removed.

```typespec
dec Versioning.removed(target: unknown, version: EnumMember)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type         | Description |
| ------- | ------------ | ----------- |
| version | `EnumMember` |             |

### `@renamedFrom` {#@Versioning.renamedFrom}

Identifies when the target has been renamed.

```typespec
dec Versioning.renamedFrom(target: unknown, version: EnumMember, oldName: string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type            | Description |
| ------- | --------------- | ----------- |
| version | `EnumMember`    |             |
| oldName | `scalar string` |             |

### `@madeOptional` {#@Versioning.madeOptional}

Identifies when a target was made optional.

```typespec
dec Versioning.madeOptional(target: unknown, version: EnumMember)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type         | Description |
| ------- | ------------ | ----------- |
| version | `EnumMember` |             |

### `@typeChangedFrom` {#@Versioning.typeChangedFrom}

Identifies when the target type changed.

```typespec
dec Versioning.typeChangedFrom(target: unknown, version: EnumMember, oldType: unknown)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type                  | Description |
| ------- | --------------------- | ----------- |
| version | `EnumMember`          |             |
| oldType | `(intrinsic) unknown` |             |
