// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Text;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using body_formdata;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class BodyFormdataTests : TestServerTestBase
    {
        private static MemoryStream MakeStream(string text)
        {
            return new MemoryStream(Encoding.UTF8.GetBytes(text));
        }

        [Test]
        public Task FormdataStreamUploadFile() => Test(async (host, pipeline) =>
        {
            var client = new FormdataClient(ClientDiagnostics, pipeline, host);

            var stream = MakeStream("Test data stream");
            var output = await client.UploadFileAsync(stream, "MyFile");
            string result = new StreamReader(output).ReadToEnd();
            Assert.AreEqual("Test data stream", result);
        });

        [Test]
        public Task StreamUploadFile() => Test(async  (host, pipeline) =>
        {
            var client = new FormdataClient(ClientDiagnostics, pipeline, host);

            var stream = MakeStream("Test data stream");
            var output = await client.UploadFileViaBodyAsync(stream);
            string result = new StreamReader(output).ReadToEnd();
            Assert.AreEqual("Test data stream", result);
        });
    }
}
