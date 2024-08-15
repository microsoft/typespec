// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class JsonModelCoreTests
    {
        public JsonModelCoreTests()
        {
            MockHelpers.LoadMockPlugin(createSerializationsCore: (inputType, typeProvider)
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
            var inputModel = new InputModelType(
                "TestModel",
                "TestModel",
                "public",
                null,
                "Test model.",
                InputModelTypeUsage.Input | InputModelTypeUsage.Output,
                [],
                null,
                [],
                null,
                null,
                new Dictionary<string, InputModelType>(),
                null,
                false);
            var inputModelProperty = new InputModelProperty(
                "kebab-case",
                "kebab-case",
                "A property with kebab-case name",
                InputPrimitiveType.String,
                true,
                false,
                false,
                inputModel);
            inputModel.Properties = [inputModelProperty];

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void SnakeCaseSerializedName()
        {
            var inputModel = new InputModelType(
                "TestModel",
                "TestModel",
                "public",
                null,
                "Test model.",
                InputModelTypeUsage.Input | InputModelTypeUsage.Output,
                [],
                null,
                [],
                null,
                null,
                new Dictionary<string, InputModelType>(),
                null,
                false);
            var inputModelProperty = new InputModelProperty(
                "snake_case",
                "snake_case",
                "A property with snake_case name",
                InputPrimitiveType.String,
                true,
                false,
                false,
                inputModel);
            inputModel.Properties = [inputModelProperty];

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void PascalCaseSerializedName()
        {
            var inputModel = new InputModelType(
                "TestModel",
                "TestModel",
                "public",
                null,
                "Test model.",
                InputModelTypeUsage.Input | InputModelTypeUsage.Output,
                [],
                null,
                [],
                null,
                null,
                new Dictionary<string, InputModelType>(),
                null,
                false);
            var inputModelProperty = new InputModelProperty(
                "PascalCase",
                "PascalCase",
                "A property with PascalCase name",
                InputPrimitiveType.String,
                true,
                false,
                false,
                inputModel);
            inputModel.Properties = [inputModelProperty];

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public void CamelCaseSerializedName()
        {
            var inputModel = new InputModelType(
                "TestModel",
                "TestModel",
                "public",
                null,
                "Test model.",
                InputModelTypeUsage.Input | InputModelTypeUsage.Output,
                [],
                null,
                [],
                null,
                null,
                new Dictionary<string, InputModelType>(),
                null,
                false);
            var inputModelProperty = new InputModelProperty(
                "camelCase",
                "camelCase",
                "A property with camelCase name",
                InputPrimitiveType.String,
                true,
                false,
                false,
                inputModel);
            inputModel.Properties = [inputModelProperty];

            var mrwProvider = new ModelProvider(inputModel).SerializationProviders.First();
            var writer = new TypeProviderWriter(mrwProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
