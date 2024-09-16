// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Statements;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.RestClientProviders
{
    internal class MultipartFormDataTests
    {
        [Test]
        public void MultipartShouldUseContentTypeParamInCreateRequestMethod()
        {
            var operation = InputFactory.Operation("MultipartOperation", requestMediaTypes: ["multipart/form-data"], parameters: [InputFactory.ContentTypeParameter("multipart/form-data")]);
            var inputClient = InputFactory.Client("MultipartClient", operations: [operation]);
            MockHelpers.LoadMockPlugin(apiKeyAuth: () => new InputApiKeyAuth("mock", null), clients: () => [inputClient]);
            var client = ClientModelPlugin.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);
            var restClient = client.RestClient;
            Assert.IsNotNull(restClient);
            var createMethod = restClient.Methods.FirstOrDefault(m => m.Signature.Name == "CreateMultipartOperationRequest");
            Assert.IsNotNull(createMethod);
            var statements = createMethod!.BodyStatements as MethodBodyStatements;
            Assert.IsNotNull(statements);
            Assert.IsTrue(statements!.Statements.Any(s => s.ToDisplayString() == "request.Headers.Set(\"Content-Type\", contentType);\n"));
        }
    }
}
