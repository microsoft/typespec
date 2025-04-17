// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.ModelProviders
{
    public class ClientCustomizationTests
    {
        [Test]
        public async Task CanRemoveMethods()
        {
            var client = new ClientTypeProvider();
            var outputLibrary = new ClientOutputLibrary(client);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => outputLibrary,
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

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
                    Snippet.ThrowExpression(Snippet.Null), client),
                new MethodProvider(new MethodSignature(
                        "Method4",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        [
                            new ParameterProvider("param1", $"", typeof(string)),
                            new ParameterProvider("param2", $"", typeof(int?))]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new MethodProvider(new MethodSignature(
                        "Method5",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        [
                            // nullability should be ignored for reference types
                            new ParameterProvider("param1", $"", new CSharpType(typeof(string), isNullable: true))
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new MethodProvider(new MethodSignature(
                        "Method6",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        [
                            new ParameterProvider("param1", $"", new FooTypeProvider("Sample").Type)
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new MethodProvider(new MethodSignature(
                        "Method7",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        [
                            new ParameterProvider("param1", $"", new FooTypeProvider("BarNamespace").Type)
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new MethodProvider(new MethodSignature(
                    "Method8",
                    $"",
                    MethodSignatureModifiers.Public,
                    null,
                    $"",
                    [],
                    ExplicitInterface: new CSharpType(typeof(IAsyncDisposable))),
                    Snippet.ThrowExpression(Snippet.Null), client)
            };
            client.MethodProviders = methods;

            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            Assert.AreEqual(0, mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputClient").Methods.Count);
        }

        [Test]
        public async Task DoesNotRemoveMethodsThatDoNotMatch()
        {
            var client = new ClientTypeProvider();
            var outputLibrary = new ClientOutputLibrary(client);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => outputLibrary,
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

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
                    Snippet.ThrowExpression(Snippet.Null), client),
                // Nullability of one of the parameters doesn't match
                new MethodProvider(new MethodSignature(
                        "Method4",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        [
                            new ParameterProvider("param1", $"", typeof(string)),
                            new ParameterProvider("param2", $"", typeof(int?))]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new MethodProvider(new MethodSignature(
                        "Method5",
                        $"",
                        MethodSignatureModifiers.Public,
                        null,
                        $"",
                        [
                            new ParameterProvider("param1", $"", new FooTypeProvider("BarNamespace").Type)
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client),
            };
            client.MethodProviders = methods;

            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            Assert.AreEqual(5, mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputClient").Methods.Count);
        }

        [Test]
        public async Task CanRemoveConstructors()
        {
            var client = new ClientTypeProvider();

            var outputLibrary = new ClientOutputLibrary(client);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => outputLibrary,
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var constructors = new[]
            {
                // Parameter type doesn't match
                new ConstructorProvider(new ConstructorSignature(
                        client.Type,
                        $"",
                        MethodSignatureModifiers.Public,
                        [new ParameterProvider("param1", $"", typeof(bool))]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new ConstructorProvider(new ConstructorSignature(
                        client.Type,
                        $"",
                        MethodSignatureModifiers.Public,
                        [
                            new ParameterProvider("param1", $"", typeof(bool)),
                            new ParameterProvider("param2", $"", typeof(int)),
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new ConstructorProvider(new ConstructorSignature(
                        client.Type,
                        $"",
                        MethodSignatureModifiers.Public,
                        [
                            new ParameterProvider("param1", $"", new FooTypeProvider("Sample").Type)
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new ConstructorProvider(new ConstructorSignature(
                        client.Type,
                        $"",
                        MethodSignatureModifiers.Public,
                        [
                            new ParameterProvider("param1", $"", new FooTypeProvider("BarNamespace").Type)
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client),
            };
            client.ConstructorProviders = constructors;

            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            Assert.AreEqual(0, mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputClient").Constructors.Count);
        }

        [Test]
        public async Task DoesNotRemoveConstructorsThatDoNotMatch()
        {
            var client = new ClientTypeProvider();

            var outputLibrary = new ClientOutputLibrary(client);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => outputLibrary,
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var constructors = new[]
            {
                new ConstructorProvider(new ConstructorSignature(
                        client.Type,
                        $"",
                        MethodSignatureModifiers.Public,
                        []),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new ConstructorProvider(new ConstructorSignature(
                        client.Type,
                        $"",
                        MethodSignatureModifiers.Public,
                        [new ParameterProvider("param1", $"", typeof(bool))]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new ConstructorProvider(new ConstructorSignature(
                        client.Type,
                        $"",
                        MethodSignatureModifiers.Public,
                        [
                            new ParameterProvider("param1", $"", typeof(bool)),
                            new ParameterProvider("param2", $"", typeof(int)),
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client),
                new ConstructorProvider(new ConstructorSignature(
                        client.Type,
                        $"",
                        MethodSignatureModifiers.Public,
                        [
                            new ParameterProvider("param1", $"", new FooTypeProvider("BarNamespace").Type)
                        ]),
                    Snippet.ThrowExpression(Snippet.Null), client),
            };
            client.ConstructorProviders = constructors;

            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            Assert.AreEqual(4, mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputClient").Constructors.Count);
        }

        [Test]
        public async Task CustomCodeAttributesAreLoadedIntoAttributeStatements()
        {
            var client = new ClientTypeProvider();

            var outputLibrary = new ClientOutputLibrary(client);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                createOutputLibrary: () => outputLibrary,
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var csharpGen = new CSharpGen();
            await csharpGen.ExecuteAsync();

            var attributes = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t.Name == "MockInputClient").CustomCodeView!.Attributes;
            Assert.AreEqual(4, attributes.Count);
            Assert.AreEqual("[global::SampleTypeSpec.CodeGenSuppressAttribute(\"MockInputClient\")]\n", attributes[0].ToDisplayString());
            Assert.AreEqual("[global::SampleTypeSpec.CodeGenSuppressAttribute(\"MockInputClient\", typeof(bool))]\n", attributes[1].ToDisplayString());
            Assert.AreEqual("[global::SampleTypeSpec.CodeGenSuppressAttribute(\"MockInputClient\", typeof(bool), typeof(int))]\n", attributes[2].ToDisplayString());
            Assert.AreEqual("[global::SampleTypeSpec.CodeGenSerializationAttribute(\"MockInputClient\", SerializationValueHook = \"foo\", DeserializationValueHook = \"bar\")]\n", attributes[3].ToDisplayString());

            // validate that the properties are cached
            Assert.AreSame(attributes[0].Type, attributes[0].Type);
            Assert.AreSame(attributes[0].Arguments, attributes[0].Arguments);
            Assert.AreSame(attributes[0].PositionalArguments, attributes[0].PositionalArguments);

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

        private class FooTypeProvider : TypeProvider
        {
            private readonly string _namespace;
            public FooTypeProvider(string ns)
            {
               _namespace = ns;
            }
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "Foo";

            protected override string BuildNamespace() => _namespace;
        }
    }
}
