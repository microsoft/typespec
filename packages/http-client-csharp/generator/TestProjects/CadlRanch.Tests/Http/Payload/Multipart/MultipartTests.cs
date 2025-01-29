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

            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "profileImage", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
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

        [CadlRanchTest]
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

        [CadlRanchTest]
        public Task BasicConvUsingBinaryData() => Test(async (host) =>
        {
            var id = "123";
            await using var imageStream = File.OpenRead(SampleJpgPath);
            BinaryData image = BinaryData.FromStream(imageStream);

            var profileImage = new MultiPartFile(image, "profileImage.jpg");
            var request = new MultiPartRequest(id, profileImage);
            var response = await new MultiPartClient(host, null).GetFormDataClient().BasicAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [Test]
        public Task BasicMRW() => Test(async (host) =>
        {
            var id = "123";
            await using var imageStream = File.OpenRead(SampleJpgPath);

            // using stream
            var profileImage = new MultiPartFile(imageStream, "profileImage.jpg");
            var request = new MultiPartRequest(id, profileImage);

            var serialized = ModelReaderWriter.Write(request, ModelSerializationExtensions.WireOptions);

            Assert.IsNotNull(serialized);
        });

        [CadlRanchTest]
        public Task JsonPart() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("{\"city\":\"X\"}", "address");

            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "profileImage", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient().JsonPartAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task JsonPartConv() => Test(async (host) =>
        {
            Address address = new Address("X");

            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new MultiPartFile(imageStream, "profileImage.jpg");

            var request = new JsonPartRequest(address, profileImage);

            var response = await new MultiPartClient(host, null).GetFormDataClient().JsonPartAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task JsonPartConvUsingBinaryData() => Test(async (host) =>
        {
            Address address = new Address("X");

            await using var imageStream = File.OpenRead(SampleJpgPath);
            BinaryData image = BinaryData.FromStream(imageStream);

            var profileImage = new MultiPartFile(image, "profileImage.jpg");
            var request = new JsonPartRequest(address, profileImage);
            var response = await new MultiPartClient(host, null).GetFormDataClient().JsonPartAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [Test]
        public Task JsonPartMRW() => Test(async (host) =>
        {
            Address address = new Address("X");
            await using var imageStream = File.OpenRead(SampleJpgPath);

            var profileImage = new MultiPartFile(imageStream, "profileImage.jpg");
            var request = new JsonPartRequest(address, profileImage);

            var serialized = ModelReaderWriter.Write(request, ModelSerializationExtensions.WireOptions);

            Assert.IsNotNull(serialized);
        });

        [CadlRanchTest]
        public Task CheckFileNameAndContentType() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            content.Add("123", "id");

            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "hello.jpg", "image/jpg");

            var response = await new MultiPartClient(host, null).GetFormDataClient().CheckFileNameAndContentTypeAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task CheckFileNameAndContentTypeConv() => Test(async (host) =>
        {
            var id = "123";

            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new MultiPartFile(imageStream, "hello.jpg", "image/jpg");
            var request = new MultiPartRequest(id, profileImage);

            var response = await new MultiPartClient(host, null).GetFormDataClient().CheckFileNameAndContentTypeAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task CheckFileNameAndContentTypeConvUsingBinaryData() => Test(async (host) =>
        {
            var id = "123";

            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new MultiPartFile(imageStream, "hello.jpg", "image/jpg");
            var request = new MultiPartRequest(id, profileImage);

            var response = await new MultiPartClient(host, null).GetFormDataClient().CheckFileNameAndContentTypeAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
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

        [CadlRanchTest]
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

        [CadlRanchTest]
        public Task FileArrayAndBasicConvUsingBinaryData() => Test(async (host) =>
        {
            var id = "123";
            Address address = new Address("X");

            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            var profileImage = new MultiPartFile(BinaryData.FromStream(imageStream1), "profileImage.jpg");

            await using var imageStream2 = File.OpenRead(SamplePngPath);
            await using var imageStream3 = File.OpenRead(SamplePngPath);
            var pictures = new List<MultiPartFile>()
            {
                new(BinaryData.FromStream(imageStream2), "sample.png"),
                new(BinaryData.FromStream(imageStream3), "sample.png")
            };

            var request = new ComplexPartsRequest(id, address, profileImage, pictures);

            var response = await new MultiPartClient(host, null).GetFormDataClient().FileArrayAndBasicAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [Test]
        public Task FileArrayAndBasicMRW() => Test(async (host) =>
        {
            var id = "123";
            Address address = new Address("X");
            await using var imageStream = File.OpenRead(SampleJpgPath);

            // using stream
            var profileImage = new MultiPartFile(imageStream, "profileImage.jpg");
            await using var imageStream2 = File.OpenRead(SamplePngPath);
            await using var imageStream3 = File.OpenRead(SamplePngPath);
            var pictures = new List<MultiPartFile>()
            {
                new(imageStream2, "sample.png"),
                new(imageStream3, "sample.png")
            };

            var request = new ComplexPartsRequest(id, address, profileImage, pictures);

            var serialized = ModelReaderWriter.Write(request, ModelSerializationExtensions.WireOptions);

            Assert.IsNotNull(serialized);
        });

        [CadlRanchTest]
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

        [CadlRanchTest]
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

        [CadlRanchTest]
        public Task HttpPartsImageJpegContentTypeConvUsingBinaryData() => Test(async (host) =>
        {
            await using var imageStream1 = File.OpenRead(SampleJpgPath);
            var profileImage = new FileSpecificContentType(BinaryData.FromStream(imageStream1), "hello.jpg");
            var request = new FileWithHttpPartSpecificContentTypeRequest(profileImage);
            var response = await new MultiPartClient(host, null).GetFormDataClient()
               .GetFormDataHttpPartsClient()
               .GetFormDataHttpPartsContentTypeClient()
               .ImageJpegContentTypeAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [Test]
        public Task HttpPartsImageJpegContentTypeMRW() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new FileSpecificContentType(imageStream, "hello.jpg");
            var request = new FileWithHttpPartSpecificContentTypeRequest(profileImage);

            var serialized = ModelReaderWriter.Write(request, ModelSerializationExtensions.WireOptions);

            Assert.IsNotNull(serialized);
        });

        [CadlRanchTest]
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

        [CadlRanchTest]
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

            using MultiPartFormDataBinaryContent contentWithContentType = new MultiPartFormDataBinaryContent();
            await using var imageStream2 = File.OpenRead(SampleJpgPath);
            var profileImage2 = new FileOptionalContentType(imageStream2, "hello.jpg", "application/octet-stream");
            request = new FileWithHttpPartOptionalContentTypeRequest(profileImage2);

            response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .OptionalContentTypeAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
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

        [CadlRanchTest]
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

        [CadlRanchTest]
        public Task HttpPartsRequiredContentTypeConvUsingBinaryData() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new FileRequiredMetaData(BinaryData.FromStream(imageStream), "hello.jpg", "application/octet-stream");
            var file = new MultiPartFile(imageStream, "hello.jpg");
            var request = new FileWithHttpPartRequiredContentTypeRequest(profileImage);

            var response = await new MultiPartClient(host, null).GetFormDataClient()
                .GetFormDataHttpPartsClient()
                .GetFormDataHttpPartsContentTypeClient()
                .RequiredContentTypeAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [Test]
        public Task HttpPartsRequiredContentTypeMRW() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImage = new FileRequiredMetaData(BinaryData.FromStream(imageStream), "hello.jpg", "application/octet-stream");
            var file = new MultiPartFile(imageStream, "hello.jpg");
            var request = new FileWithHttpPartRequiredContentTypeRequest(profileImage);

            var serialized = ModelReaderWriter.Write(request, ModelSerializationExtensions.WireOptions);

            Assert.IsNotNull(serialized);
        });

        [CadlRanchTest]
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

        [CadlRanchTest]
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

        [Test]
        public Task HttpPartsJsonArrayAndFileArrayMRW() => Test(async (host) =>
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
            var serialized = ModelReaderWriter.Write(request, ModelSerializationExtensions.WireOptions);

            Assert.IsNotNull(serialized);
        });

        [CadlRanchTest]
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

        [CadlRanchTest]
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

        [CadlRanchTest]
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

        [CadlRanchTest]
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

        [CadlRanchTest]
        public Task BinaryArrayConvUsingBinaryData() => Test(async (host) =>
        {
            var id = "123";
            await using var imageStream1 = File.OpenRead(SamplePngPath);
            BinaryData imageData1 = BinaryData.FromStream(imageStream1);
            await using var imageStream2 = File.OpenRead(SamplePngPath);
            BinaryData imageData2 = BinaryData.FromStream(imageStream2);
            var pictures = new List<MultiPartFile>()
            {
                new(imageData1, "pictures"),
                new(imageData2, "pictures")
            };
            var request = new BinaryArrayPartsRequest(id, pictures);
            var response = await new MultiPartClient(host, null).GetFormDataClient().BinaryArrayPartsAsync(request);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task BinaryArrayPartsMRW() => Test(async (host) =>
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

            var serialized = ModelReaderWriter.Write(request, ModelSerializationExtensions.WireOptions);

            Assert.IsNotNull(serialized);
        });

        [CadlRanchTest]
        public Task AnonymousModel() => Test(async (host) =>
        {
            using MultiPartFormDataBinaryContent content = new MultiPartFormDataBinaryContent();
            await using var imageStream = File.OpenRead(SampleJpgPath);
            content.Add(imageStream, "profileImage", "profileImage", "application/octet-stream");

            var response = await new MultiPartClient(host, null).GetFormDataClient().AnonymousModelAsync(content, content.ContentType, null);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task AnonymousModelConv() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImageFileDetails = new MultiPartFile(imageStream, "profileImage");

            var response = await new MultiPartClient(host, null).GetFormDataClient().AnonymousModelAsync(profileImageFileDetails);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task AnonymousModelConvUsingBinaryData() => Test(async (host) =>
        {
            await using var imageStream = File.OpenRead(SampleJpgPath);
            var profileImageFileDetails = new MultiPartFile(BinaryData.FromStream(imageStream), "profileImage");

            var response = await new MultiPartClient(host, null).GetFormDataClient().AnonymousModelAsync(profileImageFileDetails);

            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task MultiBinaryPartsWithPicture()
            => MultiBinaryParts(true);
        [CadlRanchTest]
        public Task MultiBinaryPartsWithPictureConv()
            => MultiBinaryPartsConv(true);
        [CadlRanchTest]
        public Task MultiBinaryPartsWithPictureConvUsingBinaryData()
            => MultiBinaryPartsConvUsingBinaryData(true);

        [CadlRanchTest]
        public Task MultiBinaryPartsWithoutPicture()
            => MultiBinaryParts(false);

        [CadlRanchTest]
        public Task MultiBinaryPartsWithoutPictureConv()
            => MultiBinaryPartsConv(false);

        [CadlRanchTest]
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
            var serialized = ModelReaderWriter.Write(request, ModelSerializationExtensions.WireOptions);

            Assert.IsNotNull(serialized);
        });

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
            var response = await new MultiPartClient(host, null).GetFormDataClient().MultiBinaryPartsAsync(content, content.ContentType, null);
            Assert.AreEqual(204, response.GetRawResponse().Status);
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
