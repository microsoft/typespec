// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ClientProviders
{
    public class RestClientProviderCustomizationTests
    {
        // Validates the client is generated using the correct namespace
        [Test]
        public async Task CanChangeClientNamespace()
        {
            var inputClient = InputFactory.Client("TestClient");
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);
            var restClientProvider = (clientProvider as ClientProvider)!.RestClient;
            Assert.IsNotNull(restClientProvider);

            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
