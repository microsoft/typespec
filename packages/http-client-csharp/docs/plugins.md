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
    <TargetFramework>net10.0</TargetFramework>
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

## Long-running operation metadata

Custom generators can read TCGC `0.74.0` selections through `InputLongRunningServiceMetadata.StatusMetadata` and `OperationId`. The shared emitter transports these selections; it does not generate poller accessors or change polling behavior.

Each `InputLroStatusMetadata` contains the selected `InputModelProperty` in `Property` and an ordered, typed `PropertySegments` path relative to `pollingInfo.responseModel`, not the final result. Segments preserve client names, wire serialization names, types, and optionality. Status selections retain TCGC's direct-then-inherited order. Consumers must read values from the latest monitor response, including initial monitor, failed, and canceled responses, and clear absent values rather than retain stale ones. Values are not continuation-token state; the next poll repopulates them after rehydration.

`OperationId` preserves TCGC's availability order: `InputLroOperationIdPathMetadata` first, then `InputLroOperationIdPropertyMetadata` when both are selected. The path entry carries `Source` (the polling link's `Location` and `Property`), `PathParameter`, and the modeled monitor route in `PollingPath`. Use the parameter's wire name and route to locate the ID; it need not be the last URI segment. The property entry carries `Property` and typed `PropertySegments`, rooted at the same monitor model as status selections. Keep the URI-derived ID available as a fallback and after rehydration, but continue polling with the complete polling URL, never the extracted ID.

Both collections are empty when selections are absent. Existing LRO constructors and final-response metadata remain unchanged. A custom generator using these fields must consume matching builds of the shared npm emitter and `Microsoft.TypeSpec.Generator.Input` assembly.
