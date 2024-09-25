// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderCustomizationTests
    {
        [Test]
        public async Task CanReplaceOpMethod()
        {
            var inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.Parameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputClient = InputFactory.Client("TestClient", operations: [inputOperation]);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the client provider
            var clientProvider = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);

            // The client provider method should not have a protocol method
            var clientProviderMethods = clientProvider!.Methods;
            Assert.AreEqual(3, clientProviderMethods.Count);

            bool hasBinaryContentParameter = clientProviderMethods
                .Any(m => m.Signature.Name == "HelloAgain" && m.Signature.Parameters
                    .Any(p => p.Type.Equals(typeof(BinaryContent))));
            Assert.IsFalse(hasBinaryContentParameter);

            // The custom code view should contain the method
            var customCodeView = clientProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            var customMethods = customCodeView!.Methods;
            Assert.AreEqual(1, customMethods.Count);
            Assert.AreEqual("HelloAgain", customMethods[0].Signature.Name);
            Assert.IsNull(customMethods[0].BodyExpression);
            Assert.AreEqual(string.Empty, customMethods[0].BodyStatements!.ToDisplayString());

        }
    }
}
