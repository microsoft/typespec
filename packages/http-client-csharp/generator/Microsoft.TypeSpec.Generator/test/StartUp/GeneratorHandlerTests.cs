// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.ComponentModel.Composition.Hosting;
using System.IO;
using System.Linq;
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
    }
}
