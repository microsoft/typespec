// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using PlaygroundServer;

namespace PlaygroundServer.Tests;

[TestFixture]
public class GeneratorRegistryTests
{
    [Test]
    public void DefaultGeneratorUsesUnbrandedPath()
    {
        var registry = new GeneratorRegistry("unbranded.dll", "azure.dll");

        Assert.That(registry.GetPath(GeneratorRegistry.DefaultGeneratorName), Is.EqualTo("unbranded.dll"));
    }

    [TestCase("AzureClientGenerator")]
    [TestCase("ManagementClientGenerator")]
    [TestCase("ProvisioningGenerator")]
    public void AzureGeneratorsUseSeparatePath(string generatorName)
    {
        var registry = new GeneratorRegistry("unbranded.dll", "azure.dll");

        Assert.That(registry.GetPath(generatorName), Is.EqualTo("azure.dll"));
    }

    [TestCase("AzureClientGenerator")]
    [TestCase("ManagementClientGenerator")]
    [TestCase("ProvisioningGenerator")]
    public void AzureGeneratorsAreUnavailableWithoutConfiguredPath(string generatorName)
    {
        var registry = new GeneratorRegistry("unbranded.dll");

        Assert.That(registry.GetPath(generatorName), Is.Null);
        Assert.That(registry.GetPath(GeneratorRegistry.DefaultGeneratorName), Is.EqualTo("unbranded.dll"));
    }

    [TestCase("UnknownGenerator")]
    [TestCase("../Microsoft.TypeSpec.Generator.dll")]
    [TestCase("azureclientgenerator")]
    [TestCase("")]
    public void UnknownGeneratorsAreNotRouted(string generatorName)
    {
        var registry = new GeneratorRegistry("unbranded.dll", "azure.dll");

        Assert.That(registry.GetPath(generatorName), Is.Null);
    }

    [Test]
    public void PathsContainEachConfiguredGeneratorDirectoryOnce()
    {
        var registry = new GeneratorRegistry("unbranded.dll", "azure.dll");

        Assert.That(registry.Paths, Is.EquivalentTo(new[] { "unbranded.dll", "azure.dll" }));
    }

    [Test]
    public void SharedPathsAreOnlyEnumeratedOnce()
    {
        var registry = new GeneratorRegistry("generator.dll", "generator.dll");

        Assert.That(registry.Paths, Is.EqualTo(new[] { "generator.dll" }));
    }

    [Test]
    public void UnconfiguredAzurePathIsNotEnumerated()
    {
        var registry = new GeneratorRegistry("unbranded.dll");

        Assert.That(registry.Paths, Is.EqualTo(new[] { "unbranded.dll" }));
    }
}
