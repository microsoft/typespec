---
title: "Generator plugins"
---

## Generator plugins

Plugins are a lightweight way to customize the C# generator without authoring a full custom generator. A plugin can register additional visitors, rewriters, metadata references, or shared source directories that participate in the normal generation pipeline. This is useful when you want to tweak the generated output (for example, rename types, add attributes, or post-process models) while still using the built-in `ScmCodeModelGenerator`.

The generator discovers plugins in two ways:

1. **Automatically**, from the `dist` folder of any package listed in your project's `node_modules`.
2. **Explicitly**, from the paths supplied via the [`plugins`](./emitter.md#plugins) emitter option.

This document focuses on the `plugins` option, which lets emitter authors point the generator at one or more plugin assemblies (or directories/projects containing them).

## Authoring a plugin

A plugin is a C# class that extends `GeneratorPlugin` and overrides `Apply`. The base class is exported via [MEF](https://learn.microsoft.com/dotnet/framework/mef/) using `[InheritedExport]`, so any subclass is discovered automatically once its assembly is loaded — you do not need to add an `[Export]` attribute yourself.

```csharp
using Microsoft.TypeSpec.Generator;

public class MyPlugin : GeneratorPlugin
{
    public override void Apply(CodeModelGenerator generator)
    {
        // Register a custom visitor that transforms the output library.
        generator.AddVisitor(new MyLibraryVisitor());
    }
}
```

The `CodeModelGenerator` passed to `Apply` exposes the extension points a plugin can use, including:

- `AddVisitor(LibraryVisitor visitor)` — add a visitor that traverses and modifies the output library.
- `AddRewriter(LibraryRewriter rewriter)` — add a rewriter to transform generated members.
- `AddMetadataReference(MetadataReference reference)` — make additional assemblies available to the generated code.
- `AddSharedSourceDirectory(string sharedSourceDirectory)` — include a directory of shared source files.

A visitor lets you hook into specific parts of the output. For example, to transform every model:

```csharp
using Microsoft.TypeSpec.Generator;
using Microsoft.TypeSpec.Generator.Providers;

public class MyLibraryVisitor : LibraryVisitor
{
    protected override TypeProvider? VisitType(TypeProvider type)
    {
        // Inspect or modify the generated type here.
        return base.VisitType(type);
    }
}
```

### Plugin project file

Build your plugin as a class library that references the generator's published NuGet package. Referencing `Microsoft.TypeSpec.Generator.ClientModel` transitively brings in `Microsoft.TypeSpec.Generator`, which contains the `GeneratorPlugin` base class. Use the package version that matches the version of `@typespec/http-client-csharp` you are generating with. A minimal `.csproj` looks like this:

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.TypeSpec.Generator.ClientModel" Version="X.Y.Z" />
  </ItemGroup>

</Project>
```

## Using the `plugins` option

Once you have a plugin, point the emitter at it using the `plugins` option in `tspconfig.yaml`. Each entry is a path that may be **absolute** or **relative to the resolved `emitter-output-dir`**. A path can point to either:

- a **file** — a pre-built plugin assembly (`*.dll`), or
- a **directory** containing pre-built plugin assemblies (`*.dll`) or a `.csproj` — when a `.csproj` is present the generator builds it (`dotnet build -c Release`) before loading the resulting assembly.

For example, to load plugins that live in a `codegen` folder under the output directory:

```yaml
emit:
  - "@typespec/http-client-csharp"
options:
  "@typespec/http-client-csharp":
    plugins:
      - "codegen/MyPlugin.dll" # file relative to emitter-output-dir
      - "codegen" # directory containing plugin assemblies
      - "/abs/path/to/MyPlugin.dll" # absolute path used as-is
```

Notes:

- Absolute paths are used as-is; relative paths are anchored to the resolved `emitter-output-dir`.
- When a directory contains a `.csproj`, it is built automatically; otherwise the directory is scanned for pre-built `*.dll` files.
- Plugins loaded via the `plugins` option are applied in addition to any plugins discovered through `node_modules`.

After the assemblies are loaded, every discovered `GeneratorPlugin` has its `Apply` method invoked on the selected generator before generation runs, so all of your registered visitors, rewriters, and references take effect.
