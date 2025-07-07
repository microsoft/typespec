# Generator Architecture

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Generator Pipeline](#generator-pipeline)
- [Extensibility Framework](#extensibility-framework)
- [Testing Strategy](#testing-strategy)

## Architecture Overview

The TypeSpec Generator follows a layered architecture designed for extensibility and maintainability:

```
┌─────────────────────────────────────┐
│           TypeSpec Input            │  ← TypeSpec API definitions
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│    1. Emitter Processing Layer      │  ← Parse TypeSpec & create artifacts
│         (TypeSpec Emitter)          │    Generate configuration.json &
└─────────────────┬───────────────────┘    tspCodeModel.json, invoke generator
                  │
┌─────────────────▼───────────────────┐
│    2. Input Processing Layer        │  ← Parse & deserialize TypeSpec JSON
│      (InputLibrary, InputTypes)     │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  3. Code Model Generation Layer     │  ← Transform input to output model
│    (CodeModelGenerator, Factories)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│    4. Output Model Layer            │  ← Type providers & representations
│    (OutputLibrary, TypeProvider)    │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  5. Transformation Pipeline         │  ← Apply transformations & plugins
│   (LibraryVisitor, LibraryRewriter) │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   6. Code Generation Layer          │  ← Generate C# source files
│    (Writers, Providers, Snippets)   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   7. Configuration & Context        │  ← Runtime context & settings
│  (Configuration, GeneratorContext)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│        C# Client Library            │  ← Final generated client code
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│ 8. Emitter Communication Layer      │  ← JSON-RPC logging & diagnostics
│           (Emitter)                 │    back to TypeSpec compiler
└─────────────────────────────────────┘
```

## Core Components

### 1. **Emitter Processing Layer**

- **`TypeSpec Emitter`**: TypeScript-based emitter that interfaces with the TypeSpec compiler
  - Parses TypeSpec API definitions and emitter options
  - Generates `configuration.json` with generator settings and emitter options
  - Creates `tspCodeModel.json` containing the serialized TypeSpec model
  - Invokes the `Microsoft.TypeSpec.Generator.dll` with translated command-line arguments
  - Serves as the bridge between TypeSpec tooling and the C# generator

### 2. **Input Processing Layer**

- **`Microsoft.TypeSpec.Generator.Input`**: Handles deserialization of TypeSpec JSON output
- **`InputLibrary`**: Entry point for loading and accessing TypeSpec model data
- **`InputTypes`**: Strongly-typed representations of TypeSpec constructs (models, operations, etc.)

### 3. **Code Model Generation Layer**

- **`CodeModelGenerator`**: Abstract base class defining the generator contract and extensibility points
- **`ScmCodeModelGenerator`**: Concrete implementation for System.ClientModel-based generators
- **`TypeFactory`**: Factory pattern for creating output type providers from input types
- **`GeneratorContext`**: Provides configuration and runtime context

### 4. **Output Model Layer**

- **`OutputLibrary`**: Container for all generated type providers
- **`TypeProvider`**: Abstract representation of generated types (models, enums, clients)
- **`Providers/`**: Concrete implementations for different code constructs:
  - `ModelProvider`: Data models with properties and serialization
  - `EnumProvider`: Enumeration types
  - `MethodProvider`: Client methods and operations
  - `PropertyProvider`: Model properties with accessors

### 5. **Transformation Pipeline**

- **`LibraryVisitor`**: Visitor pattern for traversing and modifying the output library
- **`LibraryRewriter`**: Advanced transformation capabilities for code modification
- **Plugin System**: MEF-based extensibility for custom transformations

### 6. **Code Generation Layer**

- **`Writers/`**: Responsible for converting providers to actual C# syntax
- **`Snippets/`**: Reusable code patterns and expressions
- **`Expressions/`**: Type-safe representation of C# expressions
- **`Statements/`**: Type-safe representation of C# statements

### 7. **Configuration & Context**

- **`Configuration`**: Centralized configuration management from JSON input
- **`GeneratorContext`**: Runtime context and dependency injection container
- **`SourceInputModel`**: Integration with existing custom code via Roslyn analysis

### 8. **Emitter Communication Layer**

- **`Emitter`**: JSON-RPC based communication channel for logging and diagnostics
  - Provides structured logging (info, debug, verbose) back to TypeSpec compiler
  - Reports diagnostics and errors with proper severity levels
  - Enables real-time feedback during code generation process
  - Facilitates integration with TypeSpec tooling and IDE extensions

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


4. **Source Integration**

   - Analyze existing custom code using Roslyn
   - Merge custom implementations with generated code
   - Respect customization attributes and partial classes

5. **Visitor Pipeline**

   - Execute registered visitors in dependency order
   - Apply transformations, validations, and enhancements
   - Support for both built-in and plugin-provided visitors


6. **Code Generation**

   - Write providers to CodeFiles containing C# source code
   - Parse CodeFile content into syntax trees for Roslyn processing
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
