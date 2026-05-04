// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.EmitterRpc;
using Moq;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.StartUp
{
    public class GeneratorHandlerTests
    {
        [Test]
        public void SelectGeneratorFindsMatchingGenerator()
        {
            var generatorHandler = new GeneratorHandler();
            var metadataMock = new Mock<IMetadata>();
            metadataMock.SetupGet(m => m.GeneratorName).Returns("MockGenerator");
            var mockGenerator = new Mock<CodeModelGenerator>();

            generatorHandler.Generators = new List<System.Lazy<CodeModelGenerator, IMetadata>>
            {
                new(() => mockGenerator.Object, metadataMock.Object),
            };
            CommandLineOptions options = new() { GeneratorName = "MockGenerator" };

            Assert.DoesNotThrow(() => generatorHandler.SelectGenerator(options));

            // Configure must be called on the selected generator
            mockGenerator.Verify(p => p.Configure(), Times.Once);
        }

        [Test]
        public void SelectGeneratorThrowsWhenNoMatch()
        {
            var generatorHandler = new GeneratorHandler();
            var metadataMock = new Mock<IMetadata>();
            metadataMock.SetupGet(m => m.GeneratorName).Returns("MockGenerator");
            var mockGenerator = new Mock<CodeModelGenerator>();

            generatorHandler.Generators = new List<System.Lazy<CodeModelGenerator, IMetadata>>
            {
                new(() => mockGenerator.Object, metadataMock.Object),
            };
            CommandLineOptions options = new() { GeneratorName = "NonExistentGenerator" };

            Assert.Throws<System.InvalidOperationException>(() => generatorHandler.SelectGenerator(options));
            mockGenerator.Verify(p => p.Configure(), Times.Never);
        }

        [Test]
        public void SelectGeneratorCallsPluginsBeforeConfigure()
        {
            var generatorHandler = new GeneratorHandler();

            var metadataMock = new Mock<IMetadata>();
            metadataMock.SetupGet(m => m.GeneratorName).Returns("MockGenerator");
            var mockGenerator = new Mock<CodeModelGenerator>();

            bool pluginApplied = false;

            var mockPlugin = new Mock<GeneratorPlugin>();
            mockPlugin.Setup(p => p.Apply(It.IsAny<CodeModelGenerator>()))
                .Callback(() => pluginApplied = true);

            mockGenerator.Setup(p => p.Configure())
                .Callback(() =>
                {
                    Assert.IsTrue(pluginApplied, "Configure was called before plugin.Apply()");
                });

            generatorHandler.Generators = new List<Lazy<CodeModelGenerator, IMetadata>>
            {
                new(() => mockGenerator.Object, metadataMock.Object),
            };

            generatorHandler.Plugins = new List<GeneratorPlugin> { mockPlugin.Object };

            CommandLineOptions options = new() { GeneratorName = "MockGenerator" };
            generatorHandler.SelectGenerator(options);

            mockPlugin.Verify(p => p.Apply(mockGenerator.Object), Times.Once);
            mockGenerator.Verify(p => p.Configure(), Times.Once);
        }

        [Test]
        public void SelectGeneratorAppliesAllPlugins()
        {
            var generatorHandler = new GeneratorHandler();
            var metadataMock = new Mock<IMetadata>();
            metadataMock.SetupGet(m => m.GeneratorName).Returns("MockGenerator");
            var mockGenerator = new Mock<CodeModelGenerator>();

            var plugin1 = new Mock<GeneratorPlugin>();
            var plugin2 = new Mock<GeneratorPlugin>();

            generatorHandler.Generators = new List<Lazy<CodeModelGenerator, IMetadata>>
            {
                new(() => mockGenerator.Object, metadataMock.Object),
            };

            generatorHandler.Plugins = new List<GeneratorPlugin> { plugin1.Object, plugin2.Object };

            CommandLineOptions options = new() { GeneratorName = "MockGenerator" };
            generatorHandler.SelectGenerator(options);

            plugin1.Verify(p => p.Apply(mockGenerator.Object), Times.Once);
            plugin2.Verify(p => p.Apply(mockGenerator.Object), Times.Once);
        }

        [Test]
        public void SelectGeneratorStopsIfPluginThrows()
        {
            var generatorHandler = new GeneratorHandler();
            var metadataMock = new Mock<IMetadata>();
            metadataMock.SetupGet(m => m.GeneratorName).Returns("MockGenerator");
            var mockGenerator = new Mock<CodeModelGenerator>();

            var failingPlugin = new Mock<GeneratorPlugin>();
            failingPlugin.Setup(p => p.Apply(It.IsAny<CodeModelGenerator>()))
                .Throws(new Exception("Plugin failure"));

            generatorHandler.Generators = new List<Lazy<CodeModelGenerator, IMetadata>>
            {
                new(() => mockGenerator.Object, metadataMock.Object),
            };

            generatorHandler.Plugins = new List<GeneratorPlugin> { failingPlugin.Object };

            CommandLineOptions options = new() { GeneratorName = "MockGenerator" };

            Assert.Throws<Exception>(() => generatorHandler.SelectGenerator(options));
            mockGenerator.Verify(p => p.Configure(), Times.Never);
        }

        [Test]
        public void ShouldDiscoverPlugins()
        {
            var handler = new GeneratorHandler();
            var catalog = new TypeCatalog(typeof(TestGeneratorPlugin), typeof(TestGenerator));
            var container = new CompositionContainer(catalog);
            container.ComposeParts(handler);

            var plugins = handler.Plugins?.ToList();

            Assert.NotNull(plugins);
            Assert.AreEqual(1, plugins!.Count);
            Assert.IsInstanceOf<TestGeneratorPlugin>(plugins[0]);
        }

        [Test]
        public void GetOrderedPluginDlls()
        {
            var testRoot = TestContext.CurrentContext.TestDirectory;
            var plugin1Directory = Path.Combine(testRoot, "node_modules", "plugin-1", "dist");
            var plugin2Directory = Path.Combine(testRoot, "node_modules", "plugin-2", "dist");
            try
            {
                Directory.CreateDirectory(plugin1Directory);
                Directory.CreateDirectory(plugin2Directory);

                File.WriteAllText(Path.Combine(testRoot, "package.json"), @"{
                    ""name"": ""dummy-project"",
                    ""version"": ""1.0.0"",
                    ""description"": ""Dummy project for testing purposes."",
                    ""dependencies"": { ""plugin-1"": ""^1.0.0"", ""plugin-2"": ""^2.0.0"" }
                }");

                File.WriteAllText(Path.Combine(plugin1Directory, "Plugin1.dll"), "Dummy DLL content");
                File.WriteAllText(Path.Combine(plugin2Directory, "Plugin2.dll"), "Other DLL content");
                var dlls = GeneratorHandler.GetOrderedPluginDlls(plugin1Directory);

                Assert.AreEqual(2, dlls.Count);
                Assert.AreEqual("Plugin1.dll", Path.GetFileName(dlls[0]));
                Assert.AreEqual("Plugin2.dll", Path.GetFileName(dlls[1]));
            }
            finally
            {
                File.Delete(Path.Combine(plugin1Directory, "Plugin1.dll"));
                File.Delete(Path.Combine(plugin2Directory, "Plugin2.dll"));
            }
        }

        [Test]
        public void BuildPlugin_BuildsProjectAndReturnsDllPath()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                Directory.CreateDirectory(testDir);

                // Create a minimal .csproj
                File.WriteAllText(Path.Combine(testDir, "TestPlugin.csproj"), @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
</Project>");

                // Create a minimal .cs file (doesn't need to be a real plugin for the build test)
                File.WriteAllText(Path.Combine(testDir, "TestPlugin.cs"), @"
namespace TestPlugin
{
    public class Dummy { }
}");

                using var emitter = new Emitter(Stream.Null);
                var result = GeneratorHandler.BuildPlugin(
                    Path.Combine(testDir, "TestPlugin.csproj"),
                    emitter);

                Assert.IsNotNull(result, "BuildPlugin should return a DLL path");
                Assert.IsTrue(result!.EndsWith("TestPlugin.dll", StringComparison.OrdinalIgnoreCase));
                Assert.IsTrue(File.Exists(result), $"Built DLL should exist at {result}");
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }

        [Test]
        public void BuildPlugin_ThrowsOnInvalidProject()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                Directory.CreateDirectory(testDir);

                // Create an invalid .csproj
                File.WriteAllText(Path.Combine(testDir, "Bad.csproj"), "not valid xml");

                using var emitter = new Emitter(Stream.Null);

                Assert.Throws<InvalidOperationException>(() =>
                    GeneratorHandler.BuildPlugin(
                        Path.Combine(testDir, "Bad.csproj"),
                        emitter));
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }

        [Test]
        public void BuildPluginIfNeeded_ReturnsNullWhenNoCsproj()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                Directory.CreateDirectory(testDir);
                File.WriteAllText(Path.Combine(testDir, "readme.txt"), "no csproj here");

                using var emitter = new Emitter(Stream.Null);
                var result = GeneratorHandler.BuildPluginIfNeeded(testDir, emitter);

                Assert.IsNull(result);
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }

        [Test]
        public void BuildPluginIfNeeded_FindsCsprojInSubdirectory()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            var srcDir = Path.Combine(testDir, "src");
            try
            {
                Directory.CreateDirectory(srcDir);

                File.WriteAllText(Path.Combine(srcDir, "SubPlugin.csproj"), @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
</Project>");

                File.WriteAllText(Path.Combine(srcDir, "SubPlugin.cs"), @"
namespace SubPlugin { public class Dummy { } }");

                using var emitter = new Emitter(Stream.Null);
                var result = GeneratorHandler.BuildPluginIfNeeded(testDir, emitter);

                Assert.IsNotNull(result);
                Assert.IsTrue(result!.EndsWith("SubPlugin.dll", StringComparison.OrdinalIgnoreCase));
                Assert.IsTrue(File.Exists(result));
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }

        [Test]
        public void BuildPlugin_OutputDllContainsCompiledType()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                Directory.CreateDirectory(testDir);

                File.WriteAllText(Path.Combine(testDir, "TypedPlugin.csproj"), @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
</Project>");

                File.WriteAllText(Path.Combine(testDir, "MyType.cs"), @"
namespace TypedPlugin { public class MyType { public int Value => 42; } }");

                using var emitter = new Emitter(Stream.Null);
                var dllPath = GeneratorHandler.BuildPlugin(
                    Path.Combine(testDir, "TypedPlugin.csproj"), emitter);

                Assert.IsNotNull(dllPath);
                var asm = System.Reflection.Assembly.LoadFrom(dllPath!);
                var type = asm.GetType("TypedPlugin.MyType");
                Assert.IsNotNull(type, "Compiled assembly should contain MyType");
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }

        [Test]
        public void AddConfiguredPluginDlls_NoPluginPaths_DoesNothing()
        {
            var config = new Configuration(
                Path.GetTempPath(),
                new Dictionary<string, BinaryData>(),
                "TestPackage",
                false,
                Configuration.UnreferencedTypesHandlingOption.RemoveOrInternalize,
                null,
                pluginPaths: null);

            using var catalog = new AggregateCatalog();
            GeneratorHandler.AddConfiguredPluginDlls(catalog, config);

            Assert.AreEqual(0, catalog.Catalogs.Count);
        }

        [Test]
        public void AddConfiguredPluginDlls_InvalidDirectory_Throws()
        {
            var config = new Configuration(
                Path.GetTempPath(),
                new Dictionary<string, BinaryData>(),
                "TestPackage",
                false,
                Configuration.UnreferencedTypesHandlingOption.RemoveOrInternalize,
                null,
                pluginPaths: ["/nonexistent/path"]);

            using var catalog = new AggregateCatalog();

            Assert.Throws<InvalidOperationException>(() =>
                GeneratorHandler.AddConfiguredPluginDlls(catalog, config));
        }

        [Test]
        public void AddConfiguredPluginDlls_DirectoryWithPreBuiltDlls_LoadsThem()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                Directory.CreateDirectory(testDir);

                // Copy the test assembly as a pre-built plugin DLL
                var testAssembly = typeof(GeneratorHandlerTests).Assembly.Location;
                File.Copy(testAssembly, Path.Combine(testDir, "PreBuiltPlugin.dll"));

                var config = new Configuration(
                    Path.GetTempPath(),
                    new Dictionary<string, BinaryData>(),
                    "TestPackage",
                    false,
                    Configuration.UnreferencedTypesHandlingOption.RemoveOrInternalize,
                    null,
                    pluginPaths: [testDir]);

                using var catalog = new AggregateCatalog();
                GeneratorHandler.AddConfiguredPluginDlls(catalog, config);

                Assert.IsTrue(catalog.Catalogs.Count > 0, "Should have loaded at least one catalog");
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }

        [Test]
        public void AddConfiguredPluginDlls_DirectoryWithCsproj_BuildsAndLoads()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                Directory.CreateDirectory(testDir);

                File.WriteAllText(Path.Combine(testDir, "AutoBuildPlugin.csproj"), @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
</Project>");

                File.WriteAllText(Path.Combine(testDir, "Plugin.cs"), @"
namespace AutoBuildPlugin { public class Dummy { } }");

                var config = new Configuration(
                    Path.GetTempPath(),
                    new Dictionary<string, BinaryData>(),
                    "TestPackage",
                    false,
                    Configuration.UnreferencedTypesHandlingOption.RemoveOrInternalize,
                    null,
                    pluginPaths: [testDir]);

                using var catalog = new AggregateCatalog();
                GeneratorHandler.AddConfiguredPluginDlls(catalog, config);

                Assert.IsTrue(catalog.Catalogs.Count > 0, "Should have built and loaded the plugin");
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }

        [Test]
        public void AddConfiguredPluginDlls_MultiplePluginPaths()
        {
            var testDir1 = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            var testDir2 = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                // Plugin 1: pre-built DLL
                Directory.CreateDirectory(testDir1);
                var testAssembly = typeof(GeneratorHandlerTests).Assembly.Location;
                File.Copy(testAssembly, Path.Combine(testDir1, "Plugin1.dll"));

                // Plugin 2: .csproj to build
                Directory.CreateDirectory(testDir2);
                File.WriteAllText(Path.Combine(testDir2, "Plugin2.csproj"), @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
</Project>");
                File.WriteAllText(Path.Combine(testDir2, "Plugin2.cs"), @"
namespace Plugin2 { public class Dummy { } }");

                var config = new Configuration(
                    Path.GetTempPath(),
                    new Dictionary<string, BinaryData>(),
                    "TestPackage",
                    false,
                    Configuration.UnreferencedTypesHandlingOption.RemoveOrInternalize,
                    null,
                    pluginPaths: [testDir1, testDir2]);

                using var catalog = new AggregateCatalog();
                GeneratorHandler.AddConfiguredPluginDlls(catalog, config);

                Assert.IsTrue(catalog.Catalogs.Count >= 2, "Should have loaded catalogs from both plugin paths");
            }
            finally
            {
                try { Directory.Delete(testDir1, true); } catch { }
                try { Directory.Delete(testDir2, true); } catch { }
            }
        }
        [Test]
        public void GetExpectedOutputPath_ConstructsPathFromCsprojProperties()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                Directory.CreateDirectory(testDir);

                File.WriteAllText(Path.Combine(testDir, "MyPlugin.csproj"), @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
</Project>");

                var result = GeneratorHandler.GetExpectedOutputPath(
                    Path.Combine(testDir, "MyPlugin.csproj"));

                Assert.IsNotNull(result);
                var expected = Path.Combine(testDir, "bin", "Release", "net10.0", "MyPlugin.dll");
                Assert.AreEqual(expected, result);
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }

        [Test]
        public void GetExpectedOutputPath_UsesAssemblyNameWhenSpecified()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                Directory.CreateDirectory(testDir);

                File.WriteAllText(Path.Combine(testDir, "MyPlugin.csproj"), @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <AssemblyName>CustomName</AssemblyName>
  </PropertyGroup>
</Project>");

                var result = GeneratorHandler.GetExpectedOutputPath(
                    Path.Combine(testDir, "MyPlugin.csproj"));

                Assert.IsNotNull(result);
                var expected = Path.Combine(testDir, "bin", "Release", "net10.0", "CustomName.dll");
                Assert.AreEqual(expected, result);
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }

        [Test]
        public void GetExpectedOutputPath_ReturnsNullWhenNoTargetFramework()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                Directory.CreateDirectory(testDir);

                File.WriteAllText(Path.Combine(testDir, "Bad.csproj"), @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
  </PropertyGroup>
</Project>");

                var result = GeneratorHandler.GetExpectedOutputPath(
                    Path.Combine(testDir, "Bad.csproj"));

                Assert.IsNull(result);
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }

        [Test]
        public void GetExpectedOutputPath_ReturnsNullForInvalidXml()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                Directory.CreateDirectory(testDir);

                File.WriteAllText(Path.Combine(testDir, "Bad.csproj"), "not valid xml");

                var result = GeneratorHandler.GetExpectedOutputPath(
                    Path.Combine(testDir, "Bad.csproj"));

                Assert.IsNull(result);
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }

        [Test]
        public void GetExpectedOutputPath_UsesFirstTargetFrameworkFromMultiTargeting()
        {
            var testDir = Path.Combine(Path.GetTempPath(), "typespec-test-plugin-" + Guid.NewGuid().ToString("N")[..8]);
            try
            {
                Directory.CreateDirectory(testDir);

                File.WriteAllText(Path.Combine(testDir, "MultiTarget.csproj"), @"<Project Sdk=""Microsoft.NET.Sdk"">
  <PropertyGroup>
    <TargetFrameworks>net8.0;net10.0</TargetFrameworks>
  </PropertyGroup>
</Project>");

                var result = GeneratorHandler.GetExpectedOutputPath(
                    Path.Combine(testDir, "MultiTarget.csproj"));

                Assert.IsNotNull(result);
                var expected = Path.Combine(testDir, "bin", "Release", "net8.0", "MultiTarget.dll");
                Assert.AreEqual(expected, result);
            }
            finally
            {
                try { Directory.Delete(testDir, true); } catch { }
            }
        }
    }
}
