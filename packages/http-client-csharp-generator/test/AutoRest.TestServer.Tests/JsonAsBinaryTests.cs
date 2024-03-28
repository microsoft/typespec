// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Text;
using System.Threading.Tasks;
using JsonAsBinary;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class JsonAsBinaryTests: InProcTestBase
    {
        [Test]
        public async Task CanSendJsonAsStream()
        {
            var requestMemoryStream = new MemoryStream();
            using var testServer = new InProcTestServer(async content =>
            {
                await content.Request.Body.CopyToAsync(requestMemoryStream);
                await content.Response.Body.WriteAsync(Encoding.UTF8.GetBytes("[3, 2, 1]"));
            });

            var responseModel = await new JsonAsBinaryClient(ClientDiagnostics, HttpPipeline, testServer.Address).OperationAsync(new MemoryStream(Encoding.UTF8.GetBytes("[1, 2, 3]")));

            var responseMemoryStream = new MemoryStream();
            await responseModel.Value.CopyToAsync(responseMemoryStream);

            Assert.AreEqual("[1, 2, 3]", Encoding.UTF8.GetString(requestMemoryStream.ToArray()));
            Assert.AreEqual("[3, 2, 1]", Encoding.UTF8.GetString(responseMemoryStream.ToArray()));
        }
    }
}
