// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    public class ModelCustomizationTests
    {
        [Test]
        public async Task CanChangePropertyName()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("mockInputModel", properties: props, usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            // validate the methods use the custom member name
            var writer = new TypeProviderWriter(modelProvider);
            var file = writer.Write();
            var expected = Helpers.GetExpectedFromFile();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        // Validates that if a custom property is added to the base model, and the CodeGenSerialization attribute is used,
        // then the derived model includes the custom property in the serialization ctor.
        [Test]
        public async Task CanSerializeCustomPropertyFromBase()
        {
            var baseModel = InputFactory.Model(
                "baseModel",
                usage: InputModelTypeUsage.Input,
                properties: [InputFactory.Property("BaseProp", InputPrimitiveType.Int32, isRequired: true)]);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [
                    InputFactory.Model(
                        "mockInputModel",
                        // use Input so that we generate a public ctor
                        usage: InputModelTypeUsage.Input,
                        properties:
                        [
                            InputFactory.Property("OtherProp", InputPrimitiveType.Int32, isRequired: true),
                        ],
                        baseModel: baseModel),
                ],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelTypeProvider = plugin.Object.OutputLibrary.TypeProviders.FirstOrDefault(t => t is ModelProvider && t.Name == "MockInputModel");
            Assert.IsNotNull(modelTypeProvider);

            var baseModelTypeProvider = (modelTypeProvider as ModelProvider)?.BaseModelProvider;
            Assert.IsNotNull(baseModelTypeProvider);
            var customCodeView = baseModelTypeProvider!.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            Assert.IsNull(modelTypeProvider!.CustomCodeView);

            Assert.AreEqual(1, baseModelTypeProvider!.Properties.Count);
            Assert.AreEqual("BaseProp", baseModelTypeProvider.Properties[0].Name);
            Assert.AreEqual(new CSharpType(typeof(int)), baseModelTypeProvider.Properties[0].Type);
            Assert.AreEqual(1, customCodeView!.Properties.Count);
            Assert.AreEqual("Prop1", customCodeView.Properties[0].Name);

            Assert.AreEqual(1, modelTypeProvider.Properties.Count);
            Assert.AreEqual("OtherProp", modelTypeProvider.Properties[0].Name);

            // the custom property should exist in the full ctor
            var fullCtor = modelTypeProvider.Constructors.FirstOrDefault(c => c.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsNotNull(fullCtor);
            Assert.IsTrue(fullCtor!.Signature.Parameters.Any(p => p.Name == "prop1"));
        }
    }
}
