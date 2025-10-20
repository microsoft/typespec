// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using NUnit.Framework;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Tests.Providers.NamedTypeSymbolProviders
{
    public class NamedTypeSymbolProviderTests
    {
        private NamedTypeSymbolProvider _namedTypeSymbolProvider;
        private NamedSymbol _namedSymbol;
        private readonly INamedTypeSymbol _iNamedSymbol;

        public NamedTypeSymbolProviderTests()
        {
            _namedSymbol = new NamedSymbol();
            var compilation = CompilationHelper.LoadCompilation([_namedSymbol, new PropertyType()]);
            _iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol")!;

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(_iNamedSymbol, compilation);
        }

        [Test]
        public void ValidateCSharpType()
        {
            var type = _iNamedSymbol.GetCSharpType();
            Assert.AreEqual(_namedTypeSymbolProvider.Type, type);
        }

        [Test]
        public void ValidateModifiers()
        {
            var modifiers = _namedTypeSymbolProvider.DeclarationModifiers;
            Assert.IsTrue(modifiers.HasFlag(TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial | TypeSignatureModifiers.Class));
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
        public void ValidateBaseType()
        {
            Assert.IsNull(_namedTypeSymbolProvider.Type.BaseType!);
        }

        [Test]
        public void ValidateBaseTypeStruct()
        {
            var namedSymbol = new NamedSymbol(isStruct: true);
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol")!;

            var namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol, compilation);
            Assert.IsNull(namedTypeSymbolProvider.Type.BaseType!);
        }

        [Test]
        public void ValidateNamespaceNestedType()
        {
            // Get all members, including nested types
            var allMembers = _iNamedSymbol.GetMembers().OfType<INamedTypeSymbol>();
            INamedTypeSymbol? nestedType = null;

            // Iterate over the members and find the nested types
            foreach (var member in allMembers)
            {
                if (member.Kind == SymbolKind.NamedType && SymbolEqualityComparer.Default.Equals(member.ContainingSymbol, _iNamedSymbol))
                {
                    nestedType = member;
                    break;
                }
            }

            Assert.IsNotNull(nestedType, "Nested type not found in the named symbol.");
            var type = nestedType!.GetCSharpType();
            Assert.AreEqual("Sample.Models", type.Namespace);

            var fullName = type.FullyQualifiedName;
            Assert.AreEqual("Sample.Models.NamedSymbol.Foo", fullName);
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
                Assert.IsNotNull(actual.Description);
                Assert.AreEqual($"{expected.Description}.", actual.Description!.ToString()); // the writer adds a period
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
        [TestCase(typeof((List<PropertyType> Values, string Foo, int Bar)))]
        public void ValidatePropertyTypes(Type propertyType, bool isEnum = false)
        {
            // setup
            var namedSymbol = new NamedSymbol(propertyType);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

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
            Assert.IsNull(propertyCSharpType.BaseType);

            for (var i = 0; i < expectedType.Arguments.Count; i++)
            {
                Assert.AreEqual(expectedType.Arguments[i].Name, propertyCSharpType.Arguments[i].Name);
                Assert.AreEqual(expectedType.Arguments[i].IsNullable, propertyCSharpType.Arguments[i].IsNullable);
                Assert.IsNull(propertyCSharpType.Arguments[i].BaseType);
            }

            // validate the underlying types aren't nullable
            if (isNullable && expectedType.IsFrameworkType)
            {
                var underlyingType = propertyCSharpType.FrameworkType;
                Assert.IsTrue(Nullable.GetUnderlyingType(underlyingType) == null);
            }

        }

        [TestCaseSource(nameof(TestParametersTestCases))]
        public void ValidateParameters(Type parameterType, ValueExpression? expectedDefaultValue)
        {
            // setup
            var namedSymbol = new NamedSymbol(parameterType: parameterType, parameterDefaultValue: expectedDefaultValue);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            var method = _namedTypeSymbolProvider.Methods.FirstOrDefault(m => m.Signature.Name == "Method1");
            Assert.IsNotNull(method);

            var parameters = method!.Signature.Parameters;
            Assert.AreEqual(1, parameters.Count);

            var parameter = parameters[0];

            Type? nullableUnderlyingType = Nullable.GetUnderlyingType(parameterType);
            var parameterName = nullableUnderlyingType?.Name ?? parameterType.Name;
            bool isNullable = nullableUnderlyingType != null;
            bool isSystemType = parameterType.FullName!.StartsWith("System")
                && (!isNullable || nullableUnderlyingType?.Namespace?.StartsWith("System") == true);

            var expectedType = isSystemType
                ? new CSharpType(parameterType, isNullable)
                : new CSharpType(parameterName, parameterType.Namespace!, false, isNullable, null, [], false, false);

            Assert.AreEqual(expectedDefaultValue, parameter.DefaultValue);

            var parameterCsharpType = parameter!.Type;
            Assert.AreEqual(expectedType.Name, parameterCsharpType.Name);
            Assert.AreEqual(expectedType.IsNullable, parameterCsharpType.IsNullable);
            Assert.AreEqual(expectedType.IsList, parameterCsharpType.IsList);
            Assert.AreEqual(expectedType.Arguments.Count, parameterCsharpType.Arguments.Count);
            Assert.AreEqual(expectedType.IsCollection, parameterCsharpType.IsCollection);
            Assert.AreEqual(expectedType.IsFrameworkType, parameterCsharpType.IsFrameworkType);

            for (var i = 0; i < expectedType.Arguments.Count; i++)
            {
                Assert.AreEqual(expectedType.Arguments[i].Name, parameterCsharpType.Arguments[i].Name);
                Assert.AreEqual(expectedType.Arguments[i].IsNullable, parameterCsharpType.Arguments[i].IsNullable);
            }

            // validate the underlying types aren't nullable
            if (isNullable && expectedType.IsFrameworkType)
            {
                var underlyingType = parameterCsharpType.FrameworkType;
                Assert.IsTrue(Nullable.GetUnderlyingType(underlyingType) == null);
            }
        }

        [TestCase(true)]
        [TestCase(false)]
        public void ValidateParameterIsIn(bool isIn)
        {
            // setup
            var namedSymbol = new NamedSymbol(parameterIsIn: isIn);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            var method = _namedTypeSymbolProvider.Methods.FirstOrDefault(m => m.Signature.Name == "Method1");
            Assert.IsNotNull(method);

            var parameters = method!.Signature.Parameters;
            Assert.AreEqual(1, parameters.Count);

            var parameter = parameters[0];

            Assert.AreEqual(isIn, parameter.IsIn);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void ValidateParameterIsOut(bool isOut)
        {
            // setup
            var namedSymbol = new NamedSymbol(parameterIsOut: isOut);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            var method = _namedTypeSymbolProvider.Methods.FirstOrDefault(m => m.Signature.Name == "Method1");
            Assert.IsNotNull(method);

            var parameters = method!.Signature.Parameters;
            Assert.AreEqual(1, parameters.Count);

            var parameter = parameters[0];

            Assert.AreEqual(isOut, parameter.IsOut);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void ValidateParameterIsRef(bool isRef)
        {
            // setup
            var namedSymbol = new NamedSymbol(parameterIsRef: isRef);
            _namedSymbol = namedSymbol;
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            _namedTypeSymbolProvider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            var method = _namedTypeSymbolProvider.Methods.FirstOrDefault(m => m.Signature.Name == "Method1");
            Assert.IsNotNull(method);

            var parameters = method!.Signature.Parameters;
            Assert.AreEqual(1, parameters.Count);

            var parameter = parameters[0];

            Assert.AreEqual(isRef, parameter.IsRef);
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
                if (!string.IsNullOrEmpty(expected.Signature.Description?.ToString()))
                {
                    Assert.AreEqual($"{expected.Signature.Description}.", actual.Signature.Description?.ToString()); // the writer adds a period
                }
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

        [Test]
        public void ValidateEnumMemberInitializer()
        {
            var someEnumType = new TestEnumProvider();
            var namedSymbol = new NamedSymbol(
                propertyType: typeof(SomeEnum),
                initializeEnumProperty: true);
            var compilation = CompilationHelper.LoadCompilation([namedSymbol, someEnumType, new PropertyType()]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "NamedSymbol");

            var provider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            var property = provider.Properties.FirstOrDefault(p => p.Name == "P1");
            Assert.IsNotNull(property);

            // Validate that the property has an initialization expression
            Assert.IsInstanceOf<AutoPropertyBody>(property!.Body);
            var autoPropertyBody = property.Body as AutoPropertyBody;
            Assert.IsNotNull(autoPropertyBody);

            var initExpression = autoPropertyBody!.InitializationExpression;
            Assert.IsNotNull(initExpression);

            // Validate that the initialization expression is a MemberExpression for the enum value
            Assert.IsInstanceOf<MemberExpression>(initExpression);

            var memberExpression = initExpression as MemberExpression;
            Assert.IsNotNull(memberExpression);
            Assert.AreEqual("Foo", memberExpression!.MemberName);
        }

        [Test]
        public void ValidateEnumFieldsWithExplicitValues()
        {
            var enumProvider = new TestEnumWithValuesProvider();
            var compilation = CompilationHelper.LoadCompilation([enumProvider]);
            var iNamedSymbol = CompilationHelper.GetSymbol(compilation.Assembly.Modules.First().GlobalNamespace, "ServiceVersion");

            var provider = new NamedTypeSymbolProvider(iNamedSymbol!, compilation);

            // Validate that the enum has the expected fields
            var fields = provider.Fields.ToDictionary(f => f.Name);
            Assert.AreEqual(3, fields.Count);

            // Validate V7_2 = 1
            Assert.IsTrue(fields.ContainsKey("V7_2"));
            var v72Field = fields["V7_2"];
            Assert.IsNotNull(v72Field.InitializationValue);
            Assert.IsInstanceOf<LiteralExpression>(v72Field.InitializationValue);
            var v72Literal = v72Field.InitializationValue as LiteralExpression;
            Assert.AreEqual(1, v72Literal!.Literal);

            // Validate V7_3 = 2
            Assert.IsTrue(fields.ContainsKey("V7_3"));
            var v73Field = fields["V7_3"];
            Assert.IsNotNull(v73Field.InitializationValue);
            Assert.IsInstanceOf<LiteralExpression>(v73Field.InitializationValue);
            var v73Literal = v73Field.InitializationValue as LiteralExpression;
            Assert.AreEqual(2, v73Literal!.Literal);

            // Validate V7_4 = 3
            Assert.IsTrue(fields.ContainsKey("V7_4"));
            var v74Field = fields["V7_4"];
            Assert.IsNotNull(v74Field.InitializationValue);
            Assert.IsInstanceOf<LiteralExpression>(v74Field.InitializationValue);
            var v74Literal = v74Field.InitializationValue as LiteralExpression;
            Assert.AreEqual(3, v74Literal!.Literal);
        }

        public enum SomeEnum
        {
            Foo,
        }

        private class TestEnumProvider : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";
            protected override string BuildName() => "SomeEnum";
            protected override string BuildNamespace() => "Sample.Models";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum;

            protected override FieldProvider[] BuildFields()
            {
                return
                [
                    new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(int), "Foo", this, $"Foo"),
                ];
            }
        }

        private class TestEnumWithValuesProvider : TypeProvider
        {
            protected override string BuildRelativeFilePath() => ".";
            protected override string BuildName() => "ServiceVersion";
            protected override string BuildNamespace() => "Sample.Models";
            protected override TypeSignatureModifiers BuildDeclarationModifiers() => TypeSignatureModifiers.Public | TypeSignatureModifiers.Enum;

            protected override FieldProvider[] BuildFields()
            {
                return
                [
                    new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(int), "V7_2", this, $"The Key Vault API version 7.2", initializationValue: Literal(1)),
                    new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(int), "V7_3", this, $"The Key Vault API version 7.3", initializationValue: Literal(2)),
                    new FieldProvider(FieldModifiers.Public | FieldModifiers.Static, typeof(int), "V7_4", this, $"The Key Vault API version 7.4", initializationValue: Literal(3)),
                ];
            }
        }

        public static IEnumerable<TestCaseData> TestParametersTestCases
        {
            get
            {
                yield return new TestCaseData(typeof(int), Literal(2));
                yield return new TestCaseData(typeof(string), Literal("Foo"));
                yield return new TestCaseData(typeof(double), Literal(2.2));
                yield return new TestCaseData(typeof(double?), Literal(2.2));
                yield return new TestCaseData(typeof(float), Literal(2.2f));
                yield return new TestCaseData(typeof(float?), Literal(2.2f));
                yield return new TestCaseData(typeof(long), Long(2));
                yield return new TestCaseData(typeof(bool), False);
                yield return new TestCaseData(typeof(object), Default);
                yield return new TestCaseData(typeof(BinaryData), Default);
            }
        }
    }
}
