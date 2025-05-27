# Customizing the generated code

The C# code generator supports various ways to customize the generated code. This section covers the common customization techniques you can use to adapt the generated code to your specific needs.

## Make a model internal

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

## Rename a model class

Define a class with a desired name and mark it with `[CodeGenType("OriginalName")]`.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model { }
}

// Add customized model (NewModelClassName.cs)
namespace Azure.Service.Models
{
    [CodeGenType("Model")]
    public partial class NewModelClassName { }
}

// Generated code after (Generated/Models/NewModelClassName.cs):
namespace Azure.Service.Models
{
    public partial class NewModelClassName { }
}
```

## Change a model or client namespace

Define a class with a desired namespace and mark it with `[CodeGenType("OriginalName")]`.

```csharp
// Generated code before (Generated/Models/Model.cs):
namespace Azure.Service.Models
{
    public partial class Model { }
}

// Add customized model (Model.cs)
namespace Azure.Service
{
    [CodeGenType("Model")]
    public partial class Model { }
}

// Generated code after:
namespace Azure.Service
{
    public partial class Model { }
}
```

## Make model property internal

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

## Rename a model property

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

## Change a model property type

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

## Preserve Raw Json Value of a Property

Use the approach to change a model property type to `JsonElement`.

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

## Changing member doc comment

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

## Customize serialization/deserialization methods

Changing how a property serializes or deserializes is done by `CodeGenSerialization` attribute. This attribute can be applied to a class or struct with a property name to change its serialized name, hierarchy in serialized JSON, or custom serialization/deserialization methods.

### Change the serialized name of a property

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

### Change the hierarchy of a property in the serialized JSON

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

## Renaming an enum

Redefine an enum with a new name and all the members mark it with `[CodeGenType("OriginEnumName")]`.

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
    [CodeGenType("Colors")]
    public enum WallColors
    {
        Red,
        Green,
        Blue
    }
}

// Generated code after will use the new WallColors type name
```

## Renaming an enum member

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

## Make a client internal

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

## Rename a client

Define a partial client class with a new name and mark it with `[CodeGenType("OriginalName")]`

```csharp
// Generated code before (Generated/Operations/ServiceClient.cs):
namespace Azure.Service.Operations
{
    public partial class ServiceClient {}
}

// Add customized model (TableClient.cs)
namespace Azure.Service.Operations
{
    [CodeGenType("ServiceClient")]
    public partial class TableClient { }
}

// Generated code after:
namespace Azure.Service.Operations
{
    public partial class TableClient { }
}
```

## Replace any generated member

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

## Remove any generated member

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

## Extending a model with additional constructors

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
