# Using @typespec/http-client-csharp as a Downstream Emitter

This guide explains how to use `@typespec/http-client-csharp` as a library in your own TypeSpec emitter to generate C# HTTP client code with custom modifications.

## Overview

The `@typespec/http-client-csharp` emitter provides exported APIs that follow TypeSpec best practices for diagnostic collection. This allows downstream emitters to:

1. Generate C# HTTP client code programmatically
2. Customize the code model before code generation
3. Collect and handle diagnostics properly
4. Compose multiple emitters together

## Installation

```bash
npm install @typespec/http-client-csharp
```

## Basic Usage

### Simple Emission

The simplest way to use the emitter is to call `$emitCodeModel` directly:

```typescript
import { $emitCodeModel } from "@typespec/http-client-csharp";
import { EmitContext } from "@typespec/compiler";

export async function $onEmit(context: EmitContext) {
  // Emit C# code and collect diagnostics
  const [, diagnostics] = await $emitCodeModel(context);
  
  // Report diagnostics to the TypeSpec program
  context.program.reportDiagnostics(diagnostics);
}
```

### Custom Code Model Transformation

You can provide a callback to modify the code model before code generation:

```typescript
import { $emitCodeModel, CodeModel, CSharpEmitterContext } from "@typespec/http-client-csharp";
import { EmitContext } from "@typespec/compiler";

export async function $onEmit(context: EmitContext) {
  // Define a function to customize the code model
  const updateCodeModel = (
    model: CodeModel,
    sdkContext: CSharpEmitterContext
  ): CodeModel => {
    // Modify the code model
    // For example: add custom properties, change naming conventions, etc.
    
    // Customize client names
    for (const client of model.clients) {
      client.name = `Custom${client.name}`;
    }
    
    // Customize model names
    for (const modelType of model.models) {
      modelType.name = `Generated${modelType.name}`;
    }
    
    return model;
  };
  
  // Emit with custom transformation
  const [, diagnostics] = await $emitCodeModel(context, updateCodeModel);
  context.program.reportDiagnostics(diagnostics);
}
```

## Advanced Usage

### Generating Code Model Only

If you only need the code model without performing the full emission:

```typescript
import { createModel, createCSharpEmitterContext } from "@typespec/http-client-csharp";
import { createSdkContext } from "@azure-tools/typespec-client-generator-core";
import { EmitContext } from "@typespec/compiler";

export async function $onEmit(context: EmitContext) {
  // Create SDK context
  const tcgcContext = await createSdkContext(
    context,
    "@typespec/http-client-csharp"
  );
  
  // Create C# emitter context
  const sdkContext = createCSharpEmitterContext(tcgcContext, logger);
  
  // Generate the code model
  const [codeModel, diagnostics] = createModel(sdkContext);
  
  // Use the code model for your purposes
  console.log(`Generated ${codeModel.clients.length} clients`);
  console.log(`Generated ${codeModel.models.length} models`);
  
  // Report diagnostics
  context.program.reportDiagnostics(diagnostics);
}
```

## Code Model Structure

The `CodeModel` interface contains the following key properties:

```typescript
interface CodeModel {
  // Namespace name for the generated code
  name: string;
  
  // API versions supported
  apiVersions: string[];
  
  // Enum types
  enums: InputEnumType[];
  
  // Constant values
  constants: InputConstant[];
  
  // Model types (classes/structs)
  models: InputModelType[];
  
  // HTTP clients
  clients: InputClient[];
  
  // Authentication configuration
  auth?: InputAuth;
}
```

### Customization Examples

#### Example 1: Adding Custom Metadata

```typescript
const updateCodeModel = (model: CodeModel, context: CSharpEmitterContext): CodeModel => {
  // Add version information to all models
  for (const modelType of model.models) {
    // Access model properties and customize
    modelType.description = `${modelType.description}\n\nGenerated for API version: ${model.apiVersions[0]}`;
  }
  
  return model;
};
```

#### Example 2: Filtering Clients

```typescript
const updateCodeModel = (model: CodeModel, context: CSharpEmitterContext): CodeModel => {
  // Only keep clients with specific names
  model.clients = model.clients.filter(client => 
    client.name.startsWith("Public")
  );
  
  return model;
};
```

#### Example 3: Custom Authentication

```typescript
const updateCodeModel = (model: CodeModel, context: CSharpEmitterContext): CodeModel => {
  // Customize authentication configuration
  if (model.auth) {
    // Modify auth settings
    if (model.auth.apiKey) {
      model.auth.apiKey.name = "X-Custom-API-Key";
    }
  }
  
  return model;
};
```

## Diagnostic Handling

The emitter follows TypeSpec best practices for diagnostic collection:

### Diagnostic Collection Pattern

All functions that return diagnostics follow the pattern: `[Result, readonly Diagnostic[]]`

```typescript
import { createModel } from "@typespec/http-client-csharp";

// createModel returns a tuple: [CodeModel, readonly Diagnostic[]]
const [codeModel, diagnostics] = createModel(sdkContext);

// Check for errors
const hasErrors = diagnostics.some(d => d.severity === "error");
if (hasErrors) {
  console.error("Code model generation failed with errors");
}

// Report all diagnostics to TypeSpec
context.program.reportDiagnostics(diagnostics);
```

### Custom Diagnostic Handling

You can filter or transform diagnostics before reporting:

```typescript
const [, diagnostics] = await $emitCodeModel(context, updateCodeModel);

// Filter out warnings
const errorsOnly = diagnostics.filter(d => d.severity === "error");

// Add custom context to diagnostics
const customDiagnostics = diagnostics.map(d => ({
  ...d,
  message: `[CustomEmitter] ${d.message}`
}));

// Report filtered/transformed diagnostics
context.program.reportDiagnostics(customDiagnostics);
```

## Emitter Options

When using `$emitCodeModel`, you can configure options through the `EmitContext`:

```typescript
export async function $onEmit(context: EmitContext<MyEmitterOptions>) {
  // Access options from context
  const options = context.options;
  
  // Options will be passed through to the C# emitter
  // including: package-name, api-version, generate-protocol-methods, etc.
  
  const [, diagnostics] = await $emitCodeModel(context, updateCodeModel);
  context.program.reportDiagnostics(diagnostics);
}
```

## Complete Example: Custom Emitter Package

Here's a complete example of a custom emitter package:

**package.json:**
```json
{
  "name": "my-custom-csharp-emitter",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "dependencies": {
    "@typespec/http-client-csharp": "^1.0.0",
    "@typespec/compiler": "^0.60.0"
  }
}
```

**src/index.ts:**
```typescript
import { $emitCodeModel, CodeModel, CSharpEmitterContext } from "@typespec/http-client-csharp";
import { EmitContext } from "@typespec/compiler";

export interface MyEmitterOptions {
  // Your custom options
  customPrefix?: string;
  includeVersion?: boolean;
}

export async function $onEmit(context: EmitContext<MyEmitterOptions>) {
  const customPrefix = context.options.customPrefix ?? "Generated";
  const includeVersion = context.options.includeVersion ?? true;
  
  const updateCodeModel = (
    model: CodeModel,
    sdkContext: CSharpEmitterContext
  ): CodeModel => {
    // Apply custom transformations
    for (const client of model.clients) {
      client.name = `${customPrefix}${client.name}`;
    }
    
    if (includeVersion && model.apiVersions.length > 0) {
      for (const modelType of model.models) {
        modelType.description = `${modelType.description || ""}\n\nAPI Version: ${model.apiVersions[0]}`;
      }
    }
    
    return model;
  };
  
  // Emit with customizations
  const [, diagnostics] = await $emitCodeModel(context, updateCodeModel);
  
  // Report diagnostics
  context.program.reportDiagnostics(diagnostics);
}
```

**TypeSpec project using the custom emitter:**

```yaml
# tspconfig.yaml
emit:
  - "my-custom-csharp-emitter"
options:
  my-custom-csharp-emitter:
    customPrefix: "Contoso"
    includeVersion: true
```

## Best Practices

1. **Always handle diagnostics**: Report all diagnostics from the emitter to ensure users see errors and warnings.

2. **Preserve immutability**: When modifying the code model, avoid mutating nested objects directly. Create new objects when needed.

3. **Validate transformations**: Check that your code model transformations produce valid output.

4. **Document customizations**: Clearly document what customizations your emitter applies.

5. **Test thoroughly**: Test your emitter with various TypeSpec specifications to ensure robustness.

6. **Follow TypeSpec patterns**: Use `createDiagnosticCollector()` and the tuple return pattern in your own functions that generate diagnostics.

## API Reference

### Exported Functions

- **`$emitCodeModel(context, updateCodeModel?)`**: Main emission function
  - Returns: `Promise<[void, readonly Diagnostic[]]>`
  - Parameters:
    - `context: EmitContext<CSharpEmitterOptions>` - The emit context
    - `updateCodeModel?: (model: CodeModel, context: CSharpEmitterContext) => CodeModel` - Optional callback to modify code model

- **`createModel(sdkContext)`**: Generate code model only
  - Returns: `[CodeModel, readonly Diagnostic[]]`
  - Parameters:
    - `sdkContext: CSharpEmitterContext` - The C# emitter context

### Exported Types

- `CodeModel` - The code model interface
- `CSharpEmitterContext` - The emitter context interface
- `CSharpEmitterOptions` - Configuration options interface
- `InputClient` - HTTP client interface
- `InputModelType` - Model type interface

## Support and Resources

- [Main README](../../readme.md)
- [Customization Guide](./customization.md)
- [TypeSpec Documentation](https://typespec.io/)
- [Report Issues](https://github.com/microsoft/typespec/issues)

## Migration Guide

If you were previously using internal APIs or patterns, here's how to migrate:

### Before (accessing internal APIs):
```typescript
// ❌ Don't use internal implementation details
import { createModel } from "@typespec/http-client-csharp/lib/client-model-builder";
```

### After (using exported APIs):
```typescript
// ✅ Use public exported APIs
import { $emitCodeModel, createModel } from "@typespec/http-client-csharp";
```

## Troubleshooting

### Issue: Diagnostics not appearing

**Solution**: Make sure you're calling `context.program.reportDiagnostics(diagnostics)` with the diagnostics returned from `$emitCodeModel`.

### Issue: Code model is empty

**Solution**: Check that your TypeSpec specification is valid and that you've properly configured the SDK context options.

### Issue: Generated code has errors

**Solution**: Validate your code model transformations. The C# generator expects specific structures - avoid breaking required properties.

### Issue: TypeScript compilation errors

**Solution**: Ensure you have the correct type definitions installed and are using compatible versions of `@typespec/compiler` and `@typespec/http-client-csharp`.
