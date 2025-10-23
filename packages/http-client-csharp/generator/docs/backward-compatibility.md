# Backward Compatibility Support

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Supported Scenarios](#supported-scenarios)
  - [Model Factory Methods](#model-factory-methods)
  - [Model Properties](#model-properties)
  - [API Version Enum](#api-version-enum)
- [Technical Implementation](#technical-implementation)
- [Best Practices](#best-practices)

## Overview

The TypeSpec C# generator supports backward compatibility (back-compat) to ensure that existing client code continues to work when the service API evolves. This is achieved by comparing the current generated code against a previous contract (assembly) and automatically generating compatibility shims where needed.

The backward compatibility system uses the `LastContractView` mechanism to access information about previously generated types, methods, and properties from the last released version of the library.

## How It Works

When generating code, the generator can optionally receive a compiled assembly from the previous version of the library (the "last contract"). The generator:

1. Analyzes the current TypeSpec specification and generates types based on the current API
2. Compares the generated types against the types in the last contract
3. Automatically generates compatibility methods, properties, or enum members where differences are detected
4. Marks compatibility members with `[EditorBrowsable(EditorBrowsableState.Never)]` to hide them from IntelliSense while keeping them available for existing code

## Supported Scenarios

### Model Factory Methods

Model factory methods are public static methods that enable creating model instances for mocking and testing purposes. The generator maintains backward compatibility for these methods across API changes.

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

#### Scenario 3: Model Factory Method Renamed

**Description:** When a model or factory method is renamed, the generator creates a compatibility method with the old name that instantiates the new model type.

**Example:**

Previous version:
```csharp
public static PublicModel1 PublicModel1OldName(string stringProp = default)
```

Current version:
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
public static PublicModel1 PublicModel1OldName(string stringProp)
{
    return new PublicModel1(stringProp, default, default, default);
}
```

**Key Points:**
- The old method name is preserved
- The method creates an instance of the new model type
- Missing parameters are filled with default values

### Model Properties

The generator maintains backward compatibility for model property types, particularly for collection types.

#### Scenario: Collection Property Type Changed

**Description:** When a property type changes from a read-only collection to a read-write collection (or vice versa), the generator preserves the previous property type to avoid breaking changes.

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

## Technical Implementation

### LastContractView Property

The `LastContractView` property is available on `TypeProvider` and provides access to the type definition from the previous contract:

```csharp
public TypeProvider? LastContractView { get; }
```

**Key Members Accessed:**
- `LastContractView.Methods` - Previous method signatures (used in ModelFactoryProvider)
- `LastContractView.Properties` - Previous property definitions (used in ModelProvider)
- `LastContractView.Fields` - Previous field definitions (used in ApiVersionEnumProvider)

### Implementation Locations

1. **ModelFactoryProvider.cs**
   - Method: `BuildMethodsForBackCompatibility()`
   - Compares current and previous factory method signatures
   - Generates compatibility methods for missing overloads
   - Location: `/src/Providers/ModelFactoryProvider.cs` (lines 112-186)

2. **ModelProvider.cs**
   - Method: `BuildProperties()`
   - Compares property types using `LastContractPropertiesMap`
   - Preserves previous collection types when changed
   - Location: `/src/Providers/ModelProvider.cs` (lines 446-456)

3. **ApiVersionEnumProvider.cs**
   - Method: `BuildApiVersionEnumValuesForBackwardCompatibility()`
   - Preserves enum members from previous versions
   - Re-indexes values to maintain sequential ordering
   - Location: `/src/Providers/ApiVersionEnumProvider.cs` (lines 98-145)

### SourceInputModel

The `SourceInputModel` class provides the mechanism to query types from the last contract:

```csharp
public TypeProvider? FindForTypeInLastContract(
    string ns, 
    string name, 
    string? declaringTypeName = null)
```

This method searches the compiled last contract assembly for type symbols matching the specified namespace and name.

## Best Practices

### When Using Backward Compatibility

1. **Always provide the last contract assembly** when generating code for a new version of your library to ensure backward compatibility is maintained.

2. **Review compatibility methods** generated by the system to ensure they behave as expected. Check the generated code for methods marked with `[EditorBrowsable(EditorBrowsableState.Never)]`.

3. **Test with existing code** that uses previous API versions to validate that compatibility is maintained.

4. **Monitor diagnostics** - The generator logs informational messages when it makes changes for backward compatibility:
   - `"Changed property {Name}.{PropertyName} type to {Type} to match last contract."`
   - `"Unable to create a backward compatible model factory method for {MethodName}."`

### Limitations

1. **Structural Changes:** Major structural changes (e.g., changing from class to struct) cannot be automatically handled and may require manual intervention.

2. **Breaking Changes:** Some changes are inherently breaking and cannot be automatically mitigated:
   - Changing method return types
   - Removing public types
   - Changing property types to incompatible types (non-collection changes)

3. **Internal Types:** Backward compatibility only applies to public types and members. Internal types are excluded from compatibility processing.

4. **Custom Code:** If you have customized a type or method, the backward compatibility system may not be able to generate appropriate compatibility shims. Manual adjustments may be needed.

### Testing

The generator includes comprehensive tests for backward compatibility scenarios:

- **Test Location:** `/test/Providers/ModelFactories/ModelFactoryProviderTests.cs`
- **Test Methods:**
  - `BackCompatibility_NewModelPropertyAdded` - Tests factory methods when properties are added
  - `BackCompatibility_OnlyParamOrderingChanged` - Tests parameter ordering preservation
  - `BackCompatibility_NoCurrentOverloadFound` - Tests renamed method handling

Run these tests to validate backward compatibility behavior:
```bash
# From the generator root directory
dotnet test --filter "FullyQualifiedName~ModelFactoryProviderTests.BackCompatibility"
```
