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

#### Examples

```tsp
@added(Versions.v2)
op addedInV2(): void;

@added(Versions.v2)
model AlsoAddedInV2 {}

model Foo {
  name: string;

  @added(Versions.v3)
  addedInV3: string;
}
```

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

#### Examples

```tsp
model Foo {
  name: string;

  @madeOptional(Versions.v2)
  nickname: string;
}
```

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

#### Examples

```tsp
@removed(Versions.v2)
op removedInV2(): void;

@removed(Versions.v2)
model AlsoRemovedInV2 {}

model Foo {
  name: string;

  @removed(Versions.v3)
  removedInV3: string;
}
```

### `@renamedFrom` {#@TypeSpec.Versioning.renamedFrom}

Identifies when the target has been renamed.

```typespec
@TypeSpec.Versioning.renamedFrom(version: EnumMember, oldName: valueof string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name    | Type                    | Description                                 |
| ------- | ----------------------- | ------------------------------------------- |
| version | `EnumMember`            | The version that the target was renamed in. |
| oldName | `valueof scalar string` | The previous name of the target.            |

#### Examples

```tsp
@renamedFrom(Versions.v2, "oldName")
op newName(): void;
```

### `@returnTypeChangedFrom` {#@TypeSpec.Versioning.returnTypeChangedFrom}

Identifies when the target type changed.

```typespec
@TypeSpec.Versioning.returnTypeChangedFrom(version: EnumMember, oldType: unknown)
```

#### Target

`Operation`

#### Parameters

| Name    | Type                  | Description                                  |
| ------- | --------------------- | -------------------------------------------- |
| version | `EnumMember`          | The version that the target type changed in. |
| oldType | `(intrinsic) unknown` | The previous type of the target.             |

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

#### Examples

##### Select a single version of `MyLib` to use

```tsp
@useDependency(MyLib.Versions.v1_1)
namespace NonVersionedService;
```

##### Select which version of the library match to which version of the service.

```tsp
@versioned(Versions)
namespace MyService1;
enum Version {
  @useDependency(MyLib.Versions.v1_1) // V1 use lib v1_1
  v1,
  @useDependency(MyLib.Versions.v1_1) // V2 use lib v1_1
  v2,
  @useDependency(MyLib.Versions.v2) // V3 use lib v2
  v3,
}
```

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

#### Examples

```tsp
@versioned(Versions)
namespace MyService;
enum Versions {
  v1,
  v2,
  v3,
}
```
