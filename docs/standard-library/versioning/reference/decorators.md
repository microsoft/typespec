---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## TypeSpec.Versioning

### `@added` {#@TypeSpec.Versioning.added}

Identifies when the target was added.

```typespec
@TypeSpec.Versioning.added(version: EnumMember)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type         | Description                               |
| ------- | ------------ | ----------------------------------------- |
| version | `EnumMember` | The version that the target was added in. |

### `@madeOptional` {#@TypeSpec.Versioning.madeOptional}

Identifies when a target was made optional.

```typespec
@TypeSpec.Versioning.madeOptional(version: EnumMember)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type         | Description                                       |
| ------- | ------------ | ------------------------------------------------- |
| version | `EnumMember` | The version that the target was made optional in. |

### `@removed` {#@TypeSpec.Versioning.removed}

Identifies when the target was removed.

```typespec
@TypeSpec.Versioning.removed(version: EnumMember)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type         | Description                                 |
| ------- | ------------ | ------------------------------------------- |
| version | `EnumMember` | The version that the target was removed in. |

### `@renamedFrom` {#@TypeSpec.Versioning.renamedFrom}

Identifies when the target has been renamed.

```typespec
@TypeSpec.Versioning.renamedFrom(version: EnumMember, oldName: string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type            | Description                                 |
| ------- | --------------- | ------------------------------------------- |
| version | `EnumMember`    | The version that the target was renamed in. |
| oldName | `scalar string` | The previous name of the target.            |

### `@typeChangedFrom` {#@TypeSpec.Versioning.typeChangedFrom}

Identifies when the target type changed.

```typespec
@TypeSpec.Versioning.typeChangedFrom(version: EnumMember, oldType: unknown)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type                  | Description                                  |
| ------- | --------------------- | -------------------------------------------- |
| version | `EnumMember`          | The version that the target type changed in. |
| oldType | `(intrinsic) unknown` | The previous type of the target.             |

### `@useDependency` {#@TypeSpec.Versioning.useDependency}

Identifies that a namespace or a given versioning enum member relies upon a versioned package.

```typespec
@TypeSpec.Versioning.useDependency(...versionRecords: EnumMember[])
```

#### Target

`union EnumMember | Namespace`

#### Parameters

| Name           | Type                 | Description                                                           |
| -------------- | -------------------- | --------------------------------------------------------------------- |
| versionRecords | `model EnumMember[]` | The dependent library version(s) for the target namespace or version. |

### `@versioned` {#@TypeSpec.Versioning.versioned}

Identifies that the decorated namespace is versioned by the provided enum.

```typespec
@TypeSpec.Versioning.versioned(versions: Enum)
```

#### Target

`Namespace`

#### Parameters

| Name     | Type   | Description                                     |
| -------- | ------ | ----------------------------------------------- |
| versions | `Enum` | The enum that describes the supported versions. |
