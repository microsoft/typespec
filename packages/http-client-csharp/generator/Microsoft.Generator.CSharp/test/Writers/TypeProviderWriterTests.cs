// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Input;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Providers;
using Moq;
using NUnit.Framework;
using System.Reflection;
using System.IO;
using System.Linq;
using Moq.Protected;

namespace Microsoft.Generator.CSharp.Tests.Writers
{
    internal class TypeProviderWriterTests
    {
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private TypeProviderWriter _expressionTypeProviderWriter;
        private GeneratorContext _generatorContext;
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        private readonly string _configFilePath = Path.Combine(AppContext.BaseDirectory, "Mocks");
        private FieldInfo? _mockPlugin;

        [SetUp]
        public void Setup()
        {
            var mockTypeProvider = new Mock<TypeProvider>() { CallBase = true };
            _expressionTypeProviderWriter = new MockExpressionTypeProviderWriter(mockTypeProvider.Object);

            _mockPlugin = typeof(CodeModelPlugin).GetField("_instance", BindingFlags.Static | BindingFlags.NonPublic);
            _generatorContext = new GeneratorContext(Configuration.Load(_configFilePath));
        }

        [TearDown]
        public void Teardown()
        {
            _mockPlugin?.SetValue(null, null);
        }

        // Tests that the Write method is successfully overridden.
        [Test]
        public void Write_Override()
        {
            Assert.That(_expressionTypeProviderWriter.Write, Throws.Exception.TypeOf<NotImplementedException>());
        }

        internal class MockExpressionTypeProviderWriter : TypeProviderWriter
        {
            public MockExpressionTypeProviderWriter(TypeProvider provider) : base(provider) { }

            public override CodeFile Write()
            {
                throw new NotImplementedException();
            }
        }

        [Test]
        public void TypeProviderWriter_WriteModel()
        {
            var properties = new List<InputModelProperty> { RequiredStringProperty, RequiredIntProperty };
            MockPluginSetValue(properties);

            var inputModel = new InputModelType("TestModel", null, "public", null, "Test model.", InputModelTypeUsage.RoundTrip,
                properties, null, new List<InputModelType>(), null, null, null, false);

            var modelProvider = new ModelProvider(inputModel);
            var codeFile = new TypeProviderWriter(modelProvider).Write();
            var result = codeFile.Content;

            var expected = Helpers.GetExpectedFromFile();

            Assert.AreEqual(expected, result);
        }

        [Test]
        public void TypeProviderWriter_WriteModelAsStruct()
        {
            var properties = new List<InputModelProperty> { RequiredStringProperty, RequiredIntProperty };
            MockPluginSetValue(properties);

            var inputModel = new InputModelType("TestModel", null, "public", null, "Test model.", InputModelTypeUsage.RoundTrip,
                properties, null, new List<InputModelType>(), null, null, null, modelAsStruct: true);

            var modelProvider = new ModelProvider(inputModel);
            var codeFile = new TypeProviderWriter(modelProvider).Write();
            var result = codeFile.Content;

            var expected = Helpers.GetExpectedFromFile();

            Assert.AreEqual(expected, result);
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
            InputArrayType => typeof(IList<string>),
            InputDictionaryType => typeof(IDictionary<string, string>),
            _ => throw new ArgumentException("Unsupported input type.")
        };

        private void MockPluginSetValue(List<InputModelProperty> properties)
        {
            var mockPluginInstance = new Mock<CodeModelPlugin>(_generatorContext) { };
            var mockTypeFactory = new Mock<TypeFactory>() { };

            mockTypeFactory.Protected().Setup<CSharpType>("CreateCSharpTypeCore", ItExpr.IsAny<InputType>()).Returns((InputType inputType) =>
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
        }

        // common usages definitions
        internal static readonly InputModelProperty RequiredStringProperty = new InputModelProperty("requiredString", "requiredString", "Required string, illustrating a reference type property.", InputPrimitiveType.String, true, false, false);

        internal static readonly InputModelProperty RequiredIntProperty = new InputModelProperty("requiredInt", "requiredInt", "Required int, illustrating a value type property.", InputPrimitiveType.Int32, true, false, false);

        internal static readonly InputModelProperty RequiredStringListProperty = new InputModelProperty("requiredStringList", "requiredStringList", "Required collection of strings, illustrating a collection of reference types.", new InputArrayType("requiredStringList", InputPrimitiveType.String, false), true, false, false);

        internal static readonly InputModelProperty RequiredIntListProperty = new InputModelProperty("requiredIntList", "requiredIntList", "Required collection of ints, illustrating a collection of value types.", new InputArrayType("requiredIntList", InputPrimitiveType.Int32, false), true, false, false);
    }
}
