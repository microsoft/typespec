// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Text;
using System.Threading.Tasks;
using Moq;
using NUnit.Framework;
using SampleTypeSpec;

namespace TestProjects.Local.Tests
{
    public class PrimitiveResponseTests
    {
        [TestCase(false, false)]
        [TestCase(false, true)]
        [TestCase(true, false)]
        [TestCase(true, true)]
        public async Task JsonInt32ResponseDeserialization(bool hasBom, bool isAsync)
        {
            var payload = Encoding.UTF8.GetBytes("42");
            var content = hasBom
                ? BinaryData.FromBytes([.. Encoding.UTF8.GetPreamble(), .. payload])
                : BinaryData.FromBytes(payload);
            var response = new Mock<PipelineResponse>();
            response.SetupGet(r => r.Content).Returns(content);
            var protocolResult = ClientResult.FromResponse(response.Object);
            var client = new Mock<SampleTypeSpecClient> { CallBase = true };
            client.Setup(c => c.GetJsonInt32(It.IsAny<RequestOptions>())).Returns(protocolResult);
            client.Setup(c => c.GetJsonInt32Async(It.IsAny<RequestOptions>())).ReturnsAsync(protocolResult);

            var result = isAsync
                ? await client.Object.GetJsonInt32Async()
                : client.Object.GetJsonInt32();

            Assert.AreEqual(42, result.Value);
            Assert.AreSame(response.Object, result.GetRawResponse());
            Assert.AreSame(content, result.GetRawResponse().Content);
        }
    }
}
