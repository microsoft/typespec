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
    public class SerializationCustomizationTests
    {
        [Test]
        public async Task CanChangePropertyName()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String))
            };

            var inputModel = InputFactory.Model("Model", properties: props, usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            // validate the methods use the custom member name
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }

        [Test]
        public async Task ReadOnlyMemPropertyType()
        {
            var props = new[]
            {
                InputFactory.Property("Prop1", InputFactory.Array(InputPrimitiveType.String)),
                InputFactory.Property("Prop2", InputFactory.Array(InputPrimitiveType.String))

            };

            var inputModel = InputFactory.Model("Model", properties: props, usage: InputModelTypeUsage.Json);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                inputModels: () => [inputModel],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = plugin.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);
            Assert.IsNotNull(serializationProvider);
            Assert.AreEqual(0, serializationProvider!.Fields.Count);

            // validate the methods use the custom member name
            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
