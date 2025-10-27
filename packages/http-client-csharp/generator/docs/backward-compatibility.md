# Backward Compatibility Support

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Supported Scenarios](#supported-scenarios)
  - [Model Factory Methods](#model-factory-methods)
  - [Model Properties](#model-properties)
  - [API Version Enum](#api-version-enum)

## Overview

The TypeSpec C# generator supports backward compatibility (back-compat) to ensure that existing client code continues to work when the service API evolves. This is achieved by comparing the current generated code against a previous contract (assembly) and automatically generating compatibility shims where needed.

The backward compatibility system uses the `LastContractView` mechanism to access information about previously generated types, methods, and properties from the last released version of the library.

## How It Works

When generating code, the generator can optionally receive a compiled assembly from the previous version of the library (the "last contract"). The generator:

1. Analyzes the current TypeSpec specification and generates types based on the current API
2. Compares the generated types against the types in the last contract
3. Automatically generates compatibility methods, properties, or enum members where differences are detected

## Supported Scenarios

### Model Factory Methods

Model factory methods are public static methods that enable creating model instances for mocking and testing purposes. The generator attempts to maintain backward compatibility for these methods across API changes.

#### Scenario 1: New Model Property Added

**Description:** When a new property is added to a model, the generator creates a backward-compatible factory method overload that excludes the new parameter.

**Example:**

Previous version had a model with three properties:

```csharp
public static PublicModel1 PublicModel1(
    string stringProp = default,
    Thing modelProp = default,
    IEnumerable<string> listProp = default)
```

Current version adds a new property (`dictProp`):

```csharp
public static PublicModel1 PublicModel1(
    string stringProp = default,
    Thing modelProp = default,
    IEnumerable<string> listProp = default,
    IDictionary<string, string> dictProp = default)
```

**Generated Compatibility Method:**

```csharp
[EditorBrowsable(EditorBrowsableState.Never)]
public static PublicModel1 PublicModel1(
    string stringProp,
    Thing modelProp,
    IEnumerable<string> listProp)
{
    return PublicModel1(stringProp, modelProp, listProp, dictProp: default);
}
```

**Key Points:**

- The old method signature is preserved
- It delegates to the new method with default value for the new parameter
- Parameters in the compatibility method have no default values to avoid ambiguous call sites
- The method is marked with `[EditorBrowsable(EditorBrowsableState.Never)]` to hide it from IntelliSense

#### Scenario 2: Parameter Ordering Changed

**Description:** When only the parameter ordering changes in a factory method (same parameters, different order), the generator replaces the current method with the previous method signature.

**Example:**

Previous version:

```csharp
public static PublicModel1 PublicModel1(
    Thing modelProp = default,
    string stringProp = default,
    IEnumerable<string> listProp = default,
    IDictionary<string, string> dictProp = default)
```

Current version would generate different ordering:

```csharp
public static PublicModel1 PublicModel1(
    string stringProp = default,
    Thing modelProp = default,
    IEnumerable<string> listProp = default,
    IDictionary<string, string> dictProp = default)
```

**Result:** The generator keeps the previous parameter ordering to maintain compatibility.

### Model Properties

The generator attempts to maintain backward compatibility for model property types, particularly for collection types.

#### Scenario: Collection Property Type Changed

**Description:** When a property type changes from a read-only collection to a read-write collection (or vice versa), the generator attempts to preserve the previous property type to avoid breaking changes.

**Example:**

Previous version:

```csharp
public IReadOnlyList<string> Items { get; }
```

Current TypeSpec would generate:

```csharp
public IList<string> Items { get; set; }
```

**Result:** The generator detects the type mismatch and preserves the previous type:

```csharp
public IReadOnlyList<string> Items { get; }
```

**Implementation Details:**

- The generator compares property types against the `LastContractView`
- For read-write lists and dictionaries, if the previous type was different, the previous type is retained
- A diagnostic message is logged: `"Changed property {ModelName}.{PropertyName} type to {LastContractType} to match last contract."`

### API Version Enum

Service version enums maintain backward compatibility by preserving version values from previous releases.

#### Scenario: API Version Removed or Changed

**Description:** When API versions are removed or changed in the TypeSpec, the generator preserves previous version enum members to prevent breaking existing code that references them.

**Example:**

Previous version had enum members:

```csharp
public enum ServiceVersion
{
    V2021_10_01 = 1,
    V2022_01_01 = 2,
    V2022_06_01 = 3,
}
```

Current TypeSpec removes `V2021_10_01` and adds `V2023_01_01`:

```csharp
public enum ServiceVersion
{
    V2022_01_01 = 1,
    V2022_06_01 = 2,
    V2023_01_01 = 3,
}
```

**Generated Result:**

```csharp
public enum ServiceVersion
{
    V2021_10_01 = 1,  // Preserved from previous version
    V2022_01_01 = 2,
    V2022_06_01 = 3,
    V2023_01_01 = 4,
}
```

**Key Points:**

- Previous enum members are preserved even if removed from TypeSpec
- Enum values are re-indexed to maintain sequential ordering
- Version format and separator are detected from current versions and applied to previous versions
