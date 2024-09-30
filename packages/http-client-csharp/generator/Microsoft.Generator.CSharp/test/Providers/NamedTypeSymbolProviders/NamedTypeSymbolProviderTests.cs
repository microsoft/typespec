// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Tests.Providers.NamedTypeSymbolProviders
{
    public class NamedTypeSymbolProviderTests
    {
        private NamedTypeSymbolProvider _namedTypeSymbolProvider;
        private NamedSymbol _namedSymbol;

        public NamedTypeSymbolProviderTests()
        {
            _namedSymbol = new NamedSymbol();
            var compilation = CompilationHelper.LoadCompilation([_namedSymbol, new PropertyType()]);
            var iNamedSymbol = GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);
        }

        [Test]
        public void ValidateModifiers()
        {
            var modifiers = _namedTypeSymbolProvider.DeclarationModifiers;
            Assert.IsTrue(modifiers.HasFlag(TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class));
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

        [TestCase(typeof(int))]
        [TestCase(typeof(string))]
        [TestCase(typeof(double?))]
        [TestCase(typeof(float?))]
        [TestCase(typeof(PropertyType))]
        [TestCase(typeof(IList<string>))]
        [TestCase(typeof(IList<string?>))]
        [TestCase(typeof(IList<PropertyType>))]
        [TestCase(typeof(ReadOnlyMemory<byte>?))]
        [TestCase(typeof(ReadOnlyMemory<byte>))]
        public void ValidatePropertyTypes(Type propertyType)
        {
            // setup
            var namedSymbol = new NamedSymbol(propertyType);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);

            Assert.AreEqual(_namedSymbol.Properties.Count, _namedTypeSymbolProvider.Properties.Count);

            var property = _namedTypeSymbolProvider.Properties.FirstOrDefault();
            Assert.IsNotNull(property);

            bool isNullable = Nullable.GetUnderlyingType(propertyType) != null;
            var expectedType = new CSharpType(propertyType, isNullable);
            var propertyCSharpType = property!.Type;

            Assert.AreEqual(expectedType.Name, propertyCSharpType.Name);
            Assert.AreEqual(expectedType.IsNullable, propertyCSharpType.IsNullable);
            Assert.AreEqual(expectedType.IsList, propertyCSharpType.IsList);
            Assert.AreEqual(expectedType.Arguments.Count, expectedType.Arguments.Count);

            for (var i = 0; i < expectedType.Arguments.Count; i++)
            {
                Assert.AreEqual(expectedType.Arguments[i].Name, propertyCSharpType.Arguments[i].Name);
                Assert.AreEqual(expectedType.Arguments[i].IsNullable, propertyCSharpType.Arguments[i].IsNullable);
            }

            // validate the underlying types aren't nullable
            if (isNullable && expectedType.IsFrameworkType)
            {
                var underlyingType = propertyCSharpType.FrameworkType;
                Assert.IsTrue(Nullable.GetUnderlyingType(underlyingType) == null);
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
            private readonly Type? _propertyType;
            protected override string BuildRelativeFilePath() => ".";

            protected override string BuildName() => "NamedSymbol";

            protected override string GetNamespace() => CodeModelPlugin.Instance.Configuration.ModelNamespace;

            public NamedSymbol(Type? propertyType = null) : base()
            {
                _propertyType = propertyType;
            }

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
                if (_propertyType == null)
                {
                    return
                    [
                        new PropertyProvider($"IntProperty property", MethodSignatureModifiers.Public, typeof(int), "IntProperty", new AutoPropertyBody(true), this),
                        new PropertyProvider($"StringProperty property no setter", MethodSignatureModifiers.Public, typeof(string), "StringProperty", new AutoPropertyBody(false), this),
                        new PropertyProvider($"InternalStringProperty property no setter", MethodSignatureModifiers.Public, typeof(string), "InternalStringProperty", new AutoPropertyBody(false), this),
                        new PropertyProvider($"PropertyTypeProperty property", MethodSignatureModifiers.Public, new PropertyType().Type, "PropertyTypeProperty", new AutoPropertyBody(true), this),
                    ];
                }

                return
                [
                    new PropertyProvider($"p1", MethodSignatureModifiers.Public, _propertyType, "P1", new AutoPropertyBody(true), this)
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
