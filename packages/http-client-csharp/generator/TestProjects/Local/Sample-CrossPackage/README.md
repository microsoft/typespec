# Sample-CrossPackage — cross-package C# inheritance repro

This sample reproduces the scenario where a single set of TypeSpec definitions is emitted
into **two separate C# packages**:

| Package | Folder | Generated C# | Models |
| ------- | ------ | ------------ | ------ |
| Base (A) | [`Animals/`](./Animals) | `SampleAnimals` | `Animal` (discriminated base) |
| Extended (B) | [`Pets/`](./Pets) | `SamplePets` | `Pet` / `Dog` (extend `Animal`) |

Package B consumes Package A as a **NuGet dependency**: the generated `Pet` and `Dog`
classes inherit from `SampleAnimals.Animal` instead of re-generating it.

## How the cross-package reference is wired

1. A shared TypeSpec definition of the base model lives in [`shared/animal.tsp`](./shared/animal.tsp)
   and is imported by both packages, so `Pet extends SampleAnimals.Animal` resolves at
   compile time. (This is the local equivalent of how `azure-ai-extensions-openai`
   imports the OpenAI TypeSpec library.)
2. Package B's [`client.tsp`](./Pets/client.tsp) marks `Animal` as an **external type** for
   the C# emitter:
   ```tsp
   @@alternateType(SampleAnimals.Animal,
     { identity: "SampleAnimals.Animal", package: "SampleAnimals", minVersion: "1.0.0" },
     "csharp");
   ```
   This tells the emitter not to generate `Animal` in Package B and to reference it from the
   `SampleAnimals` NuGet package instead (resolved by `ExternalTypeReferenceResolver` /
   `ExternalModelProvider`).
3. Package A is `dotnet pack`ed into a local NuGet feed (`local-feed/`); Package B's
   [`nuget.config`](./Pets/nuget.config) points at that feed and its
   [`SamplePets.csproj`](./Pets/src/SamplePets.csproj) has a `PackageReference` to
   `SampleAnimals`.

## Reproduction steps

Run from the repo root after `npm install && npm run build` in
`packages/http-client-csharp`.

```powershell
$root = "packages/http-client-csharp"
$emitter = (Resolve-Path $root).Path
$cp = "$emitter/generator/TestProjects/Local/Sample-CrossPackage"

# 1. Generate + build + pack the base package (SampleAnimals) into the local feed
npx tsp compile "$cp/Animals/Animals.tsp" --emit $emitter `
  --config "$cp/Animals/tspconfig.yaml" `
  --option "@typespec/http-client-csharp.emitter-output-dir=$cp/Animals"
dotnet pack "$cp/Animals/src/SampleAnimals.csproj" -c Release -o "$cp/local-feed"

# 2. Generate the extended package (SamplePets)
npx tsp compile "$cp/Pets/client.tsp" --emit $emitter `
  --config "$cp/Pets/tspconfig.yaml" `
  --option "@typespec/http-client-csharp.emitter-output-dir=$cp/Pets"

# 3. Build the extended package against the SampleAnimals NuGet package
dotnet build "$cp/Pets/src/SamplePets.csproj"
```

## Observed problem

The base `SampleAnimals.Animal` is generated with only non-public constructors
(`private protected Animal(string kind, string name)` and an `internal` deserialization
ctor). The generated `Pet` / `Dog` in Package B therefore:

- do **not** chain to any accessible base constructor, and
- never set or serialize the `kind` discriminator (`"pet"` / `"dog"`).

`dotnet build` of `SamplePets` fails with, for example:

```
Pet.cs: error CS1729: 'Animal' does not contain a constructor that takes 0 arguments
Dog.cs: error CS1729: 'Animal' does not contain a constructor that takes 0 arguments
SamplePetsModelFactory.cs: error CS0144: Cannot create an instance of the abstract type or interface 'Animal'
```

The `SampleAnimals` package **is** resolved successfully from the local feed (the compiler
finds `Animal` and only objects to its constructors), so the failure is in the generated
cross-package code, not in package resolution.

## Notes

- This sample is intentionally **not** wired into `eng/scripts/Generate.ps1`, because the
  extended package is expected to fail to compile and would break the regeneration/build
  pipeline.
- `local-feed/` and the generated `Generated/` output are build artifacts produced by the
  steps above.
