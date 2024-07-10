// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Providers
{
    public class NamedTypeSymbolProviderTests
    {
        private NamedTypeSymbolProvider _namedTypeSymbolProvider;
        private NamedSymbol _namedSymbol;

        public NamedTypeSymbolProviderTests()
        {
            MockHelpers.LoadMockPlugin();

            List<SyntaxTree> files =
            [
                GetTree(new NamedSymbol()),
                GetTree(new PropertyType())
            ];

            var compilation = CSharpCompilation.Create(
                assemblyName: "TestAssembly",
                syntaxTrees: [.. files],
                references: [MetadataReference.CreateFromFile(typeof(object).Assembly.Location)]);
            var iNamedSymbol = GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);
            _namedSymbol = new NamedSymbol();
        }

        [Test]
        public void ValidateName()
        {
            Assert.AreEqual(_namedSymbol.Name, _namedTypeSymbolProvider.Name);
        }

        [Test]
        public void ValidateNamespace()
        {
            Assert.AreEqual("Sample.Models", _namedTypeSymbolProvider.Type.Namespace);
            Assert.AreEqual(_namedSymbol.Type.Namespace, _namedTypeSymbolProvider.Type.Namespace);
        }

        [Test]
        public void ValidateProperties()
        {
            Dictionary<string, PropertyProvider> properties = _namedTypeSymbolProvider.Properties.ToDictionary(p => p.Name);
            foreach (var expected in _namedSymbol.Properties)
            {
                var actual = properties[expected.Name];

                Assert.IsTrue(properties.ContainsKey(expected.Name));
                Assert.AreEqual(expected.Name, actual.Name);
                Assert.AreEqual($"{expected.Description}.", actual.Description.ToString()); // the writer adds a period
                Assert.AreEqual(expected.Modifiers, actual.Modifiers);
                Assert.AreEqual(expected.Type, actual.Type);
                Assert.AreEqual(expected.Body.GetType(), actual.Body.GetType());
                Assert.AreEqual(expected.Body.HasSetter, actual.Body.HasSetter);
            }
        }

        private class NamedSymbol : TypeProvider
        {
            public override string RelativeFilePath => ".";

            public override string Name => "NamedSymbol";

            protected override string GetNamespace() => CodeModelPlugin.Instance.Configuration.ModelNamespace;

            protected override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"IntProperty property", MethodSignatureModifiers.Public, typeof(int), "IntProperty", new AutoPropertyBody(true)),
                    new PropertyProvider($"StringProperty property no setter", MethodSignatureModifiers.Public, typeof(string), "StringProperty", new AutoPropertyBody(false)),
                    new PropertyProvider($"InternalStringProperty property no setter", MethodSignatureModifiers.Public, typeof(string), "InternalStringProperty", new AutoPropertyBody(false)),
                    new PropertyProvider($"PropertyTypeProperty property", MethodSignatureModifiers.Public, new PropertyType().Type, "PropertyTypeProperty", new AutoPropertyBody(true)),
                ];
            }
        }

        private class PropertyType : TypeProvider
        {
            public override string RelativeFilePath => ".";

            public override string Name => "PropertyType";

            protected override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"Foo property", MethodSignatureModifiers.Public, typeof(int), "Foo", new AutoPropertyBody(true)),
                ];
            }
        }

        private static SyntaxTree GetTree(TypeProvider provider)
        {
            var writer = new TypeProviderWriter(provider);
            var file = writer.Write();
            return CSharpSyntaxTree.ParseText(file.Content);
        }

        internal static INamedTypeSymbol? GetSymbol(INamespaceSymbol namespaceSymbol, string name)
        {
            foreach (var childNamespaceSymbol in namespaceSymbol.GetNamespaceMembers())
            {
                return GetSymbol(childNamespaceSymbol, name);
            }

            foreach (INamedTypeSymbol symbol in namespaceSymbol.GetTypeMembers())
            {
                if (symbol.MetadataName == name)
                {
                    return symbol;
                }
            }

            return null;
        }
    }
}
