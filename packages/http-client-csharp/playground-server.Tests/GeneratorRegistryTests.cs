// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using NUnit.Framework;
using PlaygroundServer;

namespace PlaygroundServer.Tests;

[TestFixture]
public class GeneratorRegistryTests
{
    private string _root = null!;

    [SetUp]
    public void SetUp()
    {
        _root = Path.Combine(Path.GetTempPath(), "playground-registry-tests", Guid.NewGuid().ToString("N"));
        WritePackage("http-client-csharp", "1.2.3");
        WritePackage("http-client-csharp-mgmt", "2.3.4");
        WritePackage("http-client-csharp-provisioning", "3.4.5");
    }

    [TearDown]
    public void TearDown() => Directory.Delete(_root, recursive: true);

    [Test]
    public void DefaultGeneratorUsesUnbrandedPath()
    {
        var registry = new GeneratorRegistry("unbranded.dll", _root);

        Assert.That(registry.GetPath(GeneratorRegistry.DefaultGeneratorName), Is.EqualTo("unbranded.dll"));
    }

    [TestCase("AzureClientGenerator", "http-client-csharp")]
    [TestCase("ManagementClientGenerator", "http-client-csharp-mgmt")]
    [TestCase("ProvisioningGenerator", "http-client-csharp-provisioning")]
    public void AzureGeneratorsUseTheirOwnPackageRuntime(string generatorName, string package)
    {
        var registry = new GeneratorRegistry("unbranded.dll", _root);

        Assert.That(registry.GetPath(generatorName), Is.EqualTo(GetGeneratorPath(package)));
    }

    [TestCase("AzureClientGenerator")]
    [TestCase("ManagementClientGenerator")]
    [TestCase("ProvisioningGenerator")]
    public void AzureGeneratorsAreUnavailableWithoutConfiguredRoot(string generatorName)
    {
        var registry = new GeneratorRegistry("unbranded.dll");

        Assert.That(registry.GetPath(generatorName), Is.Null);
        Assert.That(registry.GetPath(GeneratorRegistry.DefaultGeneratorName), Is.EqualTo("unbranded.dll"));
        Assert.That(registry.Catalog.Generators, Is.Empty);
    }

    [TestCase("UnknownGenerator")]
    [TestCase("../Microsoft.TypeSpec.Generator.dll")]
    [TestCase("azureclientgenerator")]
    [TestCase("")]
    public void UnknownGeneratorsAreNotRouted(string generatorName)
    {
        var registry = new GeneratorRegistry("unbranded.dll", _root);

        Assert.That(registry.GetPath(generatorName), Is.Null);
    }

    [Test]
    public void PathsIncludeEachIndependentRuntime()
    {
        var registry = new GeneratorRegistry("unbranded.dll", _root);

        Assert.That(registry.Paths, Is.EquivalentTo(new[]
        {
            "unbranded.dll",
            GetGeneratorPath("http-client-csharp"),
            GetGeneratorPath("http-client-csharp-mgmt"),
            GetGeneratorPath("http-client-csharp-provisioning"),
        }));
    }

    [Test]
    public void CatalogReportsEachEmitterPackageVersionRatherThanBaseGeneratorVersion()
    {
        var registry = new GeneratorRegistry("unbranded.dll", _root);
        using var json = JsonDocument.Parse(JsonSerializer.Serialize(registry.Catalog, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
        var generators = json.RootElement.GetProperty("generators").EnumerateArray().ToArray();

        Assert.That(generators.Length, Is.EqualTo(3));
        Assert.Multiple(() =>
        {
            AssertEntry(generators[0], "AzureClientGenerator", "http-client-csharp", "1.2.3");
            AssertEntry(generators[1], "ManagementClientGenerator", "http-client-csharp-mgmt", "2.3.4");
            AssertEntry(generators[2], "ProvisioningGenerator", "http-client-csharp-provisioning", "3.4.5");
        });
    }

    [TestCase("AzureClientGenerator", "1.2.3")]
    [TestCase("ManagementClientGenerator", "2.3.4")]
    [TestCase("ProvisioningGenerator", "3.4.5")]
    public void CacheVersionUsesSelectedEmitterPackage(string generatorName, string version)
    {
        var registry = new GeneratorRegistry("unbranded.dll", _root);

        Assert.That(registry.GetPackageVersion(generatorName), Is.EqualTo(version));
        Assert.That(registry.GetPackageVersion(GeneratorRegistry.DefaultGeneratorName), Is.Null);
    }

    [Test]
    public void MissingRuntimeFailsAtStartup()
    {
        File.Delete(GetGeneratorPath("http-client-csharp-mgmt"));

        Assert.Throws<FileNotFoundException>(() => new GeneratorRegistry("unbranded.dll", _root));
    }

    [Test]
    public void MissingPackageMetadataFailsAtStartup()
    {
        File.Delete(Path.Combine(_root, "http-client-csharp", "package.json"));

        Assert.Throws<FileNotFoundException>(() => new GeneratorRegistry("unbranded.dll", _root));
    }

    [Test]
    public void WrongPackageIdentityFailsAtStartup()
    {
        WritePackage("http-client-csharp", "1.2.3", "@azure-typespec/http-client-csharp-provisioning");

        Assert.Throws<InvalidDataException>(() => new GeneratorRegistry("unbranded.dll", _root));
    }

    [TestCase("")]
    [TestCase(null)]
    public void MissingPackageVersionFailsAtStartup(string? version)
    {
        WritePackage("http-client-csharp", version);

        Assert.Throws<InvalidDataException>(() => new GeneratorRegistry("unbranded.dll", _root));
    }

    private static void AssertEntry(JsonElement entry, string generatorName, string package, string version)
    {
        Assert.That(entry.EnumerateObject().Select(x => x.Name), Is.EquivalentTo(new[] { "generatorName", "packageName", "packageVersion" }));
        Assert.That(entry.GetProperty("generatorName").GetString(), Is.EqualTo(generatorName));
        Assert.That(entry.GetProperty("packageName").GetString(), Is.EqualTo($"@azure-typespec/{package}"));
        Assert.That(entry.GetProperty("packageVersion").GetString(), Is.EqualTo(version));
    }

    private string GetGeneratorPath(string package) =>
        Path.Combine(_root, package, "dist", "generator", "Microsoft.TypeSpec.Generator.dll");

    private void WritePackage(string package, string? version, string? name = null)
    {
        var generatorPath = GetGeneratorPath(package);
        Directory.CreateDirectory(Path.GetDirectoryName(generatorPath)!);
        File.WriteAllText(generatorPath, "fake runtime");
        File.WriteAllText(Path.Combine(_root, package, "package.json"),
            JsonSerializer.Serialize(new { name = name ?? $"@azure-typespec/{package}", version }));
    }
}
