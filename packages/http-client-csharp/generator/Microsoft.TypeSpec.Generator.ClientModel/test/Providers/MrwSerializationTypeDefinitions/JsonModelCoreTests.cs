// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class JsonModelCoreTests
    {
        public JsonModelCoreTests()
        {
            MockHelpers.LoadMockGenerator(createSerializationsCore: (inputType, typeProvider)
                => inputType is InputModelType modeltype ? [new MockMrwProvider(modeltype, (typeProvider as ModelProvider)!)] : []);
        }

        private class MockMrwProvider : MrwSerializationTypeDefinition
        {
            public MockMrwProvider(InputModelType inputModel, ModelProvider modelProvider)
                : base(inputModel, modelProvider)
            {
            }

            protected override MethodProvider[] BuildMethods()
            {
                return [.. base.BuildMethods().Where(m => m.Signature.Name.Equals("JsonModelWriteCore"))];
            }

            protected override FieldProvider[] BuildFields() => [];
            protected override ConstructorProvider[] BuildConstructors() => [];
        }

        [Test]
        public void KebabCaseSerializedName()
        {
            var inputModelProperty = InputFactory.Property("kebab-case", InputPrimitiveType.String, wireName: "kebab-case", isRequired: true);
            var inputModel = InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void SnakeCaseSerializedName()
        {
            var inputModelProperty = InputFactory.Property("snake_case", InputPrimitiveType.String, wireName: "snake_case", isRequired: true);
            var inputModel = InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void PascalCaseSerializedName()
        {
            var inputModelProperty = InputFactory.Property("PascalCase", InputPrimitiveType.String, wireName: "PascalCase", isRequired: true);
            var inputModel = InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void CamelCaseSerializedName()
        {
            var inputModelProperty = InputFactory.Property("camelCase", InputPrimitiveType.String, wireName: "camelCase", isRequired: true);
            var inputModel = InputFactory.Model("TestModel", properties: [inputModelProperty]);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void MultipleAdditionalProperties()
        {
            var inputModel = InputFactory.Model("TestModel", properties: [InputFactory.Property("color", InputPrimitiveType.String, isRequired: true)], additionalProperties: new InputUnionType("union", [InputPrimitiveType.String, InputPrimitiveType.Float64]));

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void BinaryDataAdditionalProperties()
        {
            var inputModel = InputFactory.Model("TestModel", properties: [InputFactory.Property("color", InputPrimitiveType.String, isRequired: true)], additionalProperties: InputPrimitiveType.Any);

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
