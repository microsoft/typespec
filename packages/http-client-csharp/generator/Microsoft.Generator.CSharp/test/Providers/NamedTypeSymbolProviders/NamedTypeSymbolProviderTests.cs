// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

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
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

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
        [TestCase(typeof(IList<SomeEnum>))]
        [TestCase(typeof(ReadOnlyMemory<byte>?))]
        [TestCase(typeof(ReadOnlyMemory<byte>))]
        [TestCase(typeof(ReadOnlyMemory<object>))]
        [TestCase(typeof(IEnumerable<PropertyType>))]
        [TestCase(typeof(IEnumerable<PropertyType?>))]
        [TestCase(typeof(IEnumerable<TimeSpan>))]
        [TestCase(typeof(string[]))]
        [TestCase(typeof(IDictionary<int, int>))]
        [TestCase(typeof(BinaryData))]
        [TestCase(typeof(SomeEnum), true)]
        [TestCase(typeof(SomeEnum?), true)]
        [TestCase(typeof(IDictionary<string, SomeEnum>))]
        public void ValidatePropertyTypes(Type propertyType, bool isEnum = false)
        {
            // setup
            var namedSymbol = new NamedSymbol(propertyType);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!);

            Assert.AreEqual(_namedSymbol.Properties.Count, _namedTypeSymbolProvider.Properties.Count);

            var property = _namedTypeSymbolProvider.Properties.FirstOrDefault();
            Assert.IsNotNull(property);

            Type? nullableUnderlyingType = Nullable.GetUnderlyingType(propertyType);
            var propertyName = nullableUnderlyingType?.Name ?? propertyType.Name;
            bool isNullable = nullableUnderlyingType != null;
            bool isSystemType = propertyType.FullName!.StartsWith("System")
                && (!isNullable || nullableUnderlyingType?.Namespace?.StartsWith("System") == true);

            var expectedType = isSystemType
                ? new CSharpType(propertyType, isNullable)
                : new CSharpType(propertyName, propertyType.Namespace!, false, isNullable, null, [], false, false);

            var propertyCSharpType = property!.Type;

            Assert.AreEqual(expectedType.Name, propertyCSharpType.Name);
            Assert.AreEqual(expectedType.IsNullable, propertyCSharpType.IsNullable);
            Assert.AreEqual(expectedType.IsList, propertyCSharpType.IsList);
            Assert.AreEqual(expectedType.Arguments.Count, propertyCSharpType.Arguments.Count);
            Assert.AreEqual(expectedType.IsCollection, propertyCSharpType.IsCollection);
            Assert.AreEqual(expectedType.IsFrameworkType, propertyCSharpType.IsFrameworkType);

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

        public enum SomeEnum
        {
            Foo,
        }
    }
}
