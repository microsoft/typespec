// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Threading.Tasks;
using NUnit.Framework;
using Payload.MultiPart;
using File = System.IO.File;

namespace TestProjects.CadlRanch.Tests.Http.Payload.Multipart
{
    internal class MultipartTests : CadlRanchTestBase
    {
        private string SamplePngPath = Path.Combine(CadlRanchServer.GetSpecDirectory(), "assets", "image.png");
        private string SampleJpgPath = Path.Combine(CadlRanchServer.GetSpecDirectory(), "assets", "image.jpg");

        [CadlRanchTest]
        public Task Basic() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("123", "id");
            content.Add(File.OpenRead(SampleJpgPath), "profileImage", "profileImage", "application/octet-stream");
            var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task JsonPart() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("{\"city\":\"X\"}", "address");
            content.Add(File.OpenRead(SampleJpgPath), "profileImage", "profileImage", "application/octet-stream");
            var response = await new MultiPartClient(host, null).GetFormDataClient().JsonPartAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task BinaryArrayParts() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("123", "id");
            content.Add(File.OpenRead(SamplePngPath), "pictures", "pictures", "application/octet-stream");
            content.Add(File.OpenRead(SamplePngPath), "pictures", "pictures", "application/octet-stream");
            var response = await new MultiPartClient(host, null).GetFormDataClient().BinaryArrayPartsAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task AnonymousModel() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add(File.OpenRead(SampleJpgPath), "profileImage", "profileImage", "application/octet-stream");
            var response = await new MultiPartClient(host, null).GetFormDataClient().AnonymousModelAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task MultiBinaryPartsWithPicture()
            => MultiBinaryParts(true);

        [CadlRanchTest]
        public Task MultiBinaryPartsWithoutPicture()
            => MultiBinaryParts(false);

        private Task MultiBinaryParts(bool hasPicture) => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add(File.OpenRead(SampleJpgPath), "profileImage", "profileImage", "application/octet-stream");
            if (hasPicture)
            {
                content.Add(File.OpenRead(SamplePngPath), "picture", "picture", "application/octet-stream");
            }
            var response = await new MultiPartClient(host, null).GetFormDataClient().MultiBinaryPartsAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
