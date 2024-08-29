// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

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
            Assert.AreEqual(_namedSymbol.Properties.Count, properties.Count);
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

        [Test]
        public void ValidateMethods()
        {
            Dictionary<string, MethodProvider> methods = _namedTypeSymbolProvider.Methods.ToDictionary(p => p.Signature.Name);
            Assert.AreEqual(_namedSymbol.Methods.Count, methods.Count);
            foreach (var expected in _namedSymbol.Methods)
            {
                var actual = methods[expected.Signature.Name];

                Assert.IsTrue(methods.ContainsKey(expected.Signature.Name));
                Assert.AreEqual(expected.Signature.Name, actual.Signature.Name);
                Assert.AreEqual($"{expected.Signature.Description}.", actual.Signature.Description?.ToString()); // the writer adds a period
                Assert.AreEqual(expected.Signature.Modifiers, actual.Signature.Modifiers);
                Assert.AreEqual(expected.Signature.ReturnType, actual.Signature.ReturnType);
                Assert.AreEqual(expected.Signature.Parameters.Count, actual.Signature.Parameters.Count);
                for (int i = 0; i < expected.Signature.Parameters.Count; i++)
                {
                    Assert.AreEqual(expected.Signature.Parameters[i].Name, actual.Signature.Parameters[i].Name);
                    Assert.AreEqual($"{expected.Signature.Parameters[i].Description}.", actual.Signature.Parameters[i].Description.ToString()); // the writer adds a period
                    Assert.AreEqual(expected.Signature.Parameters[i].Type, actual.Signature.Parameters[i].Type);
                }
            }
        }

        [Test]
        public void ValidateConstructors()
        {
            Dictionary<string, ConstructorProvider> constructors = _namedTypeSymbolProvider.Constructors.ToDictionary(p => p.Signature.Name);
            Assert.AreEqual(_namedSymbol.Constructors.Count, constructors.Count);
            foreach (var expected in _namedSymbol.Constructors)
            {
                var actual = constructors[expected.Signature.Name];

                Assert.IsTrue(constructors.ContainsKey(expected.Signature.Name));
                Assert.AreEqual(expected.Signature.Name, actual.Signature.Name);
                Assert.AreEqual($"{expected.Signature.Description}.", actual.Signature.Description?.ToString()); // the writer adds a period
                Assert.AreEqual(expected.Signature.Modifiers, actual.Signature.Modifiers);
                Assert.AreEqual(expected.Signature.ReturnType, actual.Signature.ReturnType);
                Assert.AreEqual(expected.Signature.Parameters.Count, actual.Signature.Parameters.Count);
                for (int i = 0; i < expected.Signature.Parameters.Count; i++)
                {
                    Assert.AreEqual(expected.Signature.Parameters[i].Name, actual.Signature.Parameters[i].Name);
                    Assert.AreEqual($"{expected.Signature.Parameters[i].Description}.", actual.Signature.Parameters[i].Description.ToString()); // the writer adds a period
                    Assert.AreEqual(expected.Signature.Parameters[i].Type, actual.Signature.Parameters[i].Type);
                }
            }
        }

        [Test]
        public void ValidateFields()
        {
            Dictionary<string, FieldProvider> fields = _namedTypeSymbolProvider.Fields.ToDictionary(p => p.Name);
            Assert.AreEqual(_namedSymbol.Fields.Count, fields.Count);
            foreach (var expected in _namedSymbol.Fields)
            {
                var actual = fields[expected.Name];

                Assert.IsTrue(fields.ContainsKey(expected.Name));
                Assert.AreEqual(expected.Modifiers, actual.Modifiers);
                Assert.AreEqual(expected.Type, actual.Type);
                Assert.AreEqual(expected.Name, actual.Name);
                Assert.AreEqual($"{expected.Description}.", actual.Description!.ToString()); // the writer adds a period
                Assert.AreEqual(expected.InitializationValue, actual.InitializationValue);
            }
        }

        private class NamedSymbol : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "NamedSymbol";

            protected override string GetNamespace() => CodeModelPlugin.Instance.Configuration.ModelNamespace;

            protected override FieldProvider[] BuildFields()
            {
                return
                [
                    new FieldProvider(FieldModifiers.Public, typeof(int), "IntField", new TestTypeProvider(), $"PublicIntField field"),
                    new FieldProvider(FieldModifiers.Private, typeof(string), "StringField", new TestTypeProvider(), $"PrivateStringField field no setter"),
                    new FieldProvider(FieldModifiers.Internal, typeof(double),  "DoubleField", new TestTypeProvider(), $"InternalDoubleField field"),
                    new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(float),  "FloatField", new TestTypeProvider(), $"PublicStaticFloatField field"),
                ];
            }

            protected override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"IntProperty property", MethodSignatureModifiers.Public, typeof(int), "IntProperty", new AutoPropertyBody(true), this),
                    new PropertyProvider($"StringProperty property no setter", MethodSignatureModifiers.Public, typeof(string), "StringProperty", new AutoPropertyBody(false), this),
                    new PropertyProvider($"InternalStringProperty property no setter", MethodSignatureModifiers.Public, typeof(string), "InternalStringProperty", new AutoPropertyBody(false), this),
                    new PropertyProvider($"PropertyTypeProperty property", MethodSignatureModifiers.Public, new PropertyType().Type, "PropertyTypeProperty", new AutoPropertyBody(true), this),
                ];
            }

            protected override ConstructorProvider[] BuildConstructors()
            {
                var intParam = new ParameterProvider("intParam", $"intParam", new CSharpType(typeof(int)));

                return
                [
                    new ConstructorProvider(
                        new ConstructorSignature(Type, $"Initializes a new instance of {Type}", MethodSignatureModifiers.Public, [intParam]),
                        Throw(New.Instance(typeof(NotImplementedException))),
                        this)
                ];
            }

            protected override MethodProvider[] BuildMethods()
            {
                var intParam = new ParameterProvider("intParam", $"intParam", new CSharpType(typeof(int)));

                return
                [
                    new MethodProvider(
                        new MethodSignature("Method1", $"Description of method1", MethodSignatureModifiers.Public | MethodSignatureModifiers.Virtual, typeof(Task<int>), null, [intParam]),
                        Throw(New.Instance(typeof(NotImplementedException))),
                        this)
                ];
            }
        }

        private class PropertyType : TypeProvider
        {
            protected override PropertyProvider[] BuildProperties()
            {
                return
                [
                    new PropertyProvider($"Foo property", MethodSignatureModifiers.Public, typeof(int), "Foo", new AutoPropertyBody(true), this),
                ];
            }

            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "PropertyType";
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
