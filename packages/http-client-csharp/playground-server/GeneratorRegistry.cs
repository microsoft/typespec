// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;

namespace PlaygroundServer;

internal sealed class GeneratorRegistry
{
    internal const string DefaultGeneratorName = "ScmCodeModelGenerator";
    private readonly Dictionary<string, string> _paths = new(StringComparer.Ordinal);
    internal GeneratorCatalog Catalog { get; }

    internal GeneratorRegistry(string defaultPath, string? azureRoot = null)
    {
        _paths.Add(DefaultGeneratorName, defaultPath);
        var packages = new List<GeneratorPackage>();
        if (!string.IsNullOrEmpty(azureRoot))
        {
            if (!Directory.Exists(azureRoot))
            {
                throw new DirectoryNotFoundException($"Azure generator root does not exist: {azureRoot}");
            }
            (string GeneratorName, string Package)[] definitions =
            [
                ("AzureClientGenerator", "http-client-csharp"),
                ("ManagementClientGenerator", "http-client-csharp-mgmt"),
                ("ProvisioningGenerator", "http-client-csharp-provisioning"),
            ];
            foreach (var (generatorName, package) in definitions)
            {
                var packageRoot = Path.Combine(azureRoot, package);
                var packageName = $"@azure-typespec/{package}";
                if (!Directory.Exists(packageRoot))
                {
                    Console.Error.WriteLine($"WARNING: {packageName} is not installed at {packageRoot}; {generatorName} is unavailable.");
                    continue;
                }
                using var metadata = JsonDocument.Parse(File.ReadAllText(Path.Combine(packageRoot, "package.json")));
                if (!metadata.RootElement.TryGetProperty("name", out var name) || name.GetString() != packageName
                    || !metadata.RootElement.TryGetProperty("version", out var version)
                    || string.IsNullOrWhiteSpace(version.GetString()))
                {
                    throw new InvalidDataException($"Invalid package identity or version for {packageName} at {packageRoot}.");
                }
                var path = Path.Combine(packageRoot, "dist", "generator", "Microsoft.TypeSpec.Generator.dll");
                foreach (var requiredPath in new[] { path, Path.ChangeExtension(path, ".runtimeconfig.json") })
                {
                    if (!File.Exists(requiredPath))
                    {
                        throw new FileNotFoundException($"Generator runtime missing for {packageName}.", requiredPath);
                    }
                }
                _paths.Add(generatorName, path);
                packages.Add(new(generatorName, packageName, version.GetString()!));
            }
        }
        Catalog = new(packages);
    }

    internal IEnumerable<string> Paths => _paths.Values;

    internal string? GetPath(string generatorName) => _paths.GetValueOrDefault(generatorName);

    internal string? GetPackageVersion(string generatorName) =>
        Catalog.Generators.FirstOrDefault(x => x.GeneratorName == generatorName)?.PackageVersion;
}

internal sealed record GeneratorCatalog(IReadOnlyList<GeneratorPackage> Generators);
internal sealed record GeneratorPackage(string GeneratorName, string PackageName, string PackageVersion);
