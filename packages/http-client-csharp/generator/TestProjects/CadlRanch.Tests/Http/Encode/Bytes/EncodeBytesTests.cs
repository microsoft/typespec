// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.IO;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Encode.Bytes;
using Encode.Bytes.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http.Encode.Bytes
{
    public class EncodeBytesTests : CadlRanchTestBase
    {
        private string SamplePngPath = Path.Combine(CadlRanchServer.GetSpecDirectory(), "assets", "image.png");

        [CadlRanchTest]
        public Task Encode_Bytes_Query_default() => Test(async (host) =>
        {
            BinaryData data = BinaryData.FromString("test");

            ClientResult result = await new BytesClient(host, null).GetQueryClient().DefaultAsync(data);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_Query_base64() => Test(async (host) =>
        {
            BinaryData data = BinaryData.FromString("test");
            ClientResult result = await new BytesClient(host, null).GetQueryClient().Base64Async(data);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_Query_base64url() => Test(async (host) =>
        {
            BinaryData data = BinaryData.FromString("test");
            ClientResult result = await new BytesClient(host, null).GetQueryClient().Base64urlAsync(data);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_Query_base64urlArray() => Test(async (host) =>
        {
            BinaryData data1 = BinaryData.FromString("test");
            BinaryData data2 = BinaryData.FromString("test");
            ClientResult result = await new BytesClient(host, null).GetQueryClient().Base64urlArrayAsync(new[] { data1, data2 });
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_Property_default() => Test(async (host) =>
        {
            BinaryData data = BinaryData.FromString("test");
            var body = new DefaultBytesProperty(data);
            DefaultBytesProperty response = await new BytesClient(host, null).GetPropertyClient().DefaultAsync(body);
            BinaryDataAssert.AreEqual(body.Value, response.Value);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_Property_base64() => Test(async (host) =>
        {
            BinaryData data = BinaryData.FromString("test");
            var body = new Base64BytesProperty(data);
            Base64BytesProperty response = await new BytesClient(host, null).GetPropertyClient().Base64Async(body);
            BinaryDataAssert.AreEqual(body.Value, response.Value);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_Property_base64url() => Test(async (host) =>
        {
            BinaryData data = BinaryData.FromString("test");
            var body = new Base64urlBytesProperty(data);
            Base64urlBytesProperty response = await new BytesClient(host, null).GetPropertyClient().Base64urlAsync(body);
            BinaryDataAssert.AreEqual(body.Value, response.Value);
        });

        [CadlRanchTest]
        public Task Base64urlArrayBytesProperty() => Test(async (host) =>
        {
            BinaryData data1 = BinaryData.FromString("test");
            BinaryData data2 = BinaryData.FromString("test");
            var body = new Base64urlArrayBytesProperty(new[] {data1,data2});
            Base64urlArrayBytesProperty response = await new BytesClient(host, null).GetPropertyClient().Base64urlArrayAsync(body);
            BinaryDataAssert.AreEqual(body.Value[0], response.Value[0]);
            BinaryDataAssert.AreEqual(body.Value[1], response.Value[1]);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_Header_default() => Test(async (host) =>
        {
            BinaryData data = BinaryData.FromString("test");

            ClientResult result = await new BytesClient(host, null).GetHeaderClient().DefaultAsync(data);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_Header_base64() => Test(async (host) =>
        {

            BinaryData data = BinaryData.FromString("test");
            ClientResult result = await new BytesClient(host, null).GetHeaderClient().Base64Async(data);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_Header_base64url() => Test(async (host) =>
        {
            BinaryData data = BinaryData.FromString("test");
            ClientResult result = await new BytesClient(host, null).GetHeaderClient().Base64urlAsync(data);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_Header_base64urlArray() => Test(async (host) =>
        {
            BinaryData data1 = BinaryData.FromString("test");
            BinaryData data2 = BinaryData.FromString("test");
            ClientResult result = await new BytesClient(host, null).GetHeaderClient().Base64urlArrayAsync(new[] { data1, data2 });
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_RequestBody_default() => Test(async (host) =>
        {
            BinaryData data = new BinaryData($"\"{Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("test"))}\"");
            ClientResult result = await new BytesClient(host, null).GetRequestBodyClient().DefaultAsync(data);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_RequestBody_octetStream() => Test(async (host) =>
        {
            BinaryData data = new BinaryData(File.ReadAllBytes(SamplePngPath));
            ClientResult result = await new BytesClient(host, null).GetRequestBodyClient().OctetStreamAsync(data);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_RequestBody_customContentType() => Test(async (host) =>
        {
            BinaryData data = new BinaryData(File.ReadAllBytes(SamplePngPath));
            ClientResult result = await new BytesClient(host, null).GetRequestBodyClient().CustomContentTypeAsync(data);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_RequestBody_base64() => Test(async (host) =>
        {
            BinaryData data = new BinaryData($"\"{Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("test"))}\"");
            ClientResult result = await new BytesClient(host, null).GetRequestBodyClient().Base64Async(data);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_RequestBody_base64url() => Test(async (host) =>
        {
            BinaryData data = new BinaryData($"\"{Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("test")).Replace('+', '-').Replace('/', '_').Replace("=", "")}\"");
            ClientResult result = await new BytesClient(host, null).GetRequestBodyClient().Base64urlAsync(data);
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_ResponseBody_default() => Test(async (host) =>
        {
            var response = await new BytesClient(host, null).GetResponseBodyClient().DefaultAsync();
            CollectionAssert.AreEqual(BinaryData.FromObjectAsJson("dGVzdA==").ToArray(), response.Value.ToArray());
        });

        [CadlRanchTest]
        public Task Encode_Bytes_ResponseBody_octetStream() => Test(async (host) =>
        {
            BinaryData data = new BinaryData(File.ReadAllBytes(SamplePngPath));
            var response = await new BytesClient(host, null).GetResponseBodyClient().OctetStreamAsync();
            CollectionAssert.AreEqual(data.ToArray(), response.Value.ToArray());
        });

        [CadlRanchTest]
        public Task Encode_Bytes_ResponseBody_customContentType() => Test(async (host) =>
        {
            BinaryData data = new BinaryData(File.ReadAllBytes(SamplePngPath));
            BinaryData result = await new BytesClient(host, null).GetResponseBodyClient().CustomContentTypeAsync();
            BinaryDataAssert.AreEqual(data, result);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_ResponseBody_base64() => Test(async (host) =>
        {
            BinaryData result = await new BytesClient(host, null).GetResponseBodyClient().Base64Async();
            BinaryDataAssert.AreEqual(BinaryData.FromObjectAsJson("dGVzdA=="), result);
        });

        [CadlRanchTest]
        public Task Encode_Bytes_ResponseBody_base64url() => Test(async (host) =>
        {
            BinaryData result = await new BytesClient(host, null).GetResponseBodyClient().Base64urlAsync();
            BinaryDataAssert.AreEqual(BinaryData.FromObjectAsJson("dGVzdA"), result);
        });
    }
}
