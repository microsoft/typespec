// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using System.Reflection;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class EnumTypeProviderTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private GeneratorContext _generatorContext;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private readonly string _configFilePath = Path.Combine(AppContext.BaseDirectory, "mocks");
        private FieldInfo? _mockPlugin;

        [SetUp]
        public void Setup()
        {
            // initialize the mock singleton instance of the plugin
            _mockPlugin = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            _generatorContext = new GeneratorContext(Configuration.Load(_configFilePath));
        }

        [TearDown]
        public void Teardown()
        {
            _mockPlugin?.SetValue(null, null);
        }

        // Validates the int based fixed enum
        [TestCase]
        public void BuildEnumType_ValidateIntBasedFixedEnum()
        {
            var mockPluginInstance = new Mock<CodeModelPlugin>(_generatorContext);
            var mockTypeFactory = new Mock<TypeFactory>();
            mockTypeFactory.Setup(t => t.CreateCSharpType(It.IsAny<InputType>())).Returns(typeof(int));
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);

            var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.Int32), [new InputEnumTypeValue("One", 1, null), new InputEnumTypeValue("Two", 2, null)], false, false);
            var enumType = new EnumTypeProvider(input, null);
            var fields = enumType.Fields;

            Assert.AreEqual(2, fields.Count);
            Assert.AreEqual("One", fields[0].Name);
            Assert.AreEqual("Two", fields[1].Name);
            var value1 = fields[0].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value1);
            Assert.AreEqual(1, value1?.Literal);
            var value2 = fields[1].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value2);
            Assert.AreEqual(2, value2?.Literal);

            // int based fixed enum does not have serialization method therefore we only have one method
            var serializations = enumType.SerializationProviders;
            Assert.AreEqual(1, serializations.Count);
            Assert.AreEqual(1, serializations[0].Methods.Count);
        }

        // Validates the float based fixed enum
        [TestCase]
        public void BuildEnumType_ValidateFloatBasedFixedEnum()
        {
            var mockPluginInstance = new Mock<CodeModelPlugin>(_generatorContext);
            var mockTypeFactory = new Mock<TypeFactory>() { };
            mockTypeFactory.Setup(t => t.CreateCSharpType(It.IsAny<InputType>())).Returns(typeof(float));
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);

            var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.Float32), [new InputEnumTypeValue("One", 1f, null), new InputEnumTypeValue("Two", 2f, null)], false, false);
            var enumType = new EnumTypeProvider(input, null);
            var fields = enumType.Fields;

            Assert.AreEqual(2, fields.Count);
            Assert.AreEqual("One", fields[0].Name);
            Assert.AreEqual("Two", fields[1].Name);
            // non-int based enum does not initialization values.
            Assert.IsNull(fields[0].InitializationValue);
            Assert.IsNull(fields[1].InitializationValue);

            // int float fixed enum has serialization method and deserialization method therefore we only have two methods
            var serializations = enumType.SerializationProviders;
            Assert.AreEqual(1, serializations.Count);
            Assert.AreEqual(2, serializations[0].Methods.Count);
        }

        // Validates the string based fixed enum
        [TestCase]
        public void BuildEnumType_ValidateStringBasedFixedEnum()
        {
            var mockPluginInstance = new Mock<CodeModelPlugin>(_generatorContext);
            var mockTypeFactory = new Mock<TypeFactory>();
            mockTypeFactory.Setup(t => t.CreateCSharpType(It.IsAny<InputType>())).Returns(typeof(string));
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);

            var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.String), [new InputEnumTypeValue("One", "1", null), new InputEnumTypeValue("Two", "2", null)], false, false);
            var enumType = new EnumTypeProvider(input, null);
            var fields = enumType.Fields;

            Assert.AreEqual(2, fields.Count);
            Assert.AreEqual("One", fields[0].Name);
            Assert.AreEqual("Two", fields[1].Name);
            // non-int based enum does not initialization values.
            Assert.IsNull(fields[0].InitializationValue);
            Assert.IsNull(fields[1].InitializationValue);

            // int float fixed enum has serialization method and deserialization method therefore we only have two methods
            var serializations = enumType.SerializationProviders;
            Assert.AreEqual(1, serializations.Count);
            Assert.AreEqual(2, serializations[0].Methods.Count);
        }

        // Validates the int based extensible enum
        [TestCase]
        public void BuildEnumType_ValidateIntBasedExtensibleEnum()
        {
            var mockPluginInstance = new Mock<CodeModelPlugin>(_generatorContext);
            var mockTypeFactory = new Mock<TypeFactory>();
            mockTypeFactory.Setup(t => t.CreateCSharpType(It.IsAny<InputType>())).Returns(typeof(int));
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);

            var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.Int32), [new InputEnumTypeValue("One", 1, null), new InputEnumTypeValue("Two", 2, null)], true, false);
            var enumType = new EnumTypeProvider(input, null);
            var fields = enumType.Fields;
            var properties = enumType.Properties;

            // a private field + two values
            Assert.AreEqual(3, fields.Count);
            Assert.AreEqual("_value", fields[0].Name);
            Assert.AreEqual("OneValue", fields[1].Name);
            Assert.AreEqual("TwoValue", fields[2].Name);
            Assert.IsNull(fields[0].InitializationValue);
            var value1 = fields[1].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value1);
            Assert.AreEqual(1, value1?.Literal);
            var value2 = fields[2].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value2);
            Assert.AreEqual(2, value2?.Literal);

            // two properties
            Assert.AreEqual(2, properties.Count);
            Assert.AreEqual("One", properties[0].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[0].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[0].Body);
            var propertyValue1 = (properties[0].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue1);
            Assert.AreEqual("Two", properties[1].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[1].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[1].Body);
            var propertyValue2 = (properties[1].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue2);

            // extensible enums do not have serialization
            var serializations = enumType.SerializationProviders;
            Assert.AreEqual(0, serializations.Count);
        }

        // Validates the float based extensible enum
        [TestCase]
        public void BuildEnumType_ValidateFloatBasedExtensibleEnum()
        {
            var mockPluginInstance = new Mock<CodeModelPlugin>(_generatorContext);
            var mockTypeFactory = new Mock<TypeFactory>();
            mockTypeFactory.Setup(t => t.CreateCSharpType(It.IsAny<InputType>())).Returns(typeof(float));
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);

            var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.Float32), [new InputEnumTypeValue("One", 1f, null), new InputEnumTypeValue("Two", 2f, null)], true, false);
            var enumType = new EnumTypeProvider(input, null);
            var fields = enumType.Fields;
            var properties = enumType.Properties;

            // a private field + two values
            Assert.AreEqual(3, fields.Count);
            Assert.AreEqual("_value", fields[0].Name);
            Assert.AreEqual("OneValue", fields[1].Name);
            Assert.AreEqual("TwoValue", fields[2].Name);
            Assert.IsNull(fields[0].InitializationValue);
            var value1 = fields[1].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value1);
            Assert.AreEqual(1f, value1?.Literal);
            var value2 = fields[2].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value2);
            Assert.AreEqual(2f, value2?.Literal);

            // two properties
            Assert.AreEqual(2, properties.Count);
            Assert.AreEqual("One", properties[0].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[0].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[0].Body);
            var propertyValue1 = (properties[0].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue1);
            Assert.AreEqual("Two", properties[1].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[1].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[1].Body);
            var propertyValue2 = (properties[1].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue2);

            // extensible enums do not have serialization
            var serializations = enumType.SerializationProviders;
            Assert.AreEqual(0, serializations.Count);
        }

        // Validates the string based extensible enum
        [TestCase]
        public void BuildEnumType_ValidateStringBasedExtensibleEnum()
        {
            var mockPluginInstance = new Mock<CodeModelPlugin>(_generatorContext);
            var mockTypeFactory = new Mock<TypeFactory>();
            mockTypeFactory.Setup(t => t.CreateCSharpType(It.IsAny<InputType>())).Returns(typeof(string));
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);

            var input = new InputEnumType("mockInputEnum", "mockNamespace", "public", null, "The mock enum", InputModelTypeUsage.RoundTrip, new InputPrimitiveType(InputPrimitiveTypeKind.String), [new InputEnumTypeValue("One", "1", null), new InputEnumTypeValue("Two", "2", null)], true, false);
            var enumType = new EnumTypeProvider(input, null);
            var fields = enumType.Fields;
            var properties = enumType.Properties;

            // a private field + two values
            Assert.AreEqual(3, fields.Count);
            Assert.AreEqual("_value", fields[0].Name);
            Assert.AreEqual("OneValue", fields[1].Name);
            Assert.AreEqual("TwoValue", fields[2].Name);
            Assert.IsNull(fields[0].InitializationValue);
            var value1 = fields[1].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value1);
            Assert.AreEqual("1", value1?.Literal);
            var value2 = fields[2].InitializationValue as LiteralExpression;
            Assert.IsNotNull(value2);
            Assert.AreEqual("2", value2?.Literal);

            // two properties
            Assert.AreEqual(2, properties.Count);
            Assert.AreEqual("One", properties[0].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[0].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[0].Body);
            var propertyValue1 = (properties[0].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue1);
            Assert.AreEqual("Two", properties[1].Name);
            Assert.AreEqual(MethodSignatureModifiers.Public | MethodSignatureModifiers.Static, properties[1].Modifiers);
            Assert.IsInstanceOf<AutoPropertyBody>(properties[1].Body);
            var propertyValue2 = (properties[1].Body as AutoPropertyBody)?.InitializationExpression;
            Assert.IsNotNull(propertyValue2);

            // extensible enums do not have serialization
            var serializations = enumType.SerializationProviders;
            Assert.AreEqual(0, serializations.Count);
        }
    }
}
