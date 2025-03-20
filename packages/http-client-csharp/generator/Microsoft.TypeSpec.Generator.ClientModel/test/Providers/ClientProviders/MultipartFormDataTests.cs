// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Tests.Common;
using NUnit.Framework;

namespace Microsoft.TypeSpec.Generator.ClientModel.Tests.Providers.ClientProviders
{
    public class MultipartFormDataTests
    {
        [Test]
        public void MultipartOperationDoesNotHaveConvenienceMethods()
        {
            var operation = InputFactory.Operation("MultipartOperation", requestMediaTypes: ["multipart/form-data"], parameters: [InputFactory.ContentTypeParameter("multipart/form-data")]);
            var inputClient = InputFactory.Client("MultipartClient", operations: [operation]);
            MockHelpers.LoadMockGenerator(auth: () => new(new InputApiKeyAuth("mock", null), null), clients: () => [inputClient]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);
            Assert.AreEqual(2, client!.Methods.Count);
            Assert.IsTrue(client.Methods[0].Signature.Parameters.Any(p => p.Name == "options" && p.Type.Equals(typeof(RequestOptions))));
        }

        [Test]
        public void MultipartOperationShouldHaveContentTypeParam()
        {
            var operation = InputFactory.Operation("MultipartOperation", requestMediaTypes: ["multipart/form-data"], parameters: [InputFactory.ContentTypeParameter("multipart/form-data")]);
            var inputClient = InputFactory.Client("MultipartClient", operations: [operation]);
            MockHelpers.LoadMockGenerator(auth: () => new(new InputApiKeyAuth("mock", null), null), clients: () => [inputClient]);
            var client = ScmCodeModelGenerator.Instance.TypeFactory.CreateClient(inputClient);
            Assert.IsNotNull(client);
            Assert.AreEqual(2, client!.Methods.Count);
            Assert.IsTrue(client.Methods[0].Signature.Parameters.Any(p => p.Name == "contentType" && p.Type.Equals(typeof(string))));
        }
    }
}
