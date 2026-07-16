// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.MrwSerializationTypeDefinitions
{
    internal class BackCompatibilityTests
    {
        [Test]
        public async Task BuildAttributesForBackCompatibilityDoesNotRestoreProxyAttribute()
        {
            var inputModel = InputFactory.Model("pet", properties:
            [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
            ]);

            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ModelProvider);
            var serializationProvider = modelProvider.SerializationProviders.Single(t => t is MrwSerializationTypeDefinition);

            // The last contract declares a PersistableModelProxy attribute (owned by generation and
            // recomputed at generation time) alongside a Description attribute. Back-compat processing
            // should only restore the non-proxy Description attribute.
            serializationProvider.ProcessTypeForBackCompatibility();

            var writer = new TypeProviderWriter(serializationProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
