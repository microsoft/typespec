// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.Tests.Writers
{
    internal class TypeProviderWriterTests
    {
        public TypeProviderWriterTests()
        {
            MockHelpers.LoadMockPlugin();
        }

        // Tests that the Write method is successfully overridden.
        [Test]
        public void Write_Override()
        {
            var writer = new MockExpressionTypeProviderWriter(MockTypeProvider.Empty);
            Assert.That(writer.Write, Throws.Exception.TypeOf<NotImplementedException>());
        }

        private class MockExpressionTypeProviderWriter : TypeProviderWriter
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
            MockHelpers.LoadMockPlugin(createCSharpTypeCore: MockPluginSetValue(properties));

            var inputModel = new InputModelType("TestModel", string.Empty, "public", null, "Test model.", InputModelTypeUsage.RoundTrip,
                properties, null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, false);

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
            MockHelpers.LoadMockPlugin(createCSharpTypeCore: MockPluginSetValue(properties));

            var inputModel = new InputModelType("TestModel", string.Empty, "public", null, "Test model.", InputModelTypeUsage.RoundTrip,
                properties, null, new List<InputModelType>(), null, null, new Dictionary<string, InputModelType>(), null, modelAsStruct: true);

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

        private Func<InputType, CSharpType> MockPluginSetValue(List<InputModelProperty> properties)
        {
            return (InputType inputType) =>
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
            };
        }

        // common usages definitions
        internal static readonly InputModelProperty RequiredStringProperty = new InputModelProperty("requiredString", "requiredString", "Required string, illustrating a reference type property.", InputPrimitiveType.String, true, false, false);

        internal static readonly InputModelProperty RequiredIntProperty = new InputModelProperty("requiredInt", "requiredInt", "Required int, illustrating a value type property.", InputPrimitiveType.Int32, true, false, false);

        internal static readonly InputModelProperty RequiredStringListProperty = new InputModelProperty("requiredStringList", "requiredStringList", "Required collection of strings, illustrating a collection of reference types.", new InputArrayType("requiredStringList", "TypeSpec.Array", InputPrimitiveType.String), true, false, false);

        internal static readonly InputModelProperty RequiredIntListProperty = new InputModelProperty("requiredIntList", "requiredIntList", "Required collection of ints, illustrating a collection of value types.", new InputArrayType("requiredIntList", "TypeSpec.Array", InputPrimitiveType.Int32), true, false, false);
    }
}
