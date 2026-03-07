// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.IO;
using System.Threading.Tasks;
using NUnit.Framework;
using Payload.MultiPart;
using File = System.IO.File;

namespace TestProjects.Spector.Tests.Http.Payload.Multipart
{
    internal class MultipartTests : SpectorTestBase
    {
        private string SamplePngPath = Path.Combine(SpectorServer.GetSpecDirectory(), "assets", "image.png");
        private string SampleJpgPath = Path.Combine(SpectorServer.GetSpecDirectory(), "assets", "image.jpg");

        [SpectorTest]
        public Task Basic() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("123", "id");

            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "profileImage", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .BasicAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task JsonPart() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("{\"city\":\"X\"}", "address");

            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "profileImage", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .JsonPartAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task CheckFileNameAndContentType() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("123", "id");

            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "hello.jpg", "image/jpg");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .CheckFileNameAndContentTypeAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task FileArrayAndBasic() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("123", "id");
            content.Add("{\"city\":\"X\"}", "address", contentType: "application/json");

            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            content.Add(imageStream1, "profileImage", "profileImage", "application/octet-stream");
            content.Add("[{\"city\":\"Y\"},{\"city\":\"Z\"}]", "previousAddresses", contentType: "application/json");

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            content.Add(imageStream2, "pictures", "pictures", "application/octet-stream");

            await using var imageStream3 = File.OpenRead(SamplePngPath);
            content.Add(imageStream3, "pictures", "pictures", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .FileArrayAndBasicAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task HttpPartsImageJpegContentType() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "hello.jpg", "image/jpg");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .ImageJpegContentTypeAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task HttpPartsOptionalContentType() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent contentWithNoContentType = new MultiPartFormDataBinaryContent();
            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            contentWithNoContentType.Add(imageStream1, "profileImage", "hello.jpg");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .OptionalContentTypeAsync(contentWithNoContentType, contentWithNoContentType.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);

            using MultiPartFormDataBinaryContent contentWithContentType = new MultiPartFormDataBinaryContent();
            await using var imageStream2 = File.OpenRead(SampleJpgPath);
            contentWithContentType.Add(imageStream2, "profileImage", "hello.jpg", "application/octet-stream");

            response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .OptionalContentTypeAsync(contentWithContentType, contentWithContentType.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task HttpPartsRequiredContentType() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "hello.jpg", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .RequiredContentTypeAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task HttpPartsJsonArrayAndFileArray() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("123", "id");
            content.Add("{\"city\":\"X\"}", "address", contentType: "application/json");

            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            content.Add(imageStream1, "profileImage", "hello.jpg", "application/octet-stream");
            content.Add("[{\"city\":\"Y\"},{\"city\":\"Z\"}]", "previousAddresses", contentType: "application/json");

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            content.Add(imageStream2, "pictures", "hello.jpg", "application/octet-stream");

            await using var imageStream3 = File.OpenRead(SamplePngPath);
            content.Add(imageStream3, "pictures", "hello.jpg", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .JsonArrayAndFileArrayAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task HttpPartsNonStringFloat() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add(0.5f, "temperature");
            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsNonStringClient()
                .FloatAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task BinaryArrayParts() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("123", "id");
            await using var imageStream1 = File.OpenRead(SamplePngPath);
            content.Add(imageStream1, "pictures", "pictures", "application/octet-stream");

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            content.Add(imageStream2, "pictures", "pictures", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .BinaryArrayPartsAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task AnonymousModel() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "profileImage", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .AnonymousModelAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task MultiBinaryPartsWithPicture()
            => MultiBinaryParts(true);

        [SpectorTest]
        public Task MultiBinaryPartsWithoutPicture()
            => MultiBinaryParts(false);

        private Task MultiBinaryParts(bool hasPicture) => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            content.Add(imageStream1, "profileImage", "profileImage", "application/octet-stream");
            await using var imageStream2 = File.OpenRead(SamplePngPath);
            if (hasPicture)
            {
                content.Add(imageStream2, "picture", "picture", "application/octet-stream");
            }

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .MultiBinaryPartsAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task WithWireName() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("123", "id");
            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "profileImage", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .WithWireNameAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task OptionalParts() => Test(async (host) =>
        {
            var client = new MultiPartClient(host, null).GetFormDataClient();

            using MultiPartFormDataBinaryContent contentIdOnly = new MultiPartFormDataBinaryContent();
            contentIdOnly.Add("123", "id");
            var response1 = await client.OptionalPartsAsync(contentIdOnly, contentIdOnly.ContentType, null);
            Assert.AreEqual(204, response1.GetRawResponse().Status);

            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            using MultiPartFormDataBinaryContent contentImageOnly = new MultiPartFormDataBinaryContent();
            contentImageOnly.Add(imageStream1, "profileImage", "profileImage", "application/octet-stream");
            var response2 = await client.OptionalPartsAsync(contentImageOnly, contentImageOnly.ContentType, null);
            Assert.AreEqual(204, response2.GetRawResponse().Status);

            await using var imageStream2 = File.OpenRead(SampleJpgPath);
            using MultiPartFormDataBinaryContent contentBoth = new MultiPartFormDataBinaryContent();
            contentBoth.Add("123", "id");
            contentBoth.Add(imageStream2, "profileImage", "profileImage", "application/octet-stream");
            var response3 = await client.OptionalPartsAsync(contentBoth, contentBoth.ContentType, null);
            Assert.AreEqual(204, response3.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task FileUploadFileSpecificContentType() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            await using var imageStream = File.OpenRead(SamplePngPath);
            content.Add(imageStream, "file", "image.png", "image/png");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataFileClient()
                .UploadFileSpecificContentTypeAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task FileUploadFileRequiredFilename() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            await using var imageStream = File.OpenRead(SamplePngPath);
            content.Add(imageStream, "file", "image.png", "image/png");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataFileClient()
                .UploadFileRequiredFilenameAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task FileUploadFileArray() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            await using var imageStream1 = File.OpenRead(SamplePngPath);
            content.Add(imageStream1, "files", "image1.png", "image/png");
            await using var imageStream2 = File.OpenRead(SamplePngPath);
            content.Add(imageStream2, "files", "image2.png", "image/png");

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataFileClient()
                .UploadFileArrayAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
