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
        public Task BasicBSL() => Test(async (host) =>
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
        public Task BasicProtocol() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            using MultiPartFormContent content = new();
            content.Add("profileImage", new FileBinaryContent(imageStream) { Filename = "profileImage" });
            content.Add("id", "123");

            var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(content, content.MediaType);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task BasicConv() => Test(async (host) =>
        {
            var id = "123";
            var request = new MultiPartRequest(id, SampleJpgPath);
            request.ProfileImage.Filename = "profileImage.jpg";
            var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        //[SpectorTest]
        //public Task JsonPart() => Test(async (host) =>
        //{
        //    var id = "123";
        //    await using var imageStream = File.OpenRead(SampleJpgPath);

        //    // using stream
        //    var profileImage = new MultiPartFileWithOptionalMetadata(imageStream)
        //    {
        //        Filename = "profileImage.jpg",
        //    };
        //    var request = new MultiPartRequest(id, profileImage);

        //    // get the content type
        //    var contentType = ModelReaderWriter.Write(request, new ModelReaderWriterOptions("MPFD-ContentType"));
        //    var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(request, contentType.ToString());

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        //[Test]
        //public Task BasicMRWRequestAsStream() => Test(async (host) =>
        //{
        //    var id = "123";
        //    await using var imageStream = File.OpenRead(SampleJpgPath);

        //    // using stream
        //    var profileImage = new MultiPartFileWithOptionalMetadata(imageStream)
        //    {
        //        Filename = "profileImage.jpg",
        //    };
        //    var request = new MultiPartRequest(id, profileImage);

        //    // get the content type
        //    var contentType = ModelReaderWriter.Write(request, new ModelReaderWriterOptions("MPFD-ContentType"));
        //    using var customStream = new MemoryStream();
        //    ModelReaderWriter.Write(request, customStream, new ModelReaderWriterOptions("W"));
        //    customStream.Seek(0, SeekOrigin.Begin);

        //    var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(BinaryContent.Create(customStream), contentType.ToString());

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        //[SpectorTest]
        //public Task JsonPartConv() => Test(async (host) =>
        //{
        //    Address address = new Address("X");

        //    await using var imageStream = File.OpenRead(SampleJpgPath);
        //    var profileImage = new MultiPartFileWithOptionalMetadata(imageStream)
        //    {
        //        Filename = "profileImage.jpg",
        //    };

        //    var request = new JsonPartRequest(address, profileImage);

        //    var response = await new MultiPartClient(host, null).GetFormDataClient().JsonPartAsync(request);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        //[SpectorTest]
        //public Task CheckFileNameAndContentType() => Test(async (host) =>
        //{
        //    using MultiPartFormContent content = new MultiPartFormContent();
        //    content.Add("123", "id");

        //    await using var imageStream = File.OpenRead(SampleJpgPath);
        //    content.Add(imageStream, "profileImage", "hello.jpg", "image/jpg");

        //    var response = await new MultiPartClient(host, null).GetFormDataClient().CheckFileNameAndContentTypeAsync(content, content.ContentType, null);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        //[SpectorTest]
        //public Task CheckFileNameAndContentTypeConv() => Test(async (host) =>
        //{
        //    var id = "123";

        //    await using var imageStream = File.OpenRead(SampleJpgPath);
        //    var profileImage = new MultiPartFileWithOptionalMetadata(imageStream)
        //    {
        //        Filename = "hello.jpg",
        //        ContentType = "image/jpg"
        //    };
        //    var request = new MultiPartRequest(id, profileImage);

        //    var response = await new MultiPartClient(host, null).GetFormDataClient().CheckFileNameAndContentTypeAsync(request);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        //[SpectorTest]
        //public Task CheckFileNameAndContentTypeConvUsingBinaryData() => Test(async (host) =>
        //{
        //    var id = "123";

        //    await using var imageStream = File.OpenRead(SampleJpgPath);
        //    var data = BinaryData.FromStream(imageStream);
        //    var profileImage = new MultiPartFileWithOptionalMetadata(data)
        //    {
        //        Filename = "hello.jpg",
        //        ContentType = "image/jpg"
        //    };
        //    var request = new MultiPartRequest(id, profileImage);

        //    var response = await new MultiPartClient(host, null).GetFormDataClient().CheckFileNameAndContentTypeAsync(request);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        [SpectorTest]
        public Task FileArrayAndBasicProtocol() => Test(async (host) =>
        {
            using MultiPartFormContent content = new();
            content.Add("id", "123");
            content.Add("address", new Address("X"), ModelSerializationExtensions.WireOptions, new PayloadMultiPartContext());
            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            content.Add("profileImage", new FileBinaryContent(imageStream1) { Filename = "profileImage.jpg" });

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            await using var imageStream3 = File.OpenRead(SamplePngPath);

            content.Add("pictures", new FileBinaryContent(imageStream2) { Filename = "sample.png" });
            content.Add("pictures", new FileBinaryContent(imageStream3) { Filename = "sample.png" });

            var response = await new MultiPartClient(host, null).GetFormDataClient().FileArrayAndBasicAsync(content, content.MediaType);

            Assert.AreEqual(204, response.GetRawResponse().Status);
            // Assert all streams are disposed
            Assert.IsFalse(imageStream1.CanRead);
            Assert.IsFalse(imageStream2.CanRead);
            Assert.IsFalse(imageStream3.CanRead);
        });

        [SpectorTest]
        public Task FileArrayAndBasicConv() => Test(async (host) =>
        {
            var id = "123";
            Address address = new Address("X");

            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            using var profileImage = new FileBinaryContent(imageStream1)
            {
                Filename = "profileImage.jpg",
            };

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            await using var imageStream3 = File.OpenRead(SamplePngPath);
            var pictures = new List<FileBinaryContent>()
            {
                new(imageStream2) { Filename = "sample.png" },
                new(imageStream3) { Filename = "sample.png" },
            };

            var request = new ComplexPartsRequest(id, address, profileImage, pictures);

            var response = await new MultiPartClient(host, null).GetFormDataClient().FileArrayAndBasicAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);

            // Assert all streams are disposed
            // Test that streams are properly disposed
            Assert.Throws<ObjectDisposedException>(() => imageStream1.ReadByte());
            Assert.Throws<ObjectDisposedException>(() => imageStream2.ReadByte());
            Assert.Throws<ObjectDisposedException>(() => imageStream3.ReadByte());
        });

        [SpectorTest]
        public Task HttpPartsImageJpegContentType() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);

            // using stream
            var profileImage = new FileBinaryContent(imageStream, "image/jpg")
            {
                Filename = "hello.jpg",
            };

            using MultiPartFormContent content = new();
            content.Add("profileImage", profileImage);

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .ImageJpegContentTypeAsync(content, content.MediaType);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task HttpPartsImageJpegContentTypeConv() => Test(async (host) =>
        {
            var request = new FileWithHttpPartSpecificContentTypeRequest("hello.jpg", SampleJpgPath);

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .ImageJpegContentTypeAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        //[SpectorTest]
        //public Task HttpPartsOptionalContentType() => Test(async (host) =>
        //{
        //    using MultiPartFormContent contentWithNoContentType = new MultiPartFormContent();
        //    await using var imageStream1 = File.OpenRead(SampleJpgPath);
        //    contentWithNoContentType.Add(imageStream1, "profileImage", "hello.jpg");

        //    var response = await new MultiPartClient(host, null).GetFormDataClient()
        //        .GetFormDataHttpPartsClient()
        //        .GetFormDataHttpPartsContentTypeClient()
        //        .OptionalContentTypeAsync(contentWithNoContentType, contentWithNoContentType.ContentType, null);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);

        //    using MultiPartFormContent contentWithContentType = new MultiPartFormContent();
        //    await using var imageStream2 = File.OpenRead(SampleJpgPath);
        //    contentWithContentType.Add(imageStream2, "profileImage", "hello.jpg", "application/octet-stream");

        //    response = await new MultiPartClient(host, null).GetFormDataClient()
        //        .GetFormDataHttpPartsClient()
        //        .GetFormDataHttpPartsContentTypeClient()
        //        .OptionalContentTypeAsync(contentWithContentType, contentWithContentType.ContentType, null);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        //[SpectorTest]
        //public Task HttpPartsOptionalContentTypeConv() => Test(async (host) =>
        //{
        //    await using var imageStream1 = File.OpenRead(SampleJpgPath);
        //    var profileImage = new MultiPartFileWithRequiredFilename(imageStream1, "hello.jpg");
        //    var request = new FileWithHttpPartOptionalContentTypeRequest(profileImage);

        //    var response = await new MultiPartClient(host, null).GetFormDataClient()
        //        .GetFormDataHttpPartsClient()
        //        .GetFormDataHttpPartsContentTypeClient()
        //        .OptionalContentTypeAsync(request);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);

        //    await using var imageStream2 = File.OpenRead(SampleJpgPath);
        //    var profileImage2 = new MultiPartFileWithRequiredFilename(imageStream2, "hello.jpg")
        //    {
        //        ContentType = "application/octet-stream"
        //    };
        //    request = new FileWithHttpPartOptionalContentTypeRequest(profileImage2);

        //    response = await new MultiPartClient(host, null).GetFormDataClient()
        //        .GetFormDataHttpPartsClient()
        //        .GetFormDataHttpPartsContentTypeClient()
        //        .OptionalContentTypeAsync(request);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        //[SpectorTest]
        //public Task HttpPartsRequiredContentTypeProtocol() => Test(async (host) =>
        //{
        //    await using var imageStream = File.OpenRead(SampleJpgPath);
        //    using FileBinaryContent file = new FileBinaryContent(imageStream)
        //    {
        //        Filename = "hello.jpg",
        //        ContentType = "application/octet-stream"
        //    };
        //    List<BinaryContent> parts = new List<BinaryContent>
        //    {
        //        BinaryContent.CreateMultipartFormDataPart("profileImage", file)
        //    };
        //    using BinaryContent content = BinaryContent.CreateMultipartFormDataContent(parts);

        //    var response = await new MultiPartClient(host, null).GetFormDataClient()
        //        .GetFormDataHttpPartsClient()
        //        .GetFormDataHttpPartsContentTypeClient()
        //        .RequiredContentTypeAsync(content, content.ContentType, null);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        [SpectorTest]
        public Task HttpPartsRequiredContentTypeConv() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var request = new FileWithHttpPartRequiredContentTypeRequest("hello.jpg", "application/octet-stream", BinaryData.FromStream(imageStream));

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .RequiredContentTypeAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task HttpPartsJsonArrayAndFileArrayProtocol() => Test(async (host) =>
        {
            using MultiPartFormContent content = new();
            content.Add("id", "123");
            content.Add("address", new Address("X"), ModelSerializationExtensions.WireOptions, new PayloadMultiPartContext());

            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            content.Add("profileImage", new FileBinaryContent(imageStream1) { Filename = "profileImage.jpg" });

            BinaryData previousAddressesData = ModelReaderWriter.Write(new List<Address>
            {
                new Address("Y"),
                new Address("Z")
            }, ModelSerializationExtensions.WireOptions, new PayloadMultiPartContext());
            content.Add("previousAddresses", previousAddressesData);

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            await using var imageStream3 = File.OpenRead(SamplePngPath);
            content.Add("pictures", new FileBinaryContent(imageStream2) { Filename = "sample.png" });
            content.Add("pictures", new FileBinaryContent(imageStream3) { Filename = "sample.png" });

            var response = await new MultiPartClient(host, null).GetFormDataClient()
               .GetFormDataHttpPartsClient()
               .JsonArrayAndFileArrayAsync(content, content.MediaType);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        //[Test]
        //public Task HttpPartsRequiredContentTypeMRWAsStream() => Test(async (host) =>
        //{
        //    await using var imageStream = File.OpenRead(SampleJpgPath);
        //    var profileImage = new MultiPartFileWithRequiredMetadata(BinaryData.FromStream(imageStream), "hello.jpg", "application/octet-stream");
        //    var file = new MultiPartFileWithRequiredFilename(imageStream, "hello.jpg");
        //    var request = new FileWithHttpPartRequiredContentTypeRequest(profileImage);

        //    using var customStream = new MemoryStream();
        //    ModelReaderWriter.Write(request, customStream, new ModelReaderWriterOptions("W"));
        //    var contentType = ModelReaderWriter.Write(request, new ModelReaderWriterOptions("MPFD-ContentType")).ToString();
        //    customStream.Seek(0, SeekOrigin.Begin);

        //    var response = await new MultiPartClient(host, null).GetFormDataClient()
        //       .GetFormDataHttpPartsClient()
        //       .GetFormDataHttpPartsContentTypeClient()
        //       .RequiredContentTypeAsync(BinaryContent.Create(customStream), contentType);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        //[SpectorTest]
        //[Ignore("")]
        //public Task HttpPartsJsonArrayAndFileArrayConv() => Test(async (host) =>
        //{
        //    string id = "123";
        //    var address1 = new Address("X");
        //    var address2 = new Address("Y");
        //    var previousAddresses = new List<Address>() { address1, address2 };

        //    await using var imageStream1 = File.OpenRead(SampleJpgPath);
        //    var profileImage = new MultiPartFileWithRequiredMetadata(imageStream1, "profile.jpg", "application/octet-stream");

        //    await using var imageStream2 = File.OpenRead(SamplePngPath);
        //    await using var imageStream3 = File.OpenRead(SamplePngPath);
        //    var pictures = new List<MultiPartFileWithRequiredMetadata>()
        //    {
        //        new MultiPartFileWithRequiredMetadata(imageStream1, "profile.jpg", "application/octet-stream"),
        //        new MultiPartFileWithRequiredMetadata(imageStream2, "profile2.jpg", "application/octet-stream")
        //    };

        //    var request = new ComplexHttpPartsModelRequest(id, address1, profileImage, previousAddresses, pictures);

        //    var response = await new MultiPartClient(host, null).GetFormDataClient()
        //        .GetFormDataHttpPartsClient()
        //        .JsonArrayAndFileArrayAsync(request);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        //[SpectorTest]
        //public Task HttpPartsNonStringFloatProtocol() => Test(async (host) =>
        //{
        //    List<BinaryContent> parts = new List<BinaryContent>();
        //    parts.Add(BinaryContent.CreateMultipartFormDataPart("temperature", 0.5f));

        //    using BinaryContent content = BinaryContent.CreateMultipartFormDataContent(parts);
        //    using var customStream = new MemoryStream();
        //    var response = await new MultiPartClient(host, null).GetFormDataClient()
        //        .GetFormDataHttpPartsClient()
        //        .GetFormDataHttpPartsNonStringClient()
        //        .FloatAsync(content, content.ContentType);
        //});

        [SpectorTest]
        public Task HttpPartsNonStringFloatAsync() => Test(async (host) =>
        {
            var request = new FloatRequest(0.5f);
            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsNonStringClient()
                .FloatAsync(request);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        //[SpectorTest]
        //public Task BinaryArrayParts() => Test(async (host) =>
        //{
        //    using MultiPartFormContent content = new MultiPartFormContent();
        //    content.Add("123", "id");
        //    await using var imageStream1 = File.OpenRead(SamplePngPath);
        //    content.Add(imageStream1, "pictures", "pictures", "application/octet-stream");

        //    await using var imageStream2 = File.OpenRead(SamplePngPath);
        //    content.Add(imageStream2, "pictures", "pictures", "application/octet-stream");

        //    var response = await new MultiPartClient(host, null).GetFormDataClient().BinaryArrayPartsAsync(content, content.ContentType, null);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        //[SpectorTest]
        //public Task BinaryArrayPartsConv() => Test(async (host) =>
        //{
        //    var id = "123";
        //    await using var imageStream1 = File.OpenRead(SamplePngPath);
        //    await using var imageStream2 = File.OpenRead(SamplePngPath);
        //    var pictures = new List<MultiPartFileWithOptionalMetadata>()
        //    {
        //        new(imageStream1) { Filename = "pictures" },
        //        new(imageStream2) { Filename = "pictures" },
        //    };
        //    var request = new BinaryArrayPartsRequest(id, pictures);

        //    var response = await new MultiPartClient(host, null).GetFormDataClient().BinaryArrayPartsAsync(request);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        //[SpectorTest]
        //public Task AnonymousModelProtocol() => Test(async (host) =>
        //{
        //    await using var imageStream = File.OpenRead(SampleJpgPath);
        //    List<BinaryContent> parts = [];
        //    parts.Add(BinaryContent.CreateMultipartFormDataPart("profileImage", new FileBinaryContent(imageStream) { Filename = "profileImage.jpg" }));

        //    using BinaryContent content = BinaryContent.CreateMultipartFormDataContent(parts);
        //    var response = await new MultiPartClient(host, null).GetFormDataClient().AnonymousModelAsync(content, content.ContentType, null);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        [SpectorTest]
        public Task AnonymousModelConv() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            using var profileImage = new FileBinaryContent(BinaryData.FromStream(imageStream))
            {
                Filename = "profileImage.jpg",
            };
            var request = new AnonymousModelRequest(profileImage);
            var response = await new MultiPartClient(host, null).GetFormDataClient().AnonymousModelAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        //[SpectorTest]
        //public Task AnonymousModelConvUsingBinaryData() => Test(async (host) =>
        //{
        //    await using var imageStream = File.OpenRead(SampleJpgPath);
        //    var profileImageFileDetails = new MultiPartFileWithOptionalMetadata(BinaryData.FromStream(imageStream))
        //    {
        //        Filename = "profileImage.jpg",
        //    };

        //    var response = await new MultiPartClient(host, null).GetFormDataClient().AnonymousModelAsync(profileImageFileDetails);

        //    Assert.AreEqual(204, response.GetRawResponse().Status);
        //});

        [SpectorTest]
        public Task MultiBinaryPartsWithPictureConv()
            => MultiBinaryPartsConv(true);


        [SpectorTest]
        public Task MultiBinaryPartsWithoutPictureConv()
            => MultiBinaryPartsConv(false);


        private Task MultiBinaryPartsConv(bool hasPicture) => Test(async (host) =>
        {
            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            using var profileImage = new FileBinaryContent(imageStream1)
            {
                Filename = "profileImage.jpg",
            };

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            using var picture = new FileBinaryContent(imageStream2)
            {
                Filename = "picture.jpg",
            };
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
