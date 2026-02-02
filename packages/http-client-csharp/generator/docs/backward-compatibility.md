# Backward Compatibility Support

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Supported Scenarios](#supported-scenarios)
  - [Model Factory Methods](#model-factory-methods)
  - [Model Properties](#model-properties)
  - [AdditionalProperties Type Preservation](#additionalproperties-type-preservation)
  - [API Version Enum](#api-version-enum)
  - [Non-abstract Base Models](#non-abstract-base-models)
  - [Model Constructors](#model-constructors)

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

#### Scenario: New Model Property Added

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

#### Scenario: Parameter Ordering Changed

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

### AdditionalProperties Type Preservation

The generator maintains backward compatibility for the `AdditionalProperties` property type on models that extend or use `Record<unknown>`.

#### Scenario: AdditionalProperties Type Changed from Object to BinaryData

**Description:** When a model with additional properties was previously generated with `IDictionary<string, object>`, but the current generator would produce `IDictionary<string, BinaryData>`, the generator preserves the previous `object` type to maintain backward compatibility.

This commonly occurs when:

- Migrating from an older generator version that used `object` for unknown additional property values
- Regenerating a library that was originally created with `IDictionary<string, object>` for `Record<unknown>` types

**Example:**

Previous version generated with object type:

```csharp
public partial class MyModel
{
    private readonly IDictionary<string, object> _additionalBinaryDataProperties;

    public MyModel(string name, IDictionary<string, object> additionalProperties)
    {
        Name = name;
        _additionalBinaryDataProperties = additionalProperties;
    }

    public string Name { get; set; }
    public IDictionary<string, object> AdditionalProperties { get; }
}
```

Current TypeSpec would generate with BinaryData:

```csharp
public partial class MyModel
{
    private readonly IDictionary<string, BinaryData> _additionalBinaryDataProperties;

    public MyModel(string name, IDictionary<string, BinaryData> additionalProperties)
    {
        Name = name;
        _additionalBinaryDataProperties = additionalProperties;
    }

    public string Name { get; set; }
    public IDictionary<string, BinaryData> AdditionalProperties { get; }
}
```

**Generated Compatibility Result:**

When the last contract had `IDictionary<string, object>`, the generator preserves the object type:

```csharp
public partial class MyModel
{
    private readonly IDictionary<string, object> _additionalBinaryDataProperties;

    public MyModel(string name, IDictionary<string, object> additionalProperties)
    {
        Name = name;
        _additionalBinaryDataProperties = additionalProperties;
    }

    public string Name { get; set; }
    public IDictionary<string, object> AdditionalProperties { get; }
}
```

**Key Points:**

- Applies to models with `AdditionalProperties` defined via `Record<unknown>` or similar patterns
- The backing field type is changed from `IDictionary<string, BinaryData>` to `IDictionary<string, object>`
- The property type matches the backing field type to avoid compilation errors
- Serialization and deserialization automatically handle both `object` and `BinaryData` types
- For object types, deserialization uses `JsonElement.GetObject()` instead of wrapping in `BinaryData`
- For object types, serialization uses `Utf8JsonWriter.WriteObjectValue<object>()` to handle arbitrary values
- Binary compatibility is fully maintained - existing client code continues to work without recompilation

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

### Non-abstract Base Models

#### Scenario: The previous version of a base model was defined as non-abstract.

**Description:** This can occur if the library was generated using a different generator that supported non-abstract base models. In such cases, the generator preserves the non-abstract nature of the base model to maintain compatibility.

**Example:**

Previous version generated using a different generator:

```csharp
public class BaseModel
{
    public string CommonProperty { get; set; }
}
```

Current TypeSpec would generate:

```csharp
public class BaseModel
{
    public string CommonProperty { get; set; }
}
```

### Model Constructors

The generator maintains backward compatibility for model constructors on abstract base types to prevent breaking changes when constructor accessibility changes.

#### Scenario: Public Constructor on Abstract Base Type

**Description:** When an abstract base type had a public constructor in the previous version, but the current TypeSpec generation would create a `private protected` constructor, the generator automatically changes the modifier to `public` to maintain backward compatibility.

This commonly occurs when:

- Migrating from autorest-generated code to TypeSpec-generated code
- Abstract base types with discriminators had public parameterless constructors in previous versions

**Example:**

Previous version had a public parameterless constructor:

```csharp
public abstract partial class SearchIndexerDataIdentity
{
    /// <summary> Initializes a new instance of SearchIndexerDataIdentity. </summary>
    public SearchIndexerDataIdentity()
    {
    }
}
```

Current TypeSpec would generate a private protected constructor:

```csharp
public abstract partial class SearchIndexerDataIdentity
{
    /// <summary> Initializes a new instance of SearchIndexerDataIdentity. </summary>
    /// <param name="odataType"> A URI fragment specifying the type of identity. </param>
    private protected SearchIndexerDataIdentity(string odataType)
    {
        OdataType = odataType;
    }
}
```

**Generated Compatibility Result:**

When a matching public constructor exists in the last contract, the modifier is changed from `private protected` to `public`:

```csharp
public abstract partial class SearchIndexerDataIdentity
{
    /// <summary> Initializes a new instance of SearchIndexerDataIdentity. </summary>
    /// <param name="odataType"> A URI fragment specifying the type of identity. </param>
    public SearchIndexerDataIdentity(string odataType)
    {
        OdataType = odataType;
    }
}
```

**Key Points:**

- Only applies to abstract base types
- The constructor must have matching parameters (same count, types, and names)
- The modifier is changed from `private protected` to `public`
- No additional constructors are generated; only the accessibility is adjusted
