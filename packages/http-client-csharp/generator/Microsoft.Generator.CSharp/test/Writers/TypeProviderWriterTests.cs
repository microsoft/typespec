// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
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
            var writer = new MockExpressionTypeProviderWriter(TestTypeProvider.Empty);
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

            var inputModel = InputFactory.Model("TestModel", properties: properties);

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

            var inputModel = InputFactory.Model("TestModel", properties: properties, modelAsStruct: true);

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
        internal static readonly InputModelProperty RequiredStringProperty = InputFactory.Property("requiredString", InputPrimitiveType.String, isRequired: true);

        internal static readonly InputModelProperty RequiredIntProperty = InputFactory.Property("requiredInt", InputPrimitiveType.Int32, isRequired: true);

        internal static readonly InputModelProperty RequiredStringListProperty = InputFactory.Property("requiredStringList", InputFactory.Array(InputPrimitiveType.String), isRequired: true);

        internal static readonly InputModelProperty RequiredIntListProperty = InputFactory.Property("requiredIntList", InputFactory.Array(InputPrimitiveType.Int32), isRequired: true);
    }
}
