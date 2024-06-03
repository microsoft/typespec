// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests
{
    public class ModelTypeProviderTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private GeneratorContext _generatorContext;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private readonly string _configFilePath = Path.Combine(AppContext.BaseDirectory, "Mocks");
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
            var modelTypeProvider = new ModelProvider(inputModel);
            var properties = modelTypeProvider.Properties;

            Assert.IsNotNull(properties);
            Assert.AreEqual(1, properties.Count);

            // validate the setter
            var prop1 = properties[0];
            Assert.IsNotNull(prop1);

            var autoPropertyBody = prop1.Body as AutoPropertyBody;
            Assert.IsNotNull(autoPropertyBody);
            Assert.AreEqual(hasSetter, autoPropertyBody?.HasSetter);
        }

        public static IEnumerable<TestCaseData> BuildProperties_ValidatePropertySettersTestCases
        {
            get
            {
                // list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputListType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false, false), false, false, false),
                    new CSharpType(typeof(IList<string>)),
                    false);
                // read only list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputListType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false, false), false, true, false),
                    new CSharpType(typeof(IReadOnlyList<string>)),
                    false);
                // nullable list property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputListType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false, false), false, false, false),
                    new CSharpType(typeof(IList<string>), true),
                    true);
                // dictionary property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionaryType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false), false, false, false),
                    new CSharpType(typeof(IDictionary<string, string>)),
                    false);
                // nullable dictionary property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputDictionaryType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false), false, false, false),
                    new CSharpType(typeof(IDictionary<string, string>), true),
                    true);
                // primitive type property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false, false, false),
                    new CSharpType(typeof(string)),
                    true);
                // read only primitive type property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false, true, false),
                    new CSharpType(typeof(string)),
                    false);
                // readonlymemory property
                yield return new TestCaseData(
                    new InputModelProperty("prop1", "prop1", "public", new InputListType("mockProp", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), true, false), false, false, false),
                    new CSharpType(typeof(ReadOnlyMemory<>)),
                    true);
            }
        }

        private CSharpType GetCSharpType(InputType type) => type switch
        {
            InputPrimitiveType primitiveType => primitiveType.Kind switch
            {
                InputPrimitiveTypeKind.String => typeof(string),
                InputPrimitiveTypeKind.Int32 => typeof(int),
                InputPrimitiveTypeKind.Any => typeof(BinaryData),
                _ => throw new ArgumentException("Unsupported input type.")
            },
            InputListType => typeof(IList<string>),
            InputDictionaryType => typeof(IDictionary<string, string>),
            _ => throw new ArgumentException("Unsupported input type.")
        };

        [Test]
        public void BuildConstructor_ValidateConstructors()
        {
            var mockPluginInstance = new Mock<CodeModelPlugin>(_generatorContext) { };
            var mockTypeFactory = new Mock<TypeFactory>() { };

            var properties = new List<InputModelProperty>{
                    new InputModelProperty("requiredString", "requiredString", "", InputPrimitiveType.String, true, false, false),
                    new InputModelProperty("OptionalInt", "optionalInt", "", InputPrimitiveType.Int32, false, false, false),
                    new InputModelProperty("requiredCollection", "requiredCollection", "", new InputListType("List", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false, false), true, false, false),
                    new InputModelProperty("requiredDictionary", "requiredDictionary", "", new InputDictionaryType("Dictionary", new InputPrimitiveType(InputPrimitiveTypeKind.String, false), new InputPrimitiveType(InputPrimitiveTypeKind.String, false), false), true, false, false),
                    new InputModelProperty("optionalUnknown", "optional unknown", "", InputPrimitiveType.Any, false, false, false),
             };

            mockTypeFactory.Setup(t => t.CreateCSharpType(It.IsAny<InputType>())).Returns((InputType inputType) =>
            {
                // Lookup the inputType in the list and return the corresponding CSharpType
                var inputModelProperty = properties.Where(prop => prop.Type.Name == inputType.Name).FirstOrDefault();
                if (inputModelProperty != null)
                {
                    return GetCSharpType(inputModelProperty.Type);
                }
                else
                {
                    throw new ArgumentException("Unsupported input type.");
                }
            });

            mockPluginInstance.SetupGet(p => p.TypeFactory).Returns(mockTypeFactory.Object);
            _mockPlugin?.SetValue(null, mockPluginInstance.Object);

            var inputModel = new InputModelType("TestModel", "TestModel", "public", null, "Test model.", InputModelTypeUsage.RoundTrip, properties, null, Array.Empty<InputModelType>(), null, null, null, false);

            var modelTypeProvider = new ModelProvider(inputModel);
            var ctors = modelTypeProvider.Constructors;
            Assert.IsNotNull(ctors);

            Assert.AreEqual(1, ctors.Count);

            var initializationCtor = ctors[0];
            Assert.AreEqual(MethodSignatureModifiers.Public, initializationCtor.Signature.Modifiers);
            Assert.AreEqual(3, initializationCtor.Signature.Parameters.Count);
        }
    }
}
