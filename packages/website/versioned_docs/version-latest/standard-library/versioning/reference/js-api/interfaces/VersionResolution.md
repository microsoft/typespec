[JS Api](../index.md) / VersionResolution

# Interface: VersionResolution

## Table of contents

### Properties

- [rootVersion](VersionResolution.md#rootversion)
- [versions](VersionResolution.md#versions)

## Properties

### rootVersion

• **rootVersion**: `undefined` \| [`Version`](Version.md)

Version for the root namespace. `undefined` if not versioned.

___

### versions

• **versions**: `Map`<`Namespace`, [`Version`](Version.md)\>

Resolved version for all the referenced namespaces.
