# Generator Architecture

The TypeSpec Generator follows a layered architecture designed for extensibility and maintainability:

```
┌─────────────────────────────────────┐
│           TypeSpec Input            │  ← TypeSpec API definitions
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│         Input Processing            │  ← Parse & deserialize TypeSpec JSON
│      (InputLibrary, InputTypes)     │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Code Model Generation          │  ← Transform input to output model
│    (CodeModelGenerator, Factories)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│       Visitor Pipeline              │  ← Apply transformations & plugins
│   (LibraryVisitor, LibraryRewriter) │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Code Generation                │  ← Generate C# source files
│    (Writers, Providers, Snippets)   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        C# Client Library            │  ← Final generated client code
└─────────────────────────────────────┘
```

## Core Components

### 1. **Input Processing Layer**
- **`Microsoft.TypeSpec.Generator.Input`**: Handles deserialization of TypeSpec JSON output
- **`InputLibrary`**: Entry point for loading and accessing TypeSpec model data
- **`InputTypes`**: Strongly-typed representations of TypeSpec constructs (models, operations, etc.)

### 2. **Code Model Generation Layer**
- **`CodeModelGenerator`**: Abstract base class defining the generator contract and extensibility points
- **`ScmCodeModelGenerator`**: Concrete implementation for System.ClientModel-based generators
- **`TypeFactory`**: Factory pattern for creating output type providers from input types
- **`GeneratorContext`**: Provides configuration and runtime context

### 3. **Output Model Layer**
- **`OutputLibrary`**: Container for all generated type providers
- **`TypeProvider`**: Abstract representation of generated types (models, enums, clients)
- **`Providers/`**: Concrete implementations for different code constructs:
  - `ModelProvider`: Data models with properties and serialization
  - `EnumProvider`: Enumeration types
  - `MethodProvider`: Client methods and operations
  - `PropertyProvider`: Model properties with accessors

### 4. **Transformation Pipeline**
- **`LibraryVisitor`**: Visitor pattern for traversing and modifying the output library
- **`LibraryRewriter`**: Advanced transformation capabilities for code modification
- **Plugin System**: MEF-based extensibility for custom transformations

### 5. **Code Generation Layer**
- **`Writers/`**: Responsible for converting providers to actual C# syntax
- **`Snippets/`**: Reusable code patterns and expressions
- **`Expressions/`**: Type-safe representation of C# expressions
- **`Statements/`**: Type-safe representation of C# statements

### 6. **Configuration & Context**
- **`Configuration`**: Centralized configuration management from JSON input
- **`GeneratorContext`**: Runtime context and dependency injection container
- **`SourceInputModel`**: Integration with existing custom code via Roslyn analysis

## Generator Pipeline

The generation process follows a well-defined pipeline:

1. **Initialization**
   - Load configuration from `Configuration.json`
   - Initialize generator context and MEF composition
   - Load TypeSpec model from `tspCodeModel.json`

2. **Input Processing**
   - Deserialize TypeSpec JSON into strongly-typed input model
   - Validate and normalize input data
   - Build dependency graphs

3. **Code Model Generation**
   - Transform input types to output providers using TypeFactory
   - Apply generator-specific customizations
   - Build method signatures and type hierarchies

4. **Visitor Pipeline**
   - Execute registered visitors in dependency order
   - Apply transformations, validations, and enhancements
   - Support for both built-in and plugin-provided visitors

5. **Source Integration**
   - Analyze existing custom code using Roslyn
   - Merge custom implementations with generated code
   - Respect customization attributes and partial classes

6. **Code Generation**
   - Convert providers to C# syntax trees
   - Apply formatting and style conventions
   - Generate supporting files (model factories, serialization)

7. **Output**
   - Write generated files to target directories
   - Preserve custom code and configurations
   - Update project files and dependencies

## Extensibility Framework

The generator provides multiple extensibility points:

### **Generator Inheritance**
```csharp
[Export(typeof(CodeModelGenerator))]
public class CustomGenerator : CodeModelGenerator
{
    public override TypeFactory TypeFactory => new CustomTypeFactory();
    public override OutputLibrary OutputLibrary => new CustomOutputLibrary();
}
```

### **Custom Visitors**
```csharp
public class CustomLibraryVisitor : LibraryVisitor
{
    protected override TypeProvider? VisitModel(ModelProvider model)
    {
        // Custom model transformations
        return base.VisitModel(model);
    }
}
```

### **Plugin System**
```csharp
[Export(typeof(GeneratorPlugin))]
public class CustomPlugin : GeneratorPlugin
{
    public override void Apply(CodeModelGenerator generator)
    {
        generator.AddVisitor(new CustomVisitor());
    }
}
```

### **Type Factories**
```csharp
public class CustomTypeFactory : TypeFactory
{
    public override ModelProvider CreateModel(InputModelType inputModel)
    {
        // Custom model creation logic
        return new CustomModelProvider(inputModel);
    }
}
```

## Testing Strategy

The project employs a comprehensive testing approach:

### **Spector Tests**
- **Purpose**: Integration testing against HTTP specification test cases
- **Location**: `TestProjects/Spector/`
- **Approach**: Generates client libraries for HTTP-specs test cases and validates API surface
- **Stubbed Generation**: Minimizes repository size while maintaining API contract testing

### **Local Tests**
- **Purpose**: Unit and integration testing of generator components
- **Location**: `TestProjects/Local/`
- **Approach**: Direct testing of generator functionality with controlled inputs

### **Performance Tests**
- **Purpose**: Benchmarking generator performance and memory usage
- **Location**: Various `*.Tests.Perf` projects
- **Approach**: Measures generation time and resource consumption

### **Plugin Tests**
- **Purpose**: Validates extensibility framework and plugin system
- **Location**: `TestProjects/Plugin/`
- **Approach**: Tests custom generators and plugins