// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public class RestClientProviderCustomizationTests
    {
        // Validates the client is generated using the correct namespace
        [Test]
        public async Task CanChangeClientNamespace()
        {
            var inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.Parameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputClient = InputFactory.Client("TestClient", operations: [inputOperation]);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);
            var restClientProvider = (clientProvider as ClientProvider)!.RestClient;
            Assert.IsNotNull(restClientProvider);

            var writer = new TypeProviderWriter(restClientProvider);
            var file = writer.Write();
            Assert.AreEqual(Helpers.GetExpectedFromFile(), file.Content);
        }
    }
}
