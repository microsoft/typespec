// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using NUnit.Framework;
using Payload.MultiPart;
using Payload.MultiPart.Models;
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

            var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task BasicProtocol() => Test(async (host) =>
        {
            // use the internal BCL type to create a MultipartFormDataContent
            using MultipartFormDataContent multipartContent = new()
            {
                // add the id part, including the name of the part and it's value
                { new StringContent("123"), "id" }
            };

            // add the file part, including the name of the part and the file name
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var streamContent = new StreamContent(imageStream);
            streamContent.Headers.ContentType = MediaTypeHeaderValue.Parse("application/octet-stream");
            multipartContent.Add(streamContent, "profileImage", "profileImage.jpg");

            // convert the BCL type to BinaryContent
            using Stream multipartContentStream = await multipartContent.ReadAsStreamAsync();
            BinaryContent content = BinaryContent.Create(multipartContentStream);

            var requestContentType = multipartContent.Headers.ContentType!.ToString();
            var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(content, requestContentType);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task BasicConv() => Test(async (host) =>
        {
            var id = "123";
            await using var imageStream = File.OpenRead(SampleJpgPath);

            // using stream
            var profileImage = new MultiPartFile(imageStream, "profileImage.jpg");
            var request = new MultiPartRequest(id, profileImage);
            var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task JsonPart() => Test(async (host) =>
        {
            var id = "123";
            await using var imageStream = File.OpenRead(SampleJpgPath);

            // using stream
            var profileImage = new MultiPartFile(imageStream, "profileImage.jpg");
            var request = new MultiPartRequest(id, profileImage);

            // get the content type
            var contentType = ModelReaderWriter.Write(request, new ModelReaderWriterOptions("MPFD-ContentType"));
            var serialized = ModelReaderWriter.Write(request, new ModelReaderWriterOptions("W"));

            Assert.IsNotNull(serialized);
            var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(BinaryContent.Create(serialized), contentType.ToString());

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [Test]
        public Task BasicMRWRequestAsStream() => Test(async (host) =>
        {
            var id = "123";
            await using var imageStream = File.OpenRead(SampleJpgPath);

            // using stream
            var profileImage = new MultiPartFile(imageStream, "profileImage.jpg");
            var request = new MultiPartRequest(id, profileImage);

            // get the content type
            var contentType = ModelReaderWriter.Write(request, new ModelReaderWriterOptions("MPFD-ContentType"));
            using var customStream = new MemoryStream();
            ModelReaderWriter.Write(request, customStream, new ModelReaderWriterOptions("W"));

            var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(BinaryContent.Create(customStream), contentType.ToString());

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task JsonPartConv() => Test(async (host) =>
        {
            Address address = new Address("X");

            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new MultiPartFile(imageStream, "profileImage.jpg");

            var request = new JsonPartRequest(address, profileImage);

            var response = await new MultiPartClient(host, null).GetFormDataClient().JsonPartAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task CheckFileNameAndContentType() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("123", "id");

            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "hello.jpg", "image/jpg");

            var response = await new MultiPartClient(host, null).GetFormDataClient().CheckFileNameAndContentTypeAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task CheckFileNameAndContentTypeConv() => Test(async (host) =>
        {
            var id = "123";

            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new MultiPartFile(imageStream, "hello.jpg", "image/jpg");
            var request = new MultiPartRequest(id, profileImage);

            var response = await new MultiPartClient(host, null).GetFormDataClient().CheckFileNameAndContentTypeAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task CheckFileNameAndContentTypeConvUsingBinaryData() => Test(async (host) =>
        {
            var id = "123";

            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new MultiPartFile(imageStream, "hello.jpg", "image/jpg");
            var request = new MultiPartRequest(id, profileImage);

            var response = await new MultiPartClient(host, null).GetFormDataClient().CheckFileNameAndContentTypeAsync(request);

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

            var response = await new MultiPartClient(host, null).GetFormDataClient().FileArrayAndBasicAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task FileArrayAndBasicConv() => Test(async (host) =>
        {
            var id = "123";
            Address address = new Address("X");

            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            var profileImage = new MultiPartFile(imageStream1, "profileImage.jpg");

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            await using var imageStream3 = File.OpenRead(SamplePngPath);
            var pictures = new List<MultiPartFile>()
            {
                new(imageStream2, "sample.png"),
                new(imageStream3, "sample.png")
            };

            var request = new ComplexPartsRequest(id, address, profileImage, pictures);

            var response = await new MultiPartClient(host, null).GetFormDataClient().FileArrayAndBasicAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task HttpPartsImageJpegContentType() => Test(async (host) =>
        {
            var id = "123";
            Address address = new Address("X");
            await using var imageStream = File.OpenRead(SampleJpgPath);

            // using stream
            var profileImage = new MultiPartFile(BinaryData.FromStream(imageStream), "profileImage.jpg");
            await using var imageStream2 = File.OpenRead(SamplePngPath);
            await using var imageStream3 = File.OpenRead(SamplePngPath);
            var pictures = new List<MultiPartFile>()
            {
                 new(BinaryData.FromStream(imageStream2), "sample.png"),
                 new(BinaryData.FromStream(imageStream3), "sample.png")
            };

            var request = new ComplexPartsRequest(id, address, profileImage, pictures);
            using MemoryStream customStream = new();
            ModelReaderWriter.Write(request, customStream, new ModelReaderWriterOptions("W"));

            var contentType = ModelReaderWriter.Write(request, new ModelReaderWriterOptions("MPFD-ContentType")).ToString();

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .FileArrayAndBasicAsync(BinaryContent.Create(customStream), contentType);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task HttpPartsImageJpegContentTypeConv() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new FileSpecificContentType(imageStream, "hello.jpg");
            var request = new FileWithHttpPartSpecificContentTypeRequest(profileImage);

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .ImageJpegContentTypeAsync(request);

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
        public Task HttpPartsOptionalContentTypeConv() => Test(async (host) =>
        {
            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            var profileImage = new FileOptionalContentType(imageStream1, "hello.jpg");
            var request = new FileWithHttpPartOptionalContentTypeRequest(profileImage);

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .OptionalContentTypeAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);

            await using var imageStream2 = File.OpenRead(SampleJpgPath);
            var profileImage2 = new FileOptionalContentType(imageStream2, "hello.jpg", "application/octet-stream");
            request = new FileWithHttpPartOptionalContentTypeRequest(profileImage2);

            response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .OptionalContentTypeAsync(request);

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
        public Task HttpPartsRequiredContentTypeConv() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new FileRequiredMetaData(imageStream, "hello.jpg", "application/octet-stream");
            var file = new MultiPartFile(imageStream, "hello.jpg");
            var request = new FileWithHttpPartRequiredContentTypeRequest(profileImage);

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .RequiredContentTypeAsync(request);

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
               .GetFormDataHttpPartsContentTypeClient()
               .RequiredContentTypeAsync(BinaryContent.Create(serialized), contentType);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [Test]
        public Task HttpPartsRequiredContentTypeMRWAsStream() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new FileRequiredMetaData(BinaryData.FromStream(imageStream), "hello.jpg", "application/octet-stream");
            var file = new MultiPartFile(imageStream, "hello.jpg");
            var request = new FileWithHttpPartRequiredContentTypeRequest(profileImage);

            using var customStream = new MemoryStream();
            ModelReaderWriter.Write(request, customStream, new ModelReaderWriterOptions("W"));
            var contentType = ModelReaderWriter.Write(request, new ModelReaderWriterOptions("MPFD-ContentType")).ToString();

            var response = await new MultiPartClient(host, null).GetFormDataClient()
               .GetFormDataHttpPartsClient()
               .GetFormDataHttpPartsContentTypeClient()
               .RequiredContentTypeAsync(BinaryContent.Create(customStream), contentType);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        [Ignore("")]
        public Task HttpPartsJsonArrayAndFileArrayConv() => Test(async (host) =>
        {
            string id = "123";
            var address1 = new Address("X");
            var address2 = new Address("Y");
            var previousAddresses = new List<Address>() { address1, address2 };

            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            var profileImage = new FileRequiredMetaData(imageStream1, "profile.jpg", "application/octet-stream");

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            await using var imageStream3 = File.OpenRead(SamplePngPath);
            var pictures = new List<FileRequiredMetaData>()
            {
                new FileRequiredMetaData(imageStream1, "profile.jpg", "application/octet-stream"),
                new FileRequiredMetaData(imageStream2, "profile2.jpg", "application/octet-stream")
            };

            var request = new ComplexHttpPartsModelRequest(id, address1, profileImage, previousAddresses, pictures);

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .JsonArrayAndFileArrayAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task HttpPartsNonStringFloat() => Test(async (host) =>
        {
            string id = "123";
            var address1 = new Address("X");
            var address2 = new Address("Y");
            var previousAddresses = new List<Address>() { address1, address2 };

            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            var profileImage = new FileRequiredMetaData(imageStream1, "profile.jpg", "application/octet-stream");

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            await using var imageStream3 = File.OpenRead(SamplePngPath);
            var pictures = new List<FileRequiredMetaData>()
            {
                new FileRequiredMetaData(imageStream1, "profile.jpg", "application/octet-stream"),
                new FileRequiredMetaData(imageStream2, "profile2.jpg", "application/octet-stream")
            };

            var request = new ComplexHttpPartsModelRequest(id, address1, profileImage, previousAddresses, pictures);
            using var customStream = new MemoryStream();
            ModelReaderWriter.Write(request, customStream, new ModelReaderWriterOptions("W"));

            Assert.IsNotNull(customStream);
        });

        [SpectorTest]
        public Task HttpPartsNonStringFloatAsync() => Test(async (host) =>
        {
            var temperature = new FloatRequestTemperature(0.5f);
            var request = new FloatRequest(temperature);
            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsNonStringClient()
                .FloatAsync(request);
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

            var response = await new MultiPartClient(host, null).GetFormDataClient().BinaryArrayPartsAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task BinaryArrayPartsConv() => Test(async (host) =>
        {
            var id = "123";
            await using var imageStream1 = File.OpenRead(SamplePngPath);
            await using var imageStream2 = File.OpenRead(SamplePngPath);
            var pictures = new List<MultiPartFile>()
            {
                new(imageStream1, "pictures"),
                new(imageStream2, "pictures")
            };
            var request = new BinaryArrayPartsRequest(id, pictures);

            var response = await new MultiPartClient(host, null).GetFormDataClient().BinaryArrayPartsAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task AnonymousModel() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "profileImage", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient().AnonymousModelAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task AnonymousModelConv() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImageFileDetails = new MultiPartFile(imageStream, "profileImage");

            var response = await new MultiPartClient(host, null).GetFormDataClient().AnonymousModelAsync(profileImageFileDetails);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task AnonymousModelConvUsingBinaryData() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImageFileDetails = new MultiPartFile(BinaryData.FromStream(imageStream), "profileImage");

            var response = await new MultiPartClient(host, null).GetFormDataClient().AnonymousModelAsync(profileImageFileDetails);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task MultiBinaryPartsWithPicture()
            => MultiBinaryParts(true);
        [SpectorTest]
        public Task MultiBinaryPartsWithPictureConv()
            => MultiBinaryPartsConv(true);
        [SpectorTest]
        public Task MultiBinaryPartsWithPictureConvUsingBinaryData()
            => MultiBinaryPartsConvUsingBinaryData(true);

        [SpectorTest]
        public Task MultiBinaryPartsWithoutPicture()
            => MultiBinaryParts(false);

        [SpectorTest]
        public Task MultiBinaryPartsWithoutPictureConv()
            => MultiBinaryPartsConv(false);

        [SpectorTest]
        public Task MultiBinaryPartsWithoutPictureConvUsingBinaryData()
            => MultiBinaryPartsConvUsingBinaryData(false);

        [Test]
        public Task MultiBinaryPartsMRW() => Test(async (host) =>
        {
            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            var profileImage = new MultiPartFile(imageStream1, "profileImage.jpg");

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            var picture = new MultiPartFile(imageStream2, "picture.jpg");
            var request = new MultiBinaryPartsRequest(profileImage);
            var serialized = ModelReaderWriter.Write(request, new ModelReaderWriterOptions("W"));

            Assert.IsNotNull(serialized);
        });

        private Task MultiBinaryPartsConv(bool hasPicture) => Test(async (host) =>
        {
            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            var profileImage = new MultiPartFile(imageStream1, "profileImage.jpg");

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            var picture = new MultiPartFile(imageStream2, "picture.jpg");
            var request = new MultiBinaryPartsRequest(profileImage);
            if (hasPicture)
            {
                request.Picture = picture;
            }
            var response = await new MultiPartClient(host, null).GetFormDataClient().MultiBinaryPartsAsync(request);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        private Task MultiBinaryPartsConvUsingBinaryData(bool hasPicture) => Test(async (host) =>
        {
            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            var profileImage = new MultiPartFile(imageStream1, "profileImage.jpg");

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            var picture = new MultiPartFile(imageStream2, "picture.jpg");
            var request = new MultiBinaryPartsRequest(profileImage);
            if (hasPicture)
            {
                request.Picture = picture;
            }
            var response = await new MultiPartClient(host, null).GetFormDataClient().MultiBinaryPartsAsync(request);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
