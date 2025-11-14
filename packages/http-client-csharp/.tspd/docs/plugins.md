# Using Plugins

The C# emitter supports a plugin system that allows you to extend and customize the generated code through transformations. Plugins are .NET libraries that implement the `GeneratorPlugin` base class and are automatically loaded during code generation.

## Adding a Plugin

To use a plugin in your TypeSpec project:

1. Add the plugin to the `plugins` section in your `package.json` file:

```json
{
  "dependencies": {
    "@typespec/http-client-csharp": "^1.0.0"
  },
  "plugins": {
    "your-plugin-name": "^1.0.0"
  }
}
```

2. Run `npm install` to install the plugin package.

3. Compile your TypeSpec project as usual with `tsp compile .`

The generator will automatically discover and load DLL files from the plugin's `dist` directory and apply them during code generation.

## Creating a Custom Plugin

To create your own plugin:

1. Create a new .NET class library project that references `Microsoft.TypeSpec.Generator`.

2. Implement the `GeneratorPlugin` base class:

```csharp
using Microsoft.TypeSpec.Generator;

public class MyCustomPlugin : GeneratorPlugin
{
    public override void Apply(CodeModelGenerator generator)
    {
        // Add custom visitors or transformations
        generator.AddVisitor(new MyCustomVisitor());
    }
}
```

3. Build your plugin and ensure the DLL is placed in a `dist` directory within your plugin package.

4. Add your plugin to the `plugins` section of your TypeSpec project's `package.json`.

For a complete example, see the [logging plugin sample](https://github.com/microsoft/typespec/tree/main/docs/samples/client/csharp/plugins/logging) in the repository.
