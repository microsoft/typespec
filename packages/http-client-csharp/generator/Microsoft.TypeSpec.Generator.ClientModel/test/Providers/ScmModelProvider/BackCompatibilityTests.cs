// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;
using ScmModel = Microsoft.TypeSpec.Generator.ClientModel.Providers.ScmModelProvider;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ScmModelProvider
{
    public class BackCompatibilityTests
    {
        [Test]
        public async Task BuildAttributesForBackCompatibilityDoesNotRestoreProxyAttribute()
        {
            var inputModel = InputFactory.Model("pet", properties:
            [
                InputFactory.Property("name", InputPrimitiveType.String, isRequired: true)
            ]);

            await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                lastContractCompilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var modelProvider = (ScmModel)ScmCodeModelGenerator.Instance.TypeFactory.CreateModel(inputModel)!;

            // The last contract declares a PersistableModelProxy attribute (owned by generation and
            // recomputed at generation time by the serialization provider) alongside a Description
            // attribute. Back-compat processing should only restore the non-proxy Description attribute.
            modelProvider.ProcessTypeForBackCompatibility();

            var writer = new TypeProviderWriter(modelProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
