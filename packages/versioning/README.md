# `@typespec/versioning` library

This package provide [TypeSpec](https://github.com/microsoft/typespec) decorators and projections to define versioning in a service.

## Install

Run the following command in your typespec project root directory.

```bash
npm install @typespec/versioning
```

## Usage

```typespec
import "@typespec/versioning";

using Versioning;
```

### Enable versioning for Service or Library

Use [`@versioned`](#versioned) decorator to mark a namespace as versioned.

```typespec
@versioned(Versions)
namespace MyService;

enum Versions {
  v1,
  v2,
  v3,
}
```

The following decorators can then be used to provide version evolution of a service.

- [`@added`](#added)
- [`@removed`](#removed)
- [`@renamedFrom`](#renamedfrom)
- [`@madeOptional`](#madeoptional)

### Consume a versioned library

When consuming a versioned library, it is required to indicate which version of the library to use.
See [`@useDependency`](#useDependency) decorator for information about this.

## References

Decorators:

- [`@versioned`](#versioned) <!-- no toc -->
- [`@useDependency`](#usedependency)
- [`@added`](#added)
- [`@removed`](#removed)
- [`@renamedFrom`](#renamedfrom)
- [`@madeOptional`](#madeoptional)

### `@versioned`

Mark a namespace as being versioned. It takes as an argument an `enum` of versions for that namespace.

```typespec
@versioned(Versions)
namespace MyService;

enum Versions {
  v1,
  v2,
  v3,
}
```

### `@useDependency`

When using elements from another versioned namespace, the consuming namespace **MUST** specify which version of the consumed namespace to use even if the consuming namespace is not versioned itself.

The decorator can either target:

- an unversioned namespace.
- individual enum members of a versioned namespace's version enum.

If we have a library with the following definition:

```typespec
@versioned(Versions)
namespace MyLib;

enum Versions {
  v1,
  v1_1,
  v2,
}
```

Pick a specific version to be used for all version of the service.

```typespec
@versioned(Versions)
@useDependency(MyLib.Versions.v1_1)
namespace MyService1;

enum Version {
  v1,
  v2,
  v3,
}
```

Service is not versioned, pick which version of `MyLib` should be used.

```typespec
@useDependency(MyLib.Versions.v1_1)
namespace NonVersionedService;
```

Select mapping of version to use

```typespec
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

### `@added`

Specify which version an entity was added. Take the enum version member.

Version enum member **MUST** be from the version enum for the containing namespace.

```typespec
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

### `@removed`

Specify which version an entity was removed. Take the enum version member.

Version enum member **MUST** be from the version enum for the containing namespace.

```typespec
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

### `@renamedFrom`

Specify which version an entity was renamed and what is is old name.

Version enum member **MUST** be from the version enum for the containing namespace.

```typespec
@renamedFrom(Versions.v2, "oldName")
op newName(): void;
```

### `@madeOptional`

Specify which version a property was made optional

Version enum member **MUST** be from the version enum for the containing namespace.

```typespec
model Foo {
  name: string;

  @madeOptional(Versions.v2)
  nickname: string;
}
```

## Consuming versioning library from an emitter

### Get the service representation at a given version

Versioning library works with projection to project the service at a given version.

```ts
// Get a list of all the different version of the service and the projections
const projections = buildVersionProjections(program, serviceNamespace);

for (const projection of projections) {
  const projectedProgram = projectProgram(program, projection.projections);
  // projectedProgram now contains the representation of the service at the given version.
}
```

### Get list of versions and version dependency across namespaces

Versioning library works with projection to project the service at a given version.

```ts
const versions = resolveVersions(program, serviceNamespace);
// versions now contain a list of all the version of the service namespace and what version should all the other dependencies namespace use.
```

### Consume versioning manually

If the emitter needs to have the whole picture of the service evolution across the version then using the decorator accessor will provide the metadata for each type:

- `getAddedOn`
- `getRemovedOn`
- `getRenamedFromVersion`
- `getMadeOptionalOn`
