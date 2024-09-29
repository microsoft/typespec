// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers.ModelProviders
{
    public class ClientCustomizationTests
    {
        [Test]
        public async Task CanRemoveMethods()
        {
            var client = new ClientTypeProvider();
            var methods = new[]
            {
                new MethodProvider(new MethodSignature(
                        "Method1",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        []),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new MethodProvider(new MethodSignature(
                        "Method2",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        [
                            new ParameterProvider("param1", $"", typeof(bool))
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new MethodProvider(new MethodSignature(
                        "Method3",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        [
                            new ParameterProvider("param1", $"", typeof(string)),
                            new ParameterProvider("param2", $"", typeof(int))]),
                    Snippet.ThrowExpression(Snippet.Null), client)

            };
            client.MethodProviders = methods;
            var outputLibrary = new ClientOutputLibrary(client);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                createOutputLibrary: () => outputLibrary,
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            Assert.AreEqual(0, plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputClient").Methods.Count);
        }

        [Test]
        public async Task DoesNotRemoveMethodsThatDoNotMatch()
        {
            var client = new ClientTypeProvider();
            var methods = new[]
            {
                // Method name doesn't match
                new MethodProvider(new MethodSignature(
                        "MethodA",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        []),
                    Snippet.ThrowExpression(Snippet.Null), client),
                // Parameter type doesn't match
                new MethodProvider(new MethodSignature(
                        "Method2",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        [
                            new ParameterProvider("param1", $"", typeof(int))
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                // Number of parameters doesn't match
                new MethodProvider(new MethodSignature(
                        "Method3",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        [
                            new ParameterProvider("param1", $"", typeof(string)),
                            new ParameterProvider("param2", $"", typeof(int))]),
                    Snippet.ThrowExpression(Snippet.Null), client)

            };
            client.MethodProviders = methods;
            var outputLibrary = new ClientOutputLibrary(client);

            var plugin = await MockHelpers.LoadMockPluginAsync(
                createOutputLibrary: () => outputLibrary,
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());
            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            Assert.AreEqual(3, plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputClient").Methods.Count);
        }

        [Test]
        public async Task CanRemoveConstructors()
        {
            var client = new ClientTypeProvider();

            var outputLibrary = new ClientOutputLibrary(client);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                createOutputLibrary: () => outputLibrary,
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var constructors = new[]
            {
                // Parameter type doesn't match
                new ConstructorProvider(new ConstructorSignature(
                        new CSharpType(client, "Samples", [typeof(int)], null),
                        $"",
                        MethodSignatureModifiers.Public,
                        [new ParameterProvider("param1", $"", typeof(bool))]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                // Number of parameters doesn't match
                new ConstructorProvider(new ConstructorSignature(
                        new CSharpType(client, "Samples", [typeof(int)], null),
                        $"",
                        MethodSignatureModifiers.Public,
                        [
                            new ParameterProvider("param1", $"", typeof(bool)),
                            new ParameterProvider("param2", $"", typeof(int)),
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client)
            };
            client.ConstructorProviders = constructors;

            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            Assert.AreEqual(0, plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputClient").Constructors.Count);
        }

        [Test]
        public async Task DoesNotRemoveConstructorsThatDoNotMatch()
        {
            var client = new ClientTypeProvider();

            var outputLibrary = new ClientOutputLibrary(client);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                createOutputLibrary: () => outputLibrary,
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var constructors = new[]
            {
                new ConstructorProvider(new ConstructorSignature(
                        new CSharpType(client, "Samples", [typeof(int)], null),
                        $"",
                        MethodSignatureModifiers.Public,
                        []),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new ConstructorProvider(new ConstructorSignature(
                        new CSharpType(client, "Samples", [typeof(int)], null),
                        $"",
                        MethodSignatureModifiers.Public,
                        [new ParameterProvider("param1", $"", typeof(bool))]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new ConstructorProvider(new ConstructorSignature(
                        new CSharpType(client, "Samples", [typeof(int)], null),
                        $"",
                        MethodSignatureModifiers.Public,
                        [
                            new ParameterProvider("param1", $"", typeof(bool)),
                            new ParameterProvider("param2", $"", typeof(int)),
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client)
            };
            client.ConstructorProviders = constructors;

            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            Assert.AreEqual(3, plugin.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputClient").Constructors.Count);
        }

        private class ClientOutputLibrary : OutputLibrary
        {
            private readonly ClientTypeProvider _client;

            public ClientOutputLibrary(ClientTypeProvider client) : base()
            {
                _client = client;
            }
            protected override TypeProvider[] BuildTypeProviders()
            {
                var providers = base.BuildTypeProviders();
                return
                [
                    .. providers,
                    _client
                ];
            }
        }

        private class ClientTypeProvider : TypeProvider
        {
            public MethodProvider[] MethodProviders { get; set; } = [];
            public ConstructorProvider[] ConstructorProviders { get; set; } = [];

            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "MockInputClient";

            protected override MethodProvider[] BuildMethods() => MethodProviders;

            protected override ConstructorProvider[] BuildConstructors() => ConstructorProviders;
        }
    }
}
