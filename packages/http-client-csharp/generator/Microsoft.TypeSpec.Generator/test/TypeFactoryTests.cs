// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.Tests
{
    public class TypeFactoryTests
    {
        [SetUp]
        public void SetUp()
        {
            MockHelpers.LoadMockGenerator();
        }

        [Test]
        public void ExtensibleStringEnumType()
        {
            // Updated to use StringEnum with collection expression for values
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                isExtensible: true,
                usage: InputModelTypeUsage.Input
            );
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, true, underlyingEnumType: typeof(string));

            var actual = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void ExtensibleStringNullableEnumType()
        {
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: true);
            var nullableInput = new InputNullableType(input);
            var expected = new CSharpType("SampleType", "Sample.Models", true, true, null, [], true, true, underlyingEnumType: typeof(string));

            var actual = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(nullableInput);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void ExtensibleStringEnumTypeProvider()
        {
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: true);
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, true, underlyingEnumType: typeof(string));

            var enumProvider = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);

            Assert.IsNotNull(enumProvider);
            Assert.AreEqual(expected, enumProvider!.Type);
        }

        [Test]
        public void FixedStringEnumType()
        {
            // Updated to use StringEnum with collection expression for values
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input
            );
            var expected = new CSharpType("SampleType", "Sample.Models", true, false, null, [], true, false, underlyingEnumType: typeof(string));

            var actual = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(actual);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public void CreateSameEnum()
        {
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input);
            var expected = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);

            var actual = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);

            Assert.IsTrue(ReferenceEquals(expected, actual));
        }

        [Test]
        public void CreateEnum_WithDeclaringType()
        {
            var input = InputFactory.StringEnum(
                "sampleType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input);
            var declaringType = new TestTypeProvider();

            var expected = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input, declaringType);
            var actual = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input, declaringType);
            Assert.IsTrue(ReferenceEquals(expected, actual));

            // Validate that a new type is created when the declaring type is different
            var declaringType2 = new TestTypeProvider();
            var expected2 = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input, declaringType2);
            var actual2 = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input, declaringType2);
            Assert.IsTrue(ReferenceEquals(expected2, actual2));
            Assert.IsFalse(ReferenceEquals(actual2, actual));

            // finally, validate that the type is not reused when the declaring type is null
            var expected3 = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);
            var actual3 = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);
            Assert.IsTrue(ReferenceEquals(expected3, actual3));
            Assert.IsFalse(ReferenceEquals(actual3, actual));
            Assert.IsFalse(ReferenceEquals(actual3, actual2));
        }

        [Test]
        public void IntSerializationFormat([Values(
            InputPrimitiveTypeKind.Integer,
            InputPrimitiveTypeKind.SafeInt,
            InputPrimitiveTypeKind.Int8,
            InputPrimitiveTypeKind.Int16,
            InputPrimitiveTypeKind.Int32,
            InputPrimitiveTypeKind.Int64,
            InputPrimitiveTypeKind.UInt8,
            InputPrimitiveTypeKind.UInt16,
            InputPrimitiveTypeKind.UInt32,
            InputPrimitiveTypeKind.UInt64
            )] InputPrimitiveTypeKind kind,
            [Values(null, "string")] string? encode)
        {
            var name = kind.ToString().ToLower();
            var input = new InputPrimitiveType(kind, name, $"TypeSpec.{name}", encode, null);

            Assert.AreEqual(encode == "string" ? SerializationFormat.Int_String : SerializationFormat.Default, CodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(input));
        }

        [Test]
        public void DurationIntegerWireTypeSerializationFormat([Values(
            InputPrimitiveTypeKind.Integer,
            InputPrimitiveTypeKind.SafeInt,
            InputPrimitiveTypeKind.Int8,
            InputPrimitiveTypeKind.Int16,
            InputPrimitiveTypeKind.Int32,
            InputPrimitiveTypeKind.Int64,
            InputPrimitiveTypeKind.UInt8,
            InputPrimitiveTypeKind.UInt16,
            InputPrimitiveTypeKind.UInt32,
            InputPrimitiveTypeKind.UInt64
            )] InputPrimitiveTypeKind wireKind)
        {
            var wireName = wireKind.ToString().ToLower();
            var wireType = new InputPrimitiveType(wireKind, wireName, $"TypeSpec.{wireName}", null, null);

            // Wire types whose .NET range fits in System.Int32 use the Int32 format;
            // larger integer kinds (Int64, UInt32, UInt64, SafeInt, unbounded Integer) use the Int64 format
            // so that ser/deser uses GetInt64 / Convert.ToInt64 instead of GetInt32 / Convert.ToInt32.
            var fitsInInt32 = wireKind is
                InputPrimitiveTypeKind.Int8 or InputPrimitiveTypeKind.Int16 or InputPrimitiveTypeKind.Int32
                or InputPrimitiveTypeKind.UInt8 or InputPrimitiveTypeKind.UInt16;
            var expectedMs = fitsInInt32 ? SerializationFormat.Duration_Milliseconds : SerializationFormat.Duration_Milliseconds_Int64;
            var expectedS = fitsInInt32 ? SerializationFormat.Duration_Seconds : SerializationFormat.Duration_Seconds_Int64;

            var ms = new InputDurationType(DurationKnownEncoding.Milliseconds, "duration", "TypeSpec.duration", wireType, null);
            Assert.AreEqual(expectedMs, CodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(ms));

            var s = new InputDurationType(DurationKnownEncoding.Seconds, "duration", "TypeSpec.duration", wireType, null);
            Assert.AreEqual(expectedS, CodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(s));
        }

        [Test]
        public void DurationFloatWireTypeSerializationFormat([Values(
            InputPrimitiveTypeKind.Float,
            InputPrimitiveTypeKind.Float32,
            InputPrimitiveTypeKind.Float64
            )] InputPrimitiveTypeKind wireKind)
        {
            var wireName = wireKind.ToString().ToLower();
            var wireType = new InputPrimitiveType(wireKind, wireName, $"TypeSpec.{wireName}", null, null);

            var expectedMs = wireKind == InputPrimitiveTypeKind.Float64
                ? SerializationFormat.Duration_Milliseconds_Double
                : SerializationFormat.Duration_Milliseconds_Float;
            var expectedS = wireKind == InputPrimitiveTypeKind.Float64
                ? SerializationFormat.Duration_Seconds_Double
                : SerializationFormat.Duration_Seconds_Float;

            var ms = new InputDurationType(DurationKnownEncoding.Milliseconds, "duration", "TypeSpec.duration", wireType, null);
            Assert.AreEqual(expectedMs, CodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(ms));

            var s = new InputDurationType(DurationKnownEncoding.Seconds, "duration", "TypeSpec.duration", wireType, null);
            Assert.AreEqual(expectedS, CodeModelGenerator.Instance.TypeFactory.GetSerializationFormat(s));
        }

        [TestCase(typeof(Guid))]
        [TestCase(typeof(IPAddress))]
        [TestCase(typeof(BinaryData))]
        [TestCase(typeof(Uri))]
        [TestCase(typeof(JsonElement))]
        public void CreatesFrameworkType(Type expectedType)
        {
            var factory = new TestTypeFactory();

            var actual = factory.InvokeCreateFrameworkType(expectedType.FullName!);
            Assert.AreEqual(expectedType, actual);
        }

        [TestCase("lowercase", "Lowercase")]
        [TestCase("lowercase.namespace", "Lowercase.Namespace")]
        [TestCase("lowercase.namespace.client", "Lowercase.Namespace.Client")]
        [TestCase("PascalCase", "PascalCase")]
        [TestCase("PascalCase.Namespace", "PascalCase.Namespace")]
        [TestCase("camelCase", "CamelCase")]
        [TestCase("camelCase.namespace", "CamelCase.Namespace")]
        [TestCase("kebab-case", "KebabCase")]
        [TestCase("kebab-case.namespace", "KebabCase.Namespace")]
        [TestCase("snake_case", "SnakeCase")]
        [TestCase("snake_case.namespace", "SnakeCase.Namespace")]
        [TestCase("mixed_case-namespace.example", "MixedCaseNamespace.Example")]
        [TestCase("number123", "Number123")]
        [TestCase("number123.namespace", "Number123.Namespace")]
        [TestCase("UPPERCASE", "UPPERCASE")]
        [TestCase("UPPERCASE.NAMESPACE", "UPPERCASE.NAMESPACE")]
        [TestCase("type.union", "_Type.Union")]
        [TestCase("type.array", "_Type._Array")]
        [TestCase("array.foo", "_Array.Foo")]
        [TestCase("enum.bar", "_Enum.Bar")]
        [TestCase("Type.Union", "_Type.Union")]
        [TestCase("Array.Foo", "_Array.Foo")]
        [TestCase("Enum.Bar", "_Enum.Bar")]
        public void GetCleanNameSpace_ConvertsToPascalCase(string input, string expected)
        {
            var actual = CodeModelGenerator.Instance.TypeFactory.GetCleanNameSpace(input);
            Assert.AreEqual(expected, actual);
        }

        [Test]
        public async Task CreateEnum_WithVisitor_ChangesNamespaceToModels()
        {
            // Arrange - Create a fixed enum
            var input = InputFactory.StringEnum(
                "TestEnum",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: false);

            await MockHelpers.LoadMockGeneratorAsync(inputEnumTypes: [input]);

            // Create a visitor that modifies the namespace
            var visitor = new NamespaceModifyingVisitor();
            CodeModelGenerator.Instance.AddVisitor(visitor);

            var enumProvider = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);

            Assert.IsNotNull(enumProvider);
            Assert.IsTrue(enumProvider!.Type.Namespace.EndsWith(".SomeOtherNamespace"));
            Assert.IsTrue(enumProvider is FixedEnumProvider);
            Assert.IsNotNull(enumProvider.ExtensibleEnumView);
            Assert.IsNull(enumProvider.CustomCodeView);
        }

        [Test]
        public async Task CreateEnum_WithCustomCodeAsExtensible_ReturnsExtensibleEnum()
        {
            // Arrange - Create a fixed enum in input
            var inputEnum = InputFactory.StringEnum(
                "CustomizedEnum",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: false);

            // Load compilation with custom code that changes the enum to extensible (struct)
            await MockHelpers.LoadMockGeneratorAsync(
                inputEnumTypes: [inputEnum],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Create a visitor that modifies the namespace
            var visitor = new NamespaceModifyingVisitor();
            CodeModelGenerator.Instance.AddVisitor(visitor);

            var result = CodeModelGenerator.Instance.TypeFactory.CreateEnum(inputEnum);

            Assert.IsNotNull(result);
            Assert.IsInstanceOf<ExtensibleEnumProvider>(result);
            Assert.IsTrue(result!.Type.Namespace.EndsWith(".SomeOtherNamespace"));
        }

        [Test]
        public void CreateEnum_FixedEnumWithoutVisitorsOrCustomCode_ReturnsFixedEnum()
        {
            // Arrange - Create a fixed enum
            var input = InputFactory.StringEnum(
                "PlainFixedEnum",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: false);

            // Act - Create enum without any visitors or custom code modifications
            var enumProvider = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);

            // Assert
            Assert.IsNotNull(enumProvider);
            Assert.IsInstanceOf<FixedEnumProvider>(enumProvider);
            Assert.IsFalse(enumProvider!.IsExtensible);
        }

        [Test]
        public void CreateEnum_ExtensibleEnumWithoutVisitorsOrCustomCode_ReturnsExtensibleEnum()
        {
            // Arrange - Create an extensible enum
            var input = InputFactory.StringEnum(
                "PlainExtensibleEnum",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: true);

            // Act - Create enum without any visitors or custom code modifications
            var enumProvider = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);

            // Assert
            Assert.IsNotNull(enumProvider);
            Assert.IsInstanceOf<ExtensibleEnumProvider>(enumProvider);
            Assert.IsTrue(enumProvider!.IsExtensible);
        }

        [TestCase(true)]
        [TestCase(false)]
        public void CreateEnum_ExternalEnum_ReturnsNull(bool isExtensible)
        {
            // An enum mapped to an existing external type (via @alternateType, surfaced as
            // InputType.External) must not be generated -- it mirrors CreateExternalModel for models.
            // Previously a provider was produced and threw "Not an enum type" while building its
            // serialization (ScmTypeFactory.CreateExtensibleEnumSerializations -> UnderlyingEnumType).
            var input = InputFactory.StringEnum(
                "ExternalToolType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: isExtensible,
                external: new InputExternalTypeMetadata("System.Uri", null, null));

            var enumProvider = CodeModelGenerator.Instance.TypeFactory.CreateEnum(input);

            Assert.IsNull(enumProvider);
        }

        [Test]
        public void CreateCSharpType_ExternalEnum_ResolvesToExternalFrameworkType()
        {
            // Although no provider is generated for an external enum, references to it must still
            // resolve to the external framework type so consumers (properties, parameters) compile.
            var input = InputFactory.StringEnum(
                "ExternalToolType",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: true,
                external: new InputExternalTypeMetadata("System.Uri", null, null));

            var type = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(type);
            Assert.IsTrue(type!.IsFrameworkType);
            Assert.AreEqual(typeof(Uri), type.FrameworkType);
        }

        [Test]
        public void CreateCSharpType_ExternalExtensibleStringEnum_PreservesEnumSemantics()
        {
            // A referenced extensible enum is implemented as a value-type struct, so reflection does not
            // report it as an enum. The resolved external type must still carry enum semantics (underlying
            // type + struct) so serialization emits inline construction instead of a broken model read.
            var input = InputFactory.StringEnum(
                "ExternalKind",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: true,
                external: new InputExternalTypeMetadata("System.Guid", null, null));

            var type = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(type);
            Assert.IsTrue(type!.IsFrameworkType);
            Assert.AreEqual(typeof(Guid), type.FrameworkType);
            Assert.IsTrue(type.IsEnum);
            Assert.IsTrue(type.IsStruct);
            Assert.AreEqual(typeof(string), type.UnderlyingEnumType);
        }

        [Test]
        public void CreateCSharpType_ExternalExtensibleInt32Enum_PreservesEnumSemantics()
        {
            var input = InputFactory.Int32Enum(
                "ExternalKind",
                [("value1", 1), ("value2", 2)],
                usage: InputModelTypeUsage.Input,
                isExtensible: true,
                external: new InputExternalTypeMetadata("System.Guid", null, null));

            var type = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(type);
            Assert.IsTrue(type!.IsEnum);
            Assert.IsTrue(type.IsStruct);
            Assert.AreEqual(typeof(int), type.UnderlyingEnumType);
        }

        [Test]
        public void CreateCSharpType_ExternalFixedEnum_DoesNotForceEnumSemantics()
        {
            // Fixed (non-extensible) external enums are left untouched; they resolve to their external
            // framework type as-is (which, for a real .NET enum, already reports enum semantics).
            var input = InputFactory.StringEnum(
                "ExternalKind",
                [("value1", "value1"), ("value2", "value2")],
                usage: InputModelTypeUsage.Input,
                isExtensible: false,
                external: new InputExternalTypeMetadata("System.Uri", null, null));

            var type = CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(input);

            Assert.IsNotNull(type);
            Assert.IsTrue(type!.IsFrameworkType);
            Assert.AreEqual(typeof(Uri), type.FrameworkType);
            Assert.IsFalse(type.IsEnum);
        }

        [Test]
        public void CreateCSharpType_SelfReferencingModel_DoesNotThrow()
        {
            var selfRefModel = InputFactory.Model("QueryFilter");
            var isReentrant = false;

            MockHelpers.LoadMockGenerator(createCSharpTypeCore: (InputType inputType) =>
            {
                if (inputType == selfRefModel && !isReentrant)
                {
                    isReentrant = true;
                    // Simulate the re-entrant call that occurs with self-referencing models
                    // (e.g., QueryFilter with property and: QueryFilter[]).
                    // CreateCSharpTypeCore -> CreateModel -> BuildProperties -> CreateCSharpType(same model)
                    CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(selfRefModel);
                }
                return typeof(object);
            });

            // Before the fix, this would throw ArgumentException:
            // "An item with the same key has already been added"
            Assert.DoesNotThrow(() => CodeModelGenerator.Instance.TypeFactory.CreateCSharpType(selfRefModel));
        }

        /// <summary>
        /// Test visitor that modifies enum namespaces to end with ".Models"
        /// </summary>
        private class NamespaceModifyingVisitor : LibraryVisitor
        {
            protected internal override EnumProvider? PreVisitEnum(InputEnumType enumType, EnumProvider? type)
            {
                if (type == null)
                {
                    return type;
                }

                // Create a new enum provider with modified namespace
                // replace ".Models" with ".SomeOtherNamespace"
                var updatedNamespace = type.Type.Namespace.Replace(".Models", ".SomeOtherNamespace");
                type.Update(@namespace: updatedNamespace);

                return type;
            }
        }
    }
}
