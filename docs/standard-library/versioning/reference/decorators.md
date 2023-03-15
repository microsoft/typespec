---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## TypeSpec.Versioning

### `@versioned` {#@TypeSpec.Versioning.versioned}

Identifies that the decorated namespace is versioned by the provided enum.

```typespec
dec TypeSpec.Versioning.versioned(target: TypeSpec.Reflection.Namespace, versions: TypeSpec.Reflection.Enum)
```

#### Target

`Namespace`

#### Parameters

| Name     | Type   | Description |
| -------- | ------ | ----------- |
| versions | `Enum` |             |

### `@useDependency` {#@TypeSpec.Versioning.useDependency}

Identifies that a namespace or a given versioning enum member relies upon a versioned package.

```typespec
dec TypeSpec.Versioning.useDependency(target: TypeSpec.Reflection.EnumMember | TypeSpec.Reflection.Namespace, ...versionRecords: TypeSpec.Reflection.EnumMember[])
```

#### Target

`union TypeSpec.Reflection.EnumMember | TypeSpec.Reflection.Namespace`

#### Parameters

| Name           | Type                                     | Description |
| -------------- | ---------------------------------------- | ----------- |
| versionRecords | `model TypeSpec.Reflection.EnumMember[]` |             |

### `@versionedDependency` {#@TypeSpec.Versioning.versionedDependency}

Identifies a mapping of versions to versioned dependencies for a namespace.

```typespec
dec TypeSpec.Versioning.versionedDependency(target: TypeSpec.Reflection.Namespace, mapping: TypeSpec.Reflection.EnumMember | [TypeSpec.Reflection.EnumMember, TypeSpec.Reflection.EnumMember][])
```

#### Target

`Namespace`

#### Parameters

| Name    | Type                                                                                                         | Description |
| ------- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| mapping | `union TypeSpec.Reflection.EnumMember \| [TypeSpec.Reflection.EnumMember, TypeSpec.Reflection.EnumMember][]` |             |

### `@added` {#@TypeSpec.Versioning.added}

Identifies when the target was added.

```typespec
dec TypeSpec.Versioning.added(target: unknown, version: TypeSpec.Reflection.EnumMember)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type         | Description |
| ------- | ------------ | ----------- |
| version | `EnumMember` |             |

### `@removed` {#@TypeSpec.Versioning.removed}

Identifies when the target was removed.

```typespec
dec TypeSpec.Versioning.removed(target: unknown, version: TypeSpec.Reflection.EnumMember)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type         | Description |
| ------- | ------------ | ----------- |
| version | `EnumMember` |             |

### `@renamedFrom` {#@TypeSpec.Versioning.renamedFrom}

Identifies when the target has been renamed.

```typespec
dec TypeSpec.Versioning.renamedFrom(target: unknown, version: TypeSpec.Reflection.EnumMember, oldName: TypeSpec.string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type                     | Description |
| ------- | ------------------------ | ----------- |
| version | `EnumMember`             |             |
| oldName | `scalar TypeSpec.string` |             |

### `@madeOptional` {#@TypeSpec.Versioning.madeOptional}

Identifies when a target was made optional.

```typespec
dec TypeSpec.Versioning.madeOptional(target: unknown, version: TypeSpec.Reflection.EnumMember)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type         | Description |
| ------- | ------------ | ----------- |
| version | `EnumMember` |             |

### `@typeChangedFrom` {#@TypeSpec.Versioning.typeChangedFrom}

Identies when the target type changed.

```typespec
dec TypeSpec.Versioning.typeChangedFrom(target: unknown, version: TypeSpec.Reflection.EnumMember, oldType: unknown)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type                  | Description |
| ------- | --------------------- | ----------- |
| version | `EnumMember`          |             |
| oldType | `(intrinsic) unknown` |             |
