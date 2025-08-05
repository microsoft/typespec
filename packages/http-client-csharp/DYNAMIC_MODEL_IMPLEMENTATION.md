# @dynamicModel Decorator Implementation

## Overview

This implementation adds support for the `@dynamicModel` decorator in @typespec/http-client-csharp. When applied to a model, it enables AdditionalProperties-based serialization using the new System.ClientModel AdditionalProperties struct instead of the traditional `_serializedAdditionalRawData` dictionary approach.

## Usage Example

```typespec
import "@typespec/http-client-csharp";
using TypeSpec.CSharp;

@dynamicModel
model User {
  id: string;
  name: string;
  email?: string;
}

op getUser(): User;
```

## Generated C# Code Comparison

### Traditional Approach (without @dynamicModel)

```csharp
public partial class User
{
    private readonly IDictionary<string, BinaryData> _serializedAdditionalRawData;

    public User(string id, string name, string email = null, IDictionary<string, BinaryData> serializedAdditionalRawData = null)
    {
        Id = id;
        Name = name;
        Email = email;
        _serializedAdditionalRawData = serializedAdditionalRawData;
    }

    public string Id { get; }
    public string Name { get; }
    public string Email { get; }
}
```

### New Approach (with @dynamicModel)

```csharp
public partial class User
{
    public User(string id, string name, string email = null, AdditionalProperties patch = default)
    {
        Id = id;
        Name = name;
        Email = email;
        Patch = patch;
    }

    public string Id { get; }
    public string Name { get; }
    public string Email { get; }
    public AdditionalProperties Patch { get; set; }
}
```

## Implementation Status

### ✅ Completed
- TypeSpec decorator definition and registration
- Decorator processing pipeline in TypeScript emitter
- Input model type extension to track dynamic model flag
- C# model provider modifications:
  - Skip raw data field generation for dynamic models
  - Generate Patch property for dynamic models
- Comprehensive test suite

### 🚧 Pending (blocked on System.ClientModel alpha release)
- Update to System.ClientModel 1.6.0-alpha.20250804.4
- Replace object placeholder with actual AdditionalProperties type
- Implement serialization logic modifications:
  - Deserialization: Use `AdditionalProperties.Set()` for unknown properties
  - Serialization: Check patches and propagate to child objects

## Architecture

The implementation follows a clean pipeline:

1. **TypeSpec Layer**: `@dynamicModel` decorator marks models
2. **Emitter Layer**: Decorator is processed and flag is set on InputModelType
3. **Serialization Layer**: JSON carries the isDynamicModel flag to C# generator
4. **C# Generation Layer**: ModelProvider generates different code based on flag
5. **Generated Code**: Models have either raw data field or Patch property

## Testing

Comprehensive tests cover:
- Basic dynamic model functionality
- Inheritance scenarios
- Models with additional properties
- Multiple dynamic models in same specification
- Negative cases (regular models without decorator)

## Future Work

When System.ClientModel alpha becomes available:
1. Update package reference
2. Replace placeholder type with AdditionalProperties
3. Implement serialization/deserialization logic per the reference implementations
4. Add integration tests with actual serialization scenarios