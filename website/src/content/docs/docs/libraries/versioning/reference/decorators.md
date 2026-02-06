---
title: "Decorators"
description: "Decorators exported by @typespec/versioning"
toc_min_heading_level: 2
toc_max_heading_level: 3
llmstxt: true
---

## TypeSpec.Versioning

### `@added` {#@TypeSpec.Versioning.added}

Identifies when the target was added.

```typespec
@TypeSpec.Versioning.added(version: EnumMember)
```

#### Target

`Model | ModelProperty | Operation | Enum | EnumMember | Union | UnionVariant | Scalar | Interface`

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

`ModelProperty`

#### Parameters

| Name    | Type         | Description                                       |
| ------- | ------------ | ------------------------------------------------- |
| version | `EnumMember` | The version that the target was made optional in. |

#### Examples

```tsp
model Foo {
  name: string;

  @madeOptional(Versions.v2)
  nickname?: string;
}
```

### `@madeRequired` {#@TypeSpec.Versioning.madeRequired}

Identifies when a target was made required.

```typespec
@TypeSpec.Versioning.madeRequired(version: EnumMember)
```

#### Target

`ModelProperty`

#### Parameters

| Name    | Type         | Description                                       |
| ------- | ------------ | ------------------------------------------------- |
| version | `EnumMember` | The version that the target was made required in. |

#### Examples

```tsp
model Foo {
  name: string;

  @madeRequired(Versions.v2)
  nickname: string;
}
```

### `@removed` {#@TypeSpec.Versioning.removed}

Identifies when the target was removed.

```typespec
@TypeSpec.Versioning.removed(version: EnumMember)
```

#### Target

`Model | ModelProperty | Operation | Enum | EnumMember | Union | UnionVariant | Scalar | Interface`

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

`Model | ModelProperty | Operation | Enum | EnumMember | Union | UnionVariant | Scalar | Interface`

#### Parameters

| Name    | Type             | Description                                 |
| ------- | ---------------- | ------------------------------------------- |
| version | `EnumMember`     | The version that the target was renamed in. |
| oldName | `valueof string` | The previous name of the target.            |

#### Examples

```tsp
@renamedFrom(Versions.v2, "oldName")
op newName(): void;
```

### `@returnTypeChangedFrom` {#@TypeSpec.Versioning.returnTypeChangedFrom}

Declares that the return type of an operation has changed starting at a given version,
while keeping earlier versions consistent with the previous return type.

This decorator is used to track return type changes across API versions. When applied,
the operation will return `oldType` in versions before the specified `version`,
and the current return type definition in the specified version and later.

```typespec
@TypeSpec.Versioning.returnTypeChangedFrom(version: EnumMember, oldType: unknown)
```

#### Target

`Operation`

#### Parameters

| Name    | Type         | Description                                                                                                                                                              |
| ------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| version | `EnumMember` | The version when the return type change takes effect. The new return type applies<br />from this version onwards, while the old return type applies to earlier versions. |
| oldType | `unknown`    | The previous return type used before the specified version.                                                                                                              |

#### Examples

```tsp
// In v1: returns a string
// In v2+: returns an int32
@returnTypeChangedFrom(Versions.v2, string)
op getUserId(): int32;
```

### `@typeChangedFrom` {#@TypeSpec.Versioning.typeChangedFrom}

Declares that the type of a model property has changed starting at a given version,
while keeping earlier versions consistent with the previous type.

This decorator is used to track type changes across API versions. When applied,
the property will use `oldType` in versions before the specified `version`,
and the current type definition in the specified version and later.

```typespec
@TypeSpec.Versioning.typeChangedFrom(version: EnumMember, oldType: unknown)
```

#### Target

`ModelProperty`

#### Parameters

| Name    | Type         | Description                                                                                                                                         |
| ------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| version | `EnumMember` | The version when the type change takes effect. The new type applies<br />from this version onwards, while the old type applies to earlier versions. |
| oldType | `unknown`    | The previous type used before the specified version.                                                                                                |

#### Examples

```tsp
model Foo {
  // In v1: id is a string
  // In v2+: id is an int32
  @typeChangedFrom(Versions.v2, string)
  id: int32;
}
```

### `@useDependency` {#@TypeSpec.Versioning.useDependency}

Identifies that a namespace or a given versioning enum member relies upon a versioned package.

```typespec
@TypeSpec.Versioning.useDependency(...versionRecords: EnumMember[])
```

#### Target

`EnumMember | Namespace`

#### Parameters

| Name           | Type           | Description                                                           |
| -------------- | -------------- | --------------------------------------------------------------------- |
| versionRecords | `EnumMember[]` | The dependent library version(s) for the target namespace or version. |

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
