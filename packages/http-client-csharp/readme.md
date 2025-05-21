# @typespec/http-client-csharp

TypeSpec library for emitting Http Client libraries for C#.

## Install

```bash
npm install @typespec/http-client-csharp
```

## Usage

# Prerequisite

- Install [Node.js](https://nodejs.org/download/) 20 or above. (Verify by running `node --version`)
- Install [**.NET 8.0 SDK**](https://dotnet.microsoft.com/download/dotnet/8.0) for your specific platform. (or a higher version)

## Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-client-csharp
```

2. Via the config

```yaml
emit:
  - "@typespec/http-client-csharp"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@typespec/http-client-csharp"
options:
  "@typespec/http-client-csharp":
    option: value
```

## Emitter options

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@typespec/http-client-csharp`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `api-version`

**Type:** `string`

For TypeSpec files using the [`@versioned`](https://typespec.io/docs/libraries/versioning/reference/decorators/#@TypeSpec.Versioning.versioned) decorator, set this option to the version that should be used to generate against.

### `generate-protocol-methods`

**Type:** `boolean`

Set to `false` to skip generation of protocol methods. The default value is `true`.

### `generate-convenience-methods`

**Type:** `boolean`

Set to `false` to skip generation of convenience methods. The default value is `true`.

### `unreferenced-types-handling`

**Type:** `"removeOrInternalize" | "internalize" | "keepAll"`

Defines the strategy on how to handle unreferenced types. The default value is `removeOrInternalize`.

### `new-project`

**Type:** `boolean`

Set to `true` to overwrite the csproj if it already exists. The default value is `false`.

### `save-inputs`

**Type:** `boolean`

Set to `true` to save the `tspCodeModel.json` and `Configuration.json` files that are emitted and used as inputs to the generator. The default value is `false`.

### `package-name`

**Type:** `string`

Define the package name. If not specified, the first namespace defined in the TypeSpec is used as the package name.

### `debug`

**Type:** `boolean`

Set to `true` to automatically attempt to attach to a debugger when executing the C# generator. The default value is `false`.

### `logLevel`

**Type:** `"info" | "debug" | "verbose"`

Set the log level for which to collect traces. The default value is `info`.

### `disable-xml-docs`

**Type:** `boolean`

Set to `true` to disable XML documentation generation. The default value is `false`.

### `generator-name`

**Type:** `string`

The name of the generator. By default this is set to `ScmCodeModelGenerator`. Generator authors can set this to the name of a generator that inherits from `ScmCodeModelGenerator`.

### `emitter-extension-path`

**Type:** `string`

Allows emitter authors to specify the path to a custom emitter package, allowing you to extend the emitter behavior. This should be set to `import.meta.url` if you are using a custom emitter.

### `update-code-model`

**Type:** `object`

Allows emitter authors to specify a custom function to modify the generated code model before emitting. This is useful for modifying the code model before it is passed to the generator.

### `license`

**Type:** `object`

License information for the generated client code.

### `sdk-context-options`

**Type:** `object`

The SDK context options that implement the `CreateSdkContextOptions` interface from the [`@azure-tools/typespec-client-generator-core`](https://www.npmjs.com/package/@azure-tools/typespec-client-generator-core) package to be used by the CSharp emitter.

## Customizing the generated code

The C# code generator supports various ways to customize the generated code. This section covers the common customization techniques you can use to adapt the generated code to your specific needs.

### Make a model internal

Define a class with the same namespace and name as the generated model and use the desired accessibility.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model { }
}

// Add customized model (Model.cs)
namespace Azure.Service.Models
{
    internal partial class Model { }
}

// Generated code after (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    internal partial class Model { }
}
```

### Rename a model class

Define a class with a desired name and mark it with `[CodeGenModel("OriginalName")]`.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model { }
}

// Add customized model (NewModelClassName.cs)
namespace Azure.Service.Models
{
    [CodeGenModel("Model")]
    public partial class NewModelClassName { }
}

// Generated code after (Generated/Models/NewModelClassName.cs):
namespace Azure.Service.Models
{
    public partial class NewModelClassName { }
}
```

### Change a model or client namespace

Define a class with a desired namespace and mark it with `[CodeGenModel("OriginalName")]`.

The same approach works for a client, if marked with `[CodeGenClient("ClientName")]`.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model { }
}

// Add customized model (Model.cs)
namespace Azure.Service
{
    [CodeGenModel("Model")]
    public partial class Model { }
}

// Generated code after:
namespace Azure.Service
{
    public partial class Model { }
}
```

### Make model property internal

Define a class with a property matching a generated property name but with desired accessibility.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        public string Property { get; }
    }
}

// Add customized model (Model.cs)
namespace Azure.Service.Models
{
    public partial class Model
    {
        internal string Property { get; } 
    }
}

// Generated code after (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        // Original property is replaced by the customized one
    }
}
```

### Rename a model property

Define a partial class with a new property name and mark it with `[CodeGenMember("OriginalName")]` attribute.

**NOTE:** you can also change a property to a field using this mapping.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        public string Property { get; }
    }
}

// Add customized model (Model.cs)
namespace Azure.Service.Models
{
    public partial class Model
    {
        [CodeGenMember("Property")]
        public string RenamedProperty { get; } 
    }
}

// Generated code after (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        // All original Property usages would reference RenamedProperty
    }
}
```

### Change a model property type

**NOTE: This is supported for a narrow set of cases where the underlying serialized type doesn't change**

Scenarios that would work:
1. String <-> TimeSpan (both represented as string in JSON)
2. Float <-> Int (both are numbers)
3. String <-> Enums (both strings)
4. String -> Uri

Define a property with different type than the generated one.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        public string Property { get; }
    }
}

// Add customized model (Model.cs)
namespace Azure.Service.Models
{
    public partial class Model
    {
        public DateTime Property { get; }
    }
}

// Generated code after (Generated/Models/Model.Serializer.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        // Serialization code now reads and writes DateTime value instead of string  
    }
}
```

### Preserve raw Json value of a property

Use the approach to change a model property type to change property type to `JsonElement`.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        public string Property { get; }
    }
}

// Add customized model (Model.cs)
namespace Azure.Service.Models
{
    public partial class Model
    {
        public JsonElement Property { get; }
    }
}

// Generated code after (Generated/Models/Model.Serializer.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        // Serialization code now reads and writes JsonElement value instead of string  
    }
}
```

### Changing member doc comment

Redefine a member in partial class with a new doc comment.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        /// Subpar doc comment
        public string Property { get; }
    }
}

// Add customized model (Model.cs)
namespace Azure.Service.Models
{
    public partial class Model
    {
        /// Great doc comment
        public string Property { get; }
    }
}

// Generated code after (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        // Original doc comment is replaced by the customized one
    }
}
```

### Customize serialization/deserialization methods

Changing how a property serializes or deserializes is done by `CodeGenSerialization` attribute. This attribute can be applied to a class or struct with a property name to change its serialized name, hierarchy in serialized JSON, or custom serialization/deserialization methods.

#### Change the serialized name of a property

```csharp
// Generated code before (Generated/Models/Cat.cs):
namespace Azure.Service.Models
{
    public partial class Cat
    {
        public string Name { get; set; }
        public string Color { get; set; }
    }
}

// Add customized model
namespace Azure.Service.Models
{
    [CodeGenSerialization(nameof(Name), "catName")] // add the property name, and the new serialized name
    public partial class Cat
    {
    }
}

// Generated code after will use "catName" instead of "name" in JSON
```

#### Change the hierarchy of a property in the serialized JSON

```csharp
// Add customized model to move Name property under "properties.catName"
namespace Azure.Service.Models
{
    [CodeGenSerialization(nameof(Name), new string[] { "properties", "catName" })]
    public partial class Cat
    {
    }
}

// Generated code after will place the property under "properties.catName" in JSON
```

### Renaming an enum

Redefine an enum with a new name and all the members mark it with `[CodeGenModel("OriginEnumName")]`.

**NOTE: because enums can't be partial all values have to be copied**

```csharp
// Generated code before (Generated/Models/Colors.cs):
namespace Azure.Service.Models
{
    public enum Colors
    {
        Red,
        Green,
        Blue
    }
}

// Add customized model (WallColors.cs)
namespace Azure.Service.Models
{
    [CodeGenModel("Colors")]
    public enum WallColors
    {
        Red,
        Green,
        Blue
    }
}

// Generated code after will use the new WallColors type name
```

### Renaming an enum member

Redefine an enum with the same name and all the members, mark renamed member with `[CodeGenMember("OriginEnumMemberName")]`.

**NOTE: because enums can't be partial all values have to be copied but only the ones being renamed should be marked with attributes**

```csharp
// Generated code before (Generated/Models/Colors.cs):
namespace Azure.Service.Models
{
    public enum Colors
    {
        Red,
        Green,
        Blue
    }
}

// Add customized model (Colors.cs)
namespace Azure.Service.Models
{
    public enum Colors
    {
        Red,
        Green,
        [CodeGenMember("Blue")]
        SkyBlue
    }
}

// Generated code after will use the new SkyBlue member name
```

### Make a client internal

Define a class with the same namespace and name as generated client and use the desired accessibility.

```csharp
// Generated code before (Generated/Operations/ServiceClient.cs):
namespace Azure.Service.Operations
{
    public partial class ServiceClient { }
}

// Add customized model (ServiceClient.cs)
namespace Azure.Service.Operations
{
    internal partial class ServiceClient { }
}

// Generated code after (Generated/Operations/ServiceClient.cs):
namespace Azure.Service.Operations
{
    internal partial class ServiceClient { }
}
```

### Rename a client

Define a partial client class with a new name and mark it with `[CodeGenClient("OriginalName")]`

```csharp
// Generated code before (Generated/Operations/ServiceClient.cs):
namespace Azure.Service.Operations
{
    public partial class ServiceClient {}
}

// Add customized model (TableClient.cs)
namespace Azure.Service.Operations
{
    [CodeGenClient("ServiceClient")]
    public partial class TableClient { }
}

// Generated code after:
namespace Azure.Service.Operations
{
    public partial class TableClient { }
}
```

### Replace any generated member

Works for model and client properties, methods, constructors etc.

Define a partial class with member with the same name and for methods same parameters.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        public Model()
        {  
            Property = "a";
        }

        public string Property { get; set; }
    }
}

// Add customized model (Model.cs)
namespace Azure.Service.Models
{
    public partial class Model
    {
        internal Model()
        {
            Property = "b";
        }
    }
}

// Generated code after:
namespace Azure.Service.Models
{
    public partial class Model
    {
        // Original constructor is replaced by the customized one
    }
}
```

### Remove any generated member

Works for model and client properties, methods, constructors etc.

Define a partial class with `[CodeGenSuppress("NameOfMember", typeof(Parameter1Type), typeof(Parameter2Type))]` attribute.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model
    {
        public Model()
        {  
            Property = "a";
        }

        public Model(string property)
        {  
            Property = property;
        }

        public string Property { get; set; }
    }
}

// Add customized model (Model.cs)
namespace Azure.Service.Models
{
    [CodeGenSuppress("Model", typeof(string))]
    public partial class Model
    {
    }
}

// Generated code after:
namespace Azure.Service.Models
{
    public partial class Model
    {
        // Only the constructor accepting a string parameter is removed
    }
}
```

### Extending a model with additional constructors

As with most customization, you can define a partial class for models and extend them with methods and constructors.

```csharp
namespace Azure.Service.Models
{
    public partial class Model {
        public Model(int x)
        {
        }
    }
}
```
