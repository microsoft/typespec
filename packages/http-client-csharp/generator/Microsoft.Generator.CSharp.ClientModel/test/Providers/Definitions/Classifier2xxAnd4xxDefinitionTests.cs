// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.Definitions
{
    public class Classifier2xxAnd4xxDefinitionTests
    {
        [TestCaseSource(nameof(GetTypeNamespaceTestCases))]
        public void TestGetTypeNamespace(string mockJson)
        {
            MockHelpers.LoadMockPlugin(configuration: mockJson);
            var inputClient = InputFactory.Client("TestClient");
            var restClientProvider = new ClientProvider(inputClient).RestClient;
            Assert.IsNotNull(restClientProvider);

            var classifier2xxAnd4xxDefinition = new Classifier2xxAnd4xxDefinition(restClientProvider);
            var result = classifier2xxAnd4xxDefinition.Type.Namespace;

            Assert.AreEqual(restClientProvider.Type.Namespace, result);
        }

        [Test]
        public async Task TestGetTypeCustomNamespace()
        {
            var inputClient = InputFactory.Client("TestClient");
            var plugin = await MockHelpers.LoadMockPluginAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the rest client provider
            var clientProvider = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);
            var restClientProvider = (clientProvider as ClientProvider)!.RestClient;
            Assert.IsNotNull(restClientProvider);

            var classifier2xxAnd4xxDefinition = new Classifier2xxAnd4xxDefinition(restClientProvider!);
            var result = classifier2xxAnd4xxDefinition.Type.Namespace;

            Assert.AreEqual(restClientProvider!.Type.Namespace, result);
        }

        public static IEnumerable<TestCaseData> GetTypeNamespaceTestCases
        {
            get
            {
                yield return new TestCaseData(@"{
                ""output-folder"": ""outputFolder"",
                ""library-name"": ""libraryName"",
                ""namespace"": ""testNamespace""
                }");
            }
        }
    }
}
