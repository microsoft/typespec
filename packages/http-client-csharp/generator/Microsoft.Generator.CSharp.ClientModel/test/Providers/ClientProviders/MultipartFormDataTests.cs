// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Linq;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Tests.Common;
using NUnit.Framework;

namespace Microsoft.Generator.CSharp.ClientModel.Tests.Providers.ClientProviders
{
    public class MultipartFormDataTests
    {
        [Test]
        public void MpfdOperationDoesNotHaveConvenienceMethods()
        {
            var operation = InputFactory.Operation("MpfdOperation", requestMediaTypes: ["multipart/form-data"], parameters: [InputFactory.ContentTypeParameter("multipart/form-data")]);
            var inputClient = InputFactory.Client("MpfdClient", operations: [operation]);
            MockHelpers.LoadMockPlugin(apiKeyAuth: () => new InputApiKeyAuth("mock", null), clients: () => [inputClient]);
            var client = ClientModelPlugin.Instance.TypeFactory.CreateClient(inputClient);
            Assert.AreEqual(2, client.Methods.Count);
            Assert.IsTrue(client.Methods[0].Signature.Parameters.Any(p => p.Name == "options" && p.Type.Equals(typeof(RequestOptions))));
        }

        [Test]
        public void MpfdOperationShouldHaveContentTypeParam()
        {
            var operation = InputFactory.Operation("MpfdOperation", requestMediaTypes: ["multipart/form-data"], parameters: [InputFactory.ContentTypeParameter("multipart/form-data")]);
            var inputClient = InputFactory.Client("MpfdClient", operations: [operation]);
            MockHelpers.LoadMockPlugin(apiKeyAuth: () => new InputApiKeyAuth("mock", null), clients: () => [inputClient]);
            var client = ClientModelPlugin.Instance.TypeFactory.CreateClient(inputClient);
            Assert.AreEqual(2, client.Methods.Count);
            Assert.IsTrue(client.Methods[0].Signature.Parameters.Any(p => p.Name == "contentType" && p.Type.Equals(typeof(string))));
        }
    }
}
