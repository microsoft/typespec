// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.Generator.CSharp.Input;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class ModelTypeProviderTests
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

        // Validates that the property body's setter is correctly set based on the property type
        [TestCaseSource(nameof(BuildProperties_ValidatePropertySettersTestCases))]
        public void BuildProperties_ValidatePropertySetters(InputModelProperty inputModelProperty, CSharpType type, bool hasSetter)
        {
            var mockPluginInstance = new Mock<CodeModelPlugin>(_generatorContext) { };
            var mockTypeFactory = new Mock<TypeFactory>() { };
            mockTypeFactory.Setup(t => t.CreateCSharpType(It.IsAny<InputType>())).Returns(type);
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);

            var props = new[]
            {
                inputModelProperty
            };

            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, props, null, new List<InputModelType>(), null, null, null, false);
            var modelTypeProvider = new ModelTypeProvider(inputModel, null);
            var properties = modelTypeProvider.Properties;

            Assert.IsNotNull(properties);
            Assert.AreEqual(1, properties.Count);

            // validate the setter
            var prop1 = properties[0];
            Assert.IsNotNull(prop1);

            var autoPropertyBody = prop1.PropertyBody as AutoPropertyBody;
            Assert.IsNotNull(autoPropertyBody);
            Assert.AreEqual(hasSetter, autoPropertyBody?.HasSetter);
        }

        // Validates that the property description string is constructed correctly based on the property type
        [TestCaseSource(nameof(BuildPropertyDescriptionTestCases))]
        public void BuildPropertyDescription(InputModelProperty inputModelProperty, CSharpType type)
        {
            var mockPluginInstance = new Mock<CodeModelPlugin>(_generatorContext) { };
            var mockTypeFactory = new Mock<TypeFactory>() { };
            mockTypeFactory.Setup(t => t.CreateCSharpType(It.IsAny<InputType>())).Returns(type);
            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);

            var props = new[]
            {
                inputModelProperty
            };

            var inputModel = new InputModelType("mockInputModel", "mockNamespace", "public", null, null, InputModelTypeUsage.RoundTrip, props, null, new List<InputModelType>(), null, null, null, false);
            var modelTypeProvider = new ModelTypeProvider(inputModel, null);
            var propertyDescription = modelTypeProvider.BuildPropertyDescription(inputModelProperty, type, SerializationFormat.Default, false);

            Assert.IsFalse(propertyDescription.IsNullOrEmpty());
            if (type.ContainsBinaryData)
            {
                Assert.IsTrue(propertyDescription.ToString().Contains("Examples:"));
            }
        }

        // Validates that the summary description string is constructed correctly for several types
        [Test]
        public void TestGetUnionTypesDescriptions()
        {
            var dateTime = new DateTimeOffset(1, 2, 3, 4, 5, 6, TimeSpan.Zero);

            var unionItems = new List<CSharpType>
            {
                new CSharpType(typeof(bool), false),
                new CSharpType(typeof(int), false),
                new CSharpType(typeof(IDictionary<,>), false, typeof(string), new CSharpType(typeof(int))),
                CSharpType.FromLiteral(new CSharpType(typeof(int), false), 21),
                CSharpType.FromLiteral(new CSharpType(typeof(string), false), "test"),
                CSharpType.FromLiteral(new CSharpType(typeof(bool), false), true),
                CSharpType.FromLiteral(new CSharpType(typeof(DateTimeOffset), false), dateTime)
            };

            IReadOnlyList<FormattableString> descriptions = ModelTypeProvider.GetUnionTypesDescriptions(unionItems);

            Assert.AreEqual(7, descriptions.Count);

            var codeWriter = new CodeWriter();
            codeWriter.AppendXmlDocumentation($"<test>", $"</test>", descriptions.ToList().Join("\n"));
            var actual = codeWriter.ToString(false);

            var expected = string.Join("\n",
                "/// <test>",
                "/// <description><see cref=\"bool\"/></description>",
                "/// <description><see cref=\"int\"/></description>",
                "/// <description><see cref=\"global::System.Collections.Generic.IDictionary{TKey,TValue}\"/> where <c>TKey</c> is of type <see cref=\"string\"/>, where <c>TValue</c> is of type <see cref=\"int\"/></description>",
                "/// <description>21</description>",
                "/// <description>\"test\"</description>",
                "/// <description>True</description>",
                $"/// <description>{dateTime}</description>",
                "/// </test>") + "\n";

            Assert.AreEqual(expected, actual);
        }

        public static IEnumerable<TestCaseData> BuildProperties_ValidatePropertySettersTestCases
        {
            get
            {
                // list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputList("mockProp", new InputPrimitiveType(InputTypeKind.String, false), false, false), false, false, false),
                    new CSharpType(typeof(IList<string>)),
                    false);
                // read only list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputList("mockProp", new InputPrimitiveType(InputTypeKind.String, false), false, false), false, true, false),
                    new CSharpType(typeof(IReadOnlyList<string>)),
                    false);
                // nullable list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputList("mockProp", new InputPrimitiveType(InputTypeKind.String, false), false, false), false, false, false),
                    new CSharpType(typeof(IList<string>), true),
                    true);
                // dictionary property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionary("mockProp", new InputPrimitiveType(InputTypeKind.String, false), new InputPrimitiveType(InputTypeKind.String, false), false), false, false, false),
                    new CSharpType(typeof(IDictionary<string, string>)),
                    false);
                // nullable dictionary property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionary("mockProp", new InputPrimitiveType(InputTypeKind.String, false), new InputPrimitiveType(InputTypeKind.String, false), false), false, false, false),
                    new CSharpType(typeof(IDictionary<string, string>), true),
                    true);
                // primitive type property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputPrimitiveType(InputTypeKind.String, false), false, false, false),
                    new CSharpType(typeof(string)),
                    true);
                // read only primitive type property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputPrimitiveType(InputTypeKind.String, false), false, true, false),
                    new CSharpType(typeof(string)),
                    false);
                // readonlymemory property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputList("mockProp", new InputPrimitiveType(InputTypeKind.String, false), true, false), false, false, false),
                    new CSharpType(typeof(ReadOnlyMemory<>)),
                    true);
            }
        }

        public static IEnumerable<TestCaseData> BuildPropertyDescriptionTestCases
        {
            get
            {
                // list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputList("mockProp", new InputPrimitiveType(InputTypeKind.String, false), false, false), false, false, false),
                    new CSharpType(typeof(IList<string>)));
                // list of binary data property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputList("mockProp", new InputPrimitiveType(InputTypeKind.BinaryData, false), false, false), false, true, false),
                    new CSharpType(typeof(IReadOnlyList<BinaryData>)));
                // dictionary property with binary data value
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionary("mockProp", new InputPrimitiveType(InputTypeKind.String, false), new InputPrimitiveType(InputTypeKind.BinaryData, false), false), false, false, false),
                    new CSharpType(typeof(IDictionary<string, BinaryData>)));
                // nullable dictionary property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionary("mockProp", new InputPrimitiveType(InputTypeKind.String, false), new InputPrimitiveType(InputTypeKind.String, false), false), false, false, false),
                    new CSharpType(typeof(IDictionary<string, string>), true));
                // primitive type property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputPrimitiveType(InputTypeKind.String, false), false, false, false),
                    new CSharpType(typeof(string)));
                // binary data property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputPrimitiveType(InputTypeKind.BinaryData, false), false, true, false),
                    new CSharpType(typeof(BinaryData)));
            }
        }
    }
}
