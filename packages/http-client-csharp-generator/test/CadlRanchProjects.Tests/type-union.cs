// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using _Type.Union;
using _Type.Union.Models;

using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class TypeUnionTests : CadlRanchTestBase
    {
        [Test]
        public Task GetStringsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringsOnlyClient().GetStringsOnlyAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(GetResponseProp.B, response.Value.Prop);
        });

        [Test]
        public Task SendStringsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringsOnlyClient().SendAsync(SendRequestProp.B);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetStringExtensibleOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringExtensibleClient().GetStringExtensibleAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(new GetResponse1Prop("custom"), response.Value.Prop);
        });

        [Test]
        public Task SendStringExtensibleOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringExtensibleClient().SendAsync(new SendRequest1Prop("custom"));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetStringExtensibleNamedOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringExtensibleNamedClient().GetStringExtensibleNamedAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(new GetResponse2Prop("custom"), response.Value.Prop);
        });

        [Test]
        public Task SendStringExtensibleNamedOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringExtensibleNamedClient().SendAsync(new SendRequest2Prop("custom"));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetIntsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetIntsOnlyClient().GetIntsOnlyAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            AssertEqual(BinaryData.FromObjectAsJson(2), response.Value.Prop);
        });

        [Test]
        public Task SendIntsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetIntsOnlyClient().SendAsync(BinaryData.FromString("2"));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetFloatsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetFloatsOnlyClient().GetFloatsOnlyAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            AssertEqual(BinaryData.FromObjectAsJson(2.2), response.Value.Prop);
        });

        [Test]
        public Task SendFloatsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetFloatsOnlyClient().SendAsync(BinaryData.FromString("2.2"));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetModelsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetModelsOnlyClient().GetModelsOnlyAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            AssertEqual(new Cat("test"), Cat.DeserializeCat(JsonDocument.Parse(response.Value.Prop).RootElement));
        });

        [Test]
        public Task SendModelsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetModelsOnlyClient().SendAsync(BinaryData.FromObjectAsJson(new { name = "test" }));
            Assert.AreEqual(204, response.Status);
        });


        [Test]
        public Task GetEnumsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetEnumsOnlyClient().GetEnumsOnlyAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            AssertEqual(BinaryData.FromObjectAsJson(LR.Right.ToString()), response.Value.Prop.Lr);
            AssertEqual(BinaryData.FromObjectAsJson(UD.Up.ToString()), response.Value.Prop.Ud);
        });

        [Test]
        public Task SendEnumsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetEnumsOnlyClient().SendAsync(new EnumsOnlyCases(BinaryData.FromObjectAsJson(LR.Right.ToString()),
                BinaryData.FromObjectAsJson(UD.Up.ToString())));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetStringAndArray() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringAndArrayClient().GetStringAndArrayAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            AssertEqual(BinaryData.FromObjectAsJson("test"), response.Value.Prop.String);
            AssertEqual(BinaryData.FromObjectAsJson(new List<string>() { "test1", "test2" }), response.Value.Prop.Array);
        });

        [Test]
        public Task SendStringAndArray() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringAndArrayClient().SendAsync(new StringAndArrayCases(BinaryData.FromObjectAsJson("test"),
                BinaryData.FromObjectAsJson(new List<string>() { "test1", "test2" })));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetMixedLiterals() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetMixedLiteralsClient().GetMixedLiteralAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            AssertEqual(BinaryData.FromObjectAsJson("a"), response.Value.Prop.StringLiteral);
            AssertEqual(BinaryData.FromObjectAsJson(2), response.Value.Prop.IntLiteral);
            AssertEqual(BinaryData.FromObjectAsJson(3.3), response.Value.Prop.FloatLiteral);
            AssertEqual(BinaryData.FromObjectAsJson(true), response.Value.Prop.BooleanLiteral);
        });

        [Test]
        public Task SendMixedLiteralsOnlyOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetMixedLiteralsClient().SendAsync(new MixedLiteralsCases(BinaryData.FromObjectAsJson("a"),
                BinaryData.FromObjectAsJson(2),
                BinaryData.FromObjectAsJson(3.3),
                BinaryData.FromObjectAsJson(true)));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetMixedTypes() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetMixedTypesClient().GetMixedTypeAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            AssertEqual(BinaryData.FromObjectAsJson(new { name = "test" }), response.Value.Prop.Model);
            AssertEqual(BinaryData.FromObjectAsJson("a"), response.Value.Prop.Literal);
            AssertEqual(BinaryData.FromObjectAsJson(2), response.Value.Prop.Int);
            AssertEqual(BinaryData.FromObjectAsJson(true), response.Value.Prop.Boolean);
        });

        [Test]
        public Task SendMixedTypesOnlyOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetMixedTypesClient().SendAsync(new MixedTypesCases(BinaryData.FromObjectAsJson(new { name = "test" }),
                BinaryData.FromObjectAsJson("a"),
                BinaryData.FromObjectAsJson(2),
                BinaryData.FromObjectAsJson(true)));
            Assert.AreEqual(204, response.Status);
        });

        private static void AssertEqual(BinaryData source, BinaryData target)
        {
            var sourceData = source.ToArray();
            var targetDate = target.ToArray();
            CollectionAssert.AreEqual(sourceData, targetDate);
        }

        private void AssertEqual(Cat cat1, Cat cat2)
        {
            Assert.IsTrue(cat1 == cat2 || cat1.Name == cat2.Name);
        }
    }
}
