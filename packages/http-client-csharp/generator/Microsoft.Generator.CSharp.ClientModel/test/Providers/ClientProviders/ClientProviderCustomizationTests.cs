// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderCustomizationTests
    {
        [Test]
        public async Task CanAddMethod()
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

            var clientProviderMethods = clientProvider!.Methods;
            Assert.AreEqual(4, clientProviderMethods.Count);
            Assert.IsFalse(clientProviderMethods.Any(m => m.Signature.Name == "NewMethod"));

            // The custom code view should contain the method
            var customCodeView = clientProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            var customMethods = customCodeView!.Methods;
            Assert.AreEqual(1, customMethods.Count);
            Assert.AreEqual("NewMethod", customMethods[0].Signature.Name);
            Assert.AreEqual(customMethods[0].Signature.Parameters.Count, 2);
            Assert.IsNull(customMethods[0].BodyExpression);
            Assert.AreEqual(string.Empty, customMethods[0].BodyStatements!.ToDisplayString());
        }

        [Test]
        public async Task CanAddMultipleMethods()
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

            var clientProviderMethods = clientProvider!.Methods;
            Assert.AreEqual(4, clientProviderMethods.Count);

            // The custom code view should contain the method
            var customCodeView = clientProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            var customMethods = customCodeView!.Methods;
            Assert.AreEqual(4, customMethods.Count);
            Assert.AreEqual("NewMethodOne", customMethods[0].Signature.Name);
            Assert.AreEqual(customMethods[0].Signature.Parameters.Count, 2);
            Assert.AreEqual("NewMethodTwo", customMethods[1].Signature.Name);
            Assert.AreEqual(customMethods[1].Signature.Parameters.Count, 0);
            Assert.AreEqual("NewMethodThree", customMethods[2].Signature.Name);
            Assert.AreEqual(customMethods[2].Signature.Parameters.Count, 1);
            Assert.AreEqual("NewMethodFour", customMethods[3].Signature.Name);
            Assert.AreEqual(customMethods[3].Signature.Parameters.Count, 1);
        }

        // Validates that the custom method is added when the method has the same name as an existing method but different parameters
        [Test]
        public async Task CanAddMethodSameName()
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

            var clientProviderMethods = clientProvider!.Methods;
            Assert.AreEqual(4, clientProviderMethods.Count);

            var helloAgainMethod = clientProviderMethods.FirstOrDefault(m
                => m.Signature.Name == "HelloAgain" && m.Signature.Parameters.Count > 0 && m.Signature.Parameters[0].Name == "p1");
            Assert.IsNotNull(helloAgainMethod);
            Assert.AreEqual(1, helloAgainMethod!.Signature.Parameters.Count);

            // The custom code view should contain the method
            var customCodeView = clientProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView);
            var customMethods = customCodeView!.Methods;
            Assert.AreEqual(1, customMethods.Count);
            Assert.AreEqual("HelloAgain", customMethods[0].Signature.Name);
            Assert.AreEqual(customMethods[0].Signature.Parameters.Count, 2);
            Assert.IsNull(customMethods[0].BodyExpression);
            Assert.AreEqual(string.Empty, customMethods[0].BodyStatements!.ToDisplayString());
        }

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

        // Validates that a method with a struct parameter can be replaced
        [TestCase(true)]
        [TestCase(false)]
        public async Task CanReplaceStructMethod(bool isStructCustomized)
        {
            var inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.Parameter("p1", InputFactory.Model("myStruct", modelAsStruct: true), isRequired: false)
            ]);
            var inputClient = InputFactory.Client("TestClient", operations: [inputOperation]);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(isStructCustomized.ToString()));

            // Find the client provider
            var clientProvider = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);

            // The client provider method should not have a protocol method
            var clientProviderMethods = clientProvider!.Methods;
            Assert.AreEqual(3, clientProviderMethods.Count);

            bool hasStructParam = clientProviderMethods
                .Any(m => m.Signature.Name == "HelloAgain" && m.Signature.Parameters
                    .Any(p => p.Type.IsStruct));
            Assert.IsFalse(hasStructParam);

            // The custom code view should contain the method
            var customCodeView = clientProvider.CustomCodeView;
            Assert.IsNotNull(customCodeView);

            var customMethods = customCodeView!.Methods;
            Assert.AreEqual(1, customMethods.Count);
            Assert.AreEqual("HelloAgain", customMethods[0].Signature.Name);

            var customMethodParams = customMethods[0].Signature.Parameters;
            Assert.AreEqual(1, customMethodParams.Count);
            Assert.AreEqual("p1", customMethodParams[0].Name);
            Assert.AreEqual("MyStruct", customMethodParams[0].Type.Name);
            Assert.AreEqual(isStructCustomized ? "Sample.TestClient" : string.Empty, customMethodParams[0].Type.Namespace);

            Assert.IsTrue(customMethodParams[0].Type.IsStruct);
            Assert.IsTrue(customMethodParams[0].Type.IsNullable);
        }

        [Test]
        public async Task CanChangeClientAccessibility()
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
            Assert.IsTrue(clientProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));

            // Find the REST client provider
            var restClientProvider = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is RestClientProvider);
            Assert.IsNotNull(restClientProvider);
            Assert.IsTrue(restClientProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));

            // Find the client options provider
            var clientOptionsProvider = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientOptionsProvider);
            Assert.IsNotNull(clientOptionsProvider);
            // The client options were not customized
            Assert.IsTrue(clientOptionsProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));

            // The docs should not be generated for the methods as the client is internal
            foreach (var method in clientProvider.Methods)
            {
                Assert.IsNull(method.XmlDocs);
            }
        }

        [Test]
        public async Task CanChangeClientOptionsAccessibility()
        {
            var inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.Parameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputClient = InputFactory.Client("TestClient", operations: [inputOperation]);
            var plugin = await MockHelpers.LoadMockPluginAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the client provider - we customize both to be internal because otherwise the build would fail as the client options
            // would be less accessible than the client
            var clientProvider = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);
            Assert.IsTrue(clientProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));

            // Find the REST client provider
            var restClientProvider = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is RestClientProvider);
            Assert.IsNotNull(restClientProvider);
            Assert.IsTrue(restClientProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));

            // Find the client options provider
            var clientOptionsProvider = plugin.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientOptionsProvider);
            Assert.IsNotNull(clientOptionsProvider);
            // The client options were not customized
            Assert.IsTrue(clientOptionsProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));

            // The docs should not be generated for the methods as the client is internal
            foreach (var method in clientProvider.Methods)
            {
                Assert.IsNull(method.XmlDocs);
            }
        }
    }
}
