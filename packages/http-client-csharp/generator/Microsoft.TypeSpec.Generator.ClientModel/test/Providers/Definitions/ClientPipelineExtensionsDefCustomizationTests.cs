// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.Definitions
{
    public class ClientPipelineExtensionsDefCustomizationTests
    {
        [Test]
        public async Task CanReplaceMethod()
        {
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the extension definition
            var definition = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientPipelineExtensionsDefinition);
            Assert.IsNotNull(definition);

            // The definitions should not have the custom method
            var definitionMethods = definition!.Methods;
            Assert.AreEqual(3, definitionMethods.Count);
            Assert.IsFalse(definitionMethods.Any(m => m.Signature.Name == "ProcessMessageAsync"));

            // The custom code view should contain the method
            var customCodeView = definition.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            var customMethods = customCodeView!.Methods;
            Assert.AreEqual(1, customMethods.Count);
            Assert.AreEqual("ProcessMessageAsync", customMethods[0].Signature.Name);
        }
    }
}
