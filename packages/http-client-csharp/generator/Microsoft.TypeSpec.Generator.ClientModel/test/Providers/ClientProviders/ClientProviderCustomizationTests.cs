// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ClientProviders
{
    public class ClientProviderCustomizationTests
    {
        [Test]
        public async Task CanAddMethod()
        {
            var inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.BodyParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the client provider
            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
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
                InputFactory.BodyParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the client provider
            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
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
            List<InputMethodParameter> parameters = [InputFactory.MethodParameter("p1", InputFactory.Array(InputPrimitiveType.String))];
            var inputOperation = InputFactory.Operation("HelloAgain", parameters: parameters);
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation, parameters: parameters);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the client provider
            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);

            var clientProviderMethods = clientProvider!.Methods;
            Assert.AreEqual(4, clientProviderMethods.Count);

            var helloAgainMethod = clientProviderMethods.FirstOrDefault(m
                => m.Signature.Name == "HelloAgain" && m.Signature.Parameters.Count > 0 && m.Signature.Parameters[0].Name == "p1");
            Assert.IsNotNull(helloAgainMethod);
            Assert.AreEqual(2, helloAgainMethod!.Signature.Parameters.Count);

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
                InputFactory.BodyParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the client provider
            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
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

        // Validates that when the protocol method is suppressed via [CodeGenSuppress] without a custom
        // replacement, the convenience method (which calls the protocol method) is not generated either,
        // since it would not compile.
        [Test]
        public async Task SuppressedProtocolMethodSkipsConvenienceMethod()
        {
            var inputOperation = InputFactory.Operation("HelloAgain");
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);

            // Both the suppressed protocol methods and the dependent convenience methods should be gone.
            var helloAgainMethods = clientProvider!.Methods
                .Where(m => m.Signature.Name == "HelloAgain" || m.Signature.Name == "HelloAgainAsync")
                .ToList();
            Assert.AreEqual(0, helloAgainMethods.Count);
        }

        // Validates that when the protocol method is suppressed via [CodeGenSuppress] but replaced by a
        // custom (non-partial) method implementation, the convenience method is still generated because
        // it will compile against the custom protocol method.
        [Test]
        public async Task SuppressedProtocolMethodWithCustomCodeKeepsConvenienceMethod()
        {
            var inputOperation = InputFactory.Operation("HelloAgain");
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);

            // The generated protocol methods are suppressed (provided by custom code), but the convenience
            // methods (taking a CancellationToken) should still be generated.
            var syncConvenience = clientProvider!.Methods.SingleOrDefault(m =>
                m.Signature.Name == "HelloAgain" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(System.Threading.CancellationToken))));
            var asyncConvenience = clientProvider.Methods.SingleOrDefault(m =>
                m.Signature.Name == "HelloAgainAsync" &&
                m.Signature.Parameters.Any(p => p.Type.Equals(typeof(System.Threading.CancellationToken))));

            Assert.IsNotNull(syncConvenience);
            Assert.IsNotNull(asyncConvenience);

            // Validate the generated convenience methods (signature and body) still call into the
            // (custom) protocol methods.
            string syncActual;
            using (var syncWriter = new CodeWriter())
            {
                syncWriter.WriteMethod(syncConvenience!);
                syncActual = syncWriter.ToString(false);
            }

            string asyncActual;
            using (var asyncWriter = new CodeWriter())
            {
                asyncWriter.WriteMethod(asyncConvenience!);
                asyncActual = asyncWriter.ToString(false);
            }

            Assert.AreEqual(Helpers.GetExpectedFromFile("Sync"), syncActual);
            Assert.AreEqual(Helpers.GetExpectedFromFile("Async"), asyncActual);

            // The generated protocol methods (taking RequestOptions) should be suppressed in favor of the custom ones.
            var generatedProtocolMethods = clientProvider.Methods
                .Where(m => (m.Signature.Name == "HelloAgain" || m.Signature.Name == "HelloAgainAsync") &&
                    m.Signature.Parameters.Any(p => p.Type.Equals(typeof(RequestOptions))))
                .ToList();
            Assert.AreEqual(0, generatedProtocolMethods.Count);
        }

        // Validates that when the protocol method is suppressed via [CodeGenSuppress] and the customization
        // only provides an overload with an additional parameter (a different signature), the convenience
        // method is still skipped because no replacement with the matching protocol signature exists.
        [Test]
        public async Task SuppressedProtocolMethodWithCustomOverloadSkipsConvenienceMethod()
        {
            var inputOperation = InputFactory.Operation("HelloAgain");
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);

            // The custom overloads (with an additional parameter) do not match the suppressed protocol
            // signature, so both the protocol and the dependent convenience methods should be gone.
            var generatedHelloAgainMethods = clientProvider!.Methods
                .Where(m => m.Signature.Name == "HelloAgain" || m.Signature.Name == "HelloAgainAsync")
                .ToList();
            Assert.AreEqual(0, generatedHelloAgainMethods.Count);

            // The additional custom overload is still present in the custom code view.
            var customMethods = clientProvider.CustomCodeView?.Methods ?? [];
            Assert.AreEqual(2, customMethods.Count);
            Assert.IsTrue(customMethods.All(m => m.Signature.Parameters.Count == 2));
        }

        // Validates that when a paging protocol method is suppressed via [CodeGenSuppress], the paging
        // helpers (collection result definitions) are still generated so that custom code can reference
        // them. Unlike non-paging convenience methods, paging convenience methods instantiate the
        // collection result directly instead of calling the protocol method, so they are always generated.
        [Test]
        public async Task SuppressedPagingProtocolMethodKeepsPagingHelpers()
        {
            var inputModel = InputFactory.Model("item", properties:
            [
                InputFactory.Property("color", InputPrimitiveType.String, isRequired: true),
            ]);
            var pagingMetadata = InputFactory.NextLinkPagingMetadata(["items"], ["nextLink"], InputResponseLocation.Body);
            var response = InputFactory.OperationResponse(
                [200],
                InputFactory.Model(
                    "page",
                    properties:
                    [
                        InputFactory.Property("items", InputFactory.Array(inputModel)),
                        InputFactory.Property("nextLink", InputPrimitiveType.Url),
                    ]));
            var inputOperation = InputFactory.Operation("GetItems", responses: [response]);
            var inputServiceMethod = InputFactory.PagingServiceMethod("GetItems", inputOperation, pagingMetadata: pagingMetadata);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                inputModels: () => [inputModel],
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = (ClientProvider)mockGenerator.Object.OutputLibrary.TypeProviders.Single(t => t is ClientProvider);

            // The generated protocol methods (taking RequestOptions) are suppressed.
            var generatedProtocolMethods = clientProvider.Methods
                .Where(m => (m.Signature.Name == "GetItems" || m.Signature.Name == "GetItemsAsync") &&
                    m.Signature.Parameters.Any(p => p.Type.Equals(typeof(RequestOptions))))
                .ToList();
            Assert.AreEqual(0, generatedProtocolMethods.Count);

            // The paging convenience methods (taking a CancellationToken) are still generated because they
            // instantiate the collection result directly rather than calling the suppressed protocol method.
            var convenienceMethods = clientProvider.Methods
                .Where(m => (m.Signature.Name == "GetItems" || m.Signature.Name == "GetItemsAsync") &&
                    m.Signature.Parameters.Any(p => p.Type.Equals(typeof(System.Threading.CancellationToken))))
                .ToList();
            Assert.AreEqual(2, convenienceMethods.Count);

            // The paging helpers (collection result definitions) are still emitted so that the custom code
            // referencing them continues to compile.
            var collectionResultDefinitions = mockGenerator.Object.OutputLibrary.TypeProviders
                .OfType<CollectionResultDefinition>()
                .Select(t => t.Name)
                .ToList();
            CollectionAssert.Contains(collectionResultDefinitions, "TestClientGetItemsCollectionResult");
            CollectionAssert.Contains(collectionResultDefinitions, "TestClientGetItemsAsyncCollectionResult");
            CollectionAssert.Contains(collectionResultDefinitions, "TestClientGetItemsCollectionResultOfT");
            CollectionAssert.Contains(collectionResultDefinitions, "TestClientGetItemsAsyncCollectionResultOfT");
        }

        // Validates that a method with a struct parameter can be replaced
        [TestCase(true)]
        [TestCase(false)]
        public async Task CanReplaceStructMethod(bool isStructCustomized)
        {
            List<InputMethodParameter> methodParameters = [InputFactory.MethodParameter("p1", InputFactory.Model("myStruct", modelAsStruct: true, @namespace: "Sample.TestClient"), isRequired: false)];
            List<InputBodyParameter> operationParameters = [InputFactory.BodyParameter("p1", InputFactory.Model("myStruct", modelAsStruct: true, @namespace: "Sample.TestClient"), isRequired: false)];
            var inputOperation = InputFactory.Operation("HelloAgain", parameters: operationParameters);
            var inputServiceMethod = InputFactory.BasicServiceMethod("HelloAgain", inputOperation, parameters: methodParameters);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync(isStructCustomized.ToString()));

            // Find the client provider
            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
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
            Assert.AreEqual(2, customMethodParams.Count);
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
                InputFactory.BodyParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the client provider
            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);
            Assert.IsTrue(clientProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));

            // Find the REST client provider
            var restClientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is RestClientProvider);
            Assert.IsNotNull(restClientProvider);
            Assert.IsTrue(restClientProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));

            // Find the client options provider
            var clientOptionsProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientOptionsProvider);
            Assert.IsNotNull(clientOptionsProvider);
            // The client options were not customized
            Assert.IsTrue(clientOptionsProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Public));

            // ClientSettings should not be generated for internal clients
            Assert.IsNull(((ClientProvider)clientProvider).ClientSettings,
                "Internal client should not have ClientSettings generated");

            // The docs should be generated even when then methods is internal
            foreach (var method in clientProvider.Methods)
            {
                Assert.IsNotNull(method.XmlDocs);
            }
        }

        [Test]
        public async Task CanChangeClientOptionsAccessibility()
        {
            var inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.BodyParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the client provider - we customize both to be internal because otherwise the build would fail as the client options
            // would be less accessible than the client
            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);
            Assert.IsTrue(clientProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));

            // Find the REST client provider
            var restClientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is RestClientProvider);
            Assert.IsNotNull(restClientProvider);
            Assert.IsTrue(restClientProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));

            // Find the client options provider
            var clientOptionsProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientOptionsProvider);
            Assert.IsNotNull(clientOptionsProvider);
            // The client options were not customized
            Assert.IsTrue(clientOptionsProvider!.DeclarationModifiers.HasFlag(TypeSignatureModifiers.Internal));

            // ClientSettings should not be generated for internal clients
            Assert.IsNull(((ClientProvider)clientProvider).ClientSettings,
                "Internal client should not have ClientSettings generated");

            // The docs should be generated even when then methods is internal
            foreach (var method in clientProvider.Methods)
            {
                Assert.IsNotNull(method.XmlDocs);
            }
        }

        [Test]
        public async Task CanRenameSubClient()
        {
            var inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.BodyParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            InputClient subClient = InputFactory.Client("custom", parent: inputClient, initializedBy: InputClientInitializedBy.Parent);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // Find the sub-client provider
            var subClientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider && t.Name == "CustomClient");
            Assert.IsNotNull(subClientProvider);

            // find the parent client provider
            var parentClientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider && t.Name == "TestClient");
            Assert.IsNotNull(parentClientProvider);

            // find the sub-client factory method
            var subClientFactoryMethod = parentClientProvider!.Methods.SingleOrDefault(m => m.Signature.Name == "GetCustomClient");
            Assert.IsNotNull(subClientFactoryMethod);
        }

        // Validates that the sub-client caching field is removed when the field is suppressed.
        [Test]
        public async Task CanRemoveCachingField()
        {
            var inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.BodyParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            InputClient subClient = InputFactory.Client("dog", methods: [], parameters: [], parent: inputClient, initializedBy: InputClientInitializedBy.Parent);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            // find the parent client provider
            var parentClientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider && t.Name == "TestClient");
            Assert.IsNotNull(parentClientProvider);

            // the sub-client caching field should not be present
            var fields = parentClientProvider!.Fields;
            Assert.AreEqual(1, fields.Count);
            Assert.AreEqual("_endpoint", fields[0].Name);

            var cachingField = fields.SingleOrDefault(f => f.Name == "_cachedDog");
            Assert.IsNull(cachingField);
        }

        // Validates that a generated protocol method can be customized via a partial method declaration in custom code.
        [Test]
        public async Task CanCustomizeMethodSignature()
        {
            var inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.BodyParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);

            // Find the protocol method that should now be partial.
            var partialMethod = clientProvider!.Methods.FirstOrDefault(m =>
                m.Signature.Name == "HelloAgain"
                && m.IsPartialMethod
                && m.Signature.Parameters.Any(p => p.Type.Name == "BinaryContent"));
            Assert.IsNotNull(partialMethod, "HelloAgain protocol method should be generated as partial");
            Assert.IsTrue(partialMethod!.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Partial));

            // Custom signature changes should be applied (parameter renamed to "content").
            Assert.AreEqual(2, partialMethod.Signature.Parameters.Count);
            Assert.AreEqual("content", partialMethod.Signature.Parameters[0].Name);
            Assert.AreEqual("options", partialMethod.Signature.Parameters[1].Name);

            // All parameters in the partial implementation must be required (no default values).
            Assert.IsTrue(partialMethod.Signature.Parameters.All(p => p.DefaultValue == null));

            // The original generated (non-partial) HelloAgain protocol method should not also be present.
            var nonPartialDuplicates = clientProvider.Methods.Where(m =>
                m.Signature.Name == "HelloAgain"
                && !m.IsPartialMethod
                && m.Signature.Parameters.Any(p => p.Type.Name == "BinaryContent")).ToList();
            Assert.AreEqual(0, nonPartialDuplicates.Count);
        }

        [Test]
        public async Task CanCustomizeMethodModifierOnly()
        {
            // Verifies that a partial method declaration that changes only the access modifier
            // (without renaming any parameters) still produces a partial implementation with
            // the customer's modifier and the generator's parameter names.
            var inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.BodyParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);

            var partialMethod = clientProvider!.Methods.FirstOrDefault(m =>
                m.Signature.Name == "HelloAgain"
                && m.IsPartialMethod
                && m.Signature.Parameters.Any(p => p.Type.Name == "BinaryContent"));
            Assert.IsNotNull(partialMethod, "HelloAgain protocol method should be generated as partial");
            Assert.IsTrue(partialMethod!.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Partial));

            // Modifier comes from the partial declaration -> should be internal.
            Assert.IsTrue(partialMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Internal));
            Assert.IsFalse(partialMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public));

            // Parameter names are unchanged (generator-chosen).
            Assert.AreEqual(2, partialMethod.Signature.Parameters.Count);
            Assert.AreEqual("p1", partialMethod.Signature.Parameters[0].Name);
            Assert.AreEqual("options", partialMethod.Signature.Parameters[1].Name);

            // Defaults stripped on the implementation.
            Assert.IsTrue(partialMethod.Signature.Parameters.All(p => p.DefaultValue == null));
        }

        [Test]
        public async Task CanCustomizeConvenienceMethodSignature()
        {
            // Verifies the matching/cloning logic in BuildConvenienceMethod: a partial method
            // declaration on the convenience overload renames parameters and the generator
            // emits a partial implementation that references the customer-chosen names.
            List<InputMethodParameter> methodParameters =
            [
                InputFactory.MethodParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ];
            List<InputBodyParameter> operationParameters =
            [
                InputFactory.BodyParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ];
            var inputOperation = InputFactory.Operation("HelloAgain", parameters: operationParameters);
            var inputServiceMethod = InputFactory.BasicServiceMethod("HelloAgain", inputOperation, parameters: methodParameters);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);

            // Find the convenience overload (the one whose first parameter is IEnumerable<string>,
            // not BinaryContent).
            var convenienceMethod = clientProvider!.Methods.FirstOrDefault(m =>
                m.Signature.Name == "HelloAgain"
                && m.IsPartialMethod
                && m.Signature.Parameters.Any(p => p.Type.IsList));
            Assert.IsNotNull(convenienceMethod, "HelloAgain convenience method should be generated as partial");
            Assert.IsTrue(convenienceMethod!.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Partial));

            // Parameters take their names from the partial declaration.
            Assert.AreEqual(2, convenienceMethod.Signature.Parameters.Count);
            Assert.AreEqual("body", convenienceMethod.Signature.Parameters[0].Name);
            Assert.AreEqual("ct", convenienceMethod.Signature.Parameters[1].Name);

            // The cloned parameters preserve generator-side metadata: the body parameter
            // still reports its original Location so the body construction works.
            Assert.AreEqual("CancellationToken", convenienceMethod.Signature.Parameters[1].Type.Name);

            // No duplicate non-partial convenience method.
            var nonPartialDuplicates = clientProvider.Methods.Where(m =>
                m.Signature.Name == "HelloAgain"
                && !m.IsPartialMethod
                && m.Signature.Parameters.Any(p => p.Type.IsList)).ToList();
            Assert.AreEqual(0, nonPartialDuplicates.Count);
        }

        // Validates that customizing an async protocol method via a partial method declaration
        // still emits the `async` modifier on the implementation. The customer's partial
        // declaration cannot carry `async` (it belongs to the implementing declaration), but the
        // generated body uses `await`, so omitting it produces compiler error CS4032.
        [Test]
        public async Task CanCustomizeAsyncMethodSignature()
        {
            var inputOperation = InputFactory.Operation("HelloAgain", parameters:
            [
                InputFactory.BodyParameter("p1", InputFactory.Array(InputPrimitiveType.String))
            ]);
            var inputServiceMethod = InputFactory.BasicServiceMethod("test", inputOperation);
            var inputClient = InputFactory.Client("TestClient", methods: [inputServiceMethod]);
            var mockGenerator = await MockHelpers.LoadMockGeneratorAsync(
                clients: () => [inputClient],
                compilation: async () => await Helpers.GetCompilationFromDirectoryAsync());

            var clientProvider = mockGenerator.Object.OutputLibrary.TypeProviders.SingleOrDefault(t => t is ClientProvider);
            Assert.IsNotNull(clientProvider);

            // Find the async protocol method that should now be partial.
            var partialMethod = clientProvider!.Methods.FirstOrDefault(m =>
                m.Signature.Name == "HelloAgainAsync"
                && m.IsPartialMethod
                && m.Signature.Parameters.Any(p => p.Type.Name == "BinaryContent"));
            Assert.IsNotNull(partialMethod, "HelloAgainAsync protocol method should be generated as partial");
            Assert.IsTrue(partialMethod!.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Partial));

            // The implementation body uses `await`, so the `async` modifier must be present to
            // avoid compiler error CS4032.
            Assert.IsTrue(partialMethod.Signature.Modifiers.HasFlag(MethodSignatureModifiers.Async));

            // Custom signature changes should be applied (parameter renamed to "content").
            Assert.AreEqual(2, partialMethod.Signature.Parameters.Count);
            Assert.AreEqual("content", partialMethod.Signature.Parameters[0].Name);
            Assert.AreEqual("options", partialMethod.Signature.Parameters[1].Name);

            // All parameters in the partial implementation must be required (no default values).
            Assert.IsTrue(partialMethod.Signature.Parameters.All(p => p.DefaultValue == null));
        }
    }
}
