// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;
using System.Threading.Tasks;
using _Type.Union;
using _Type.Union.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http._Type.Union
{
    internal class UnionTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task GetStringsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringsOnlyClient().GetAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(GetResponseProp4.B, response.Value.Prop);
        });

        [CadlRanchTest]
        public Task SendStringsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringsOnlyClient().SendAsync(GetResponseProp4.B);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetStringExtensibleOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringExtensibleClient().GetAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(new GetResponseProp3("custom"), response.Value.Prop);
        });

        [CadlRanchTest]
        public Task SendStringExtensibleOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringExtensibleClient().SendAsync(new GetResponseProp3("custom"));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetStringExtensibleNamedOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringExtensibleNamedClient().GetAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(new StringExtensibleNamedUnion("custom"), response.Value.Prop);
        });

        [CadlRanchTest]
        public Task SendStringExtensibleNamedOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringExtensibleNamedClient().SendAsync(new StringExtensibleNamedUnion("custom"));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetIntsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetIntsOnlyClient().GetAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(GetResponseProp2._2, response.Value.Prop);
        });

        [CadlRanchTest]
        public Task SendIntsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetIntsOnlyClient().SendAsync(GetResponseProp2._2);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetFloatsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetFloatsOnlyClient().GetAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(GetResponseProp1._22, response.Value.Prop);
        });

        [CadlRanchTest]
        public Task SendFloatsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetFloatsOnlyClient().SendAsync(GetResponseProp1._22);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetModelsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetModelsOnlyClient().GetAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task SendModelsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetModelsOnlyClient().SendAsync(ModelReaderWriter.Write(new Cat("test")));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetEnumsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetEnumsOnlyClient().GetAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(EnumsOnlyCasesLr.Right, response.Value.Prop.Lr);
            Assert.AreEqual(EnumsOnlyCasesUd.Up, response.Value.Prop.Ud);
        });

        [CadlRanchTest]
        public Task SendEnumsOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetEnumsOnlyClient().SendAsync(new EnumsOnlyCases(EnumsOnlyCasesLr.Right, EnumsOnlyCasesUd.Up));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetStringAndArray() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringAndArrayClient().GetAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            AssertEqual(BinaryData.FromObjectAsJson("test"), response.Value.Prop.String);
            AssertEqual(BinaryData.FromObjectAsJson(new List<string>() { "test1", "test2" }), response.Value.Prop.Array);
        });

        [CadlRanchTest]
        public Task SendStringAndArray() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetStringAndArrayClient().SendAsync(new StringAndArrayCases(BinaryData.FromObjectAsJson("test"),
                BinaryData.FromObjectAsJson(new List<string>() { "test1", "test2" })));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetMixedLiterals() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetMixedLiteralsClient().GetAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            AssertEqual(BinaryData.FromObjectAsJson("a"), response.Value.Prop.StringLiteral);
            AssertEqual(BinaryData.FromObjectAsJson(2), response.Value.Prop.IntLiteral);
            AssertEqual(BinaryData.FromObjectAsJson(3.3), response.Value.Prop.FloatLiteral);
            AssertEqual(BinaryData.FromObjectAsJson(true), response.Value.Prop.BooleanLiteral);
        });

        [CadlRanchTest]
        public Task SendMixedLiteralsOnlyOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetMixedLiteralsClient().SendAsync(new MixedLiteralsCases(BinaryData.FromObjectAsJson("a"),
                BinaryData.FromObjectAsJson(2),
                BinaryData.FromObjectAsJson(3.3),
                BinaryData.FromObjectAsJson(true)));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetMixedTypes() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetMixedTypesClient().GetAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            AssertEqual(BinaryData.FromObjectAsJson(new { name = "test" }), response.Value.Prop.Model);
            AssertEqual(BinaryData.FromObjectAsJson("a"), response.Value.Prop.Literal);
            AssertEqual(BinaryData.FromObjectAsJson(2), response.Value.Prop.Int);
            AssertEqual(BinaryData.FromObjectAsJson(true), response.Value.Prop.Boolean);
        });

        [CadlRanchTest]
        public Task SendMixedTypesOnlyOnly() => Test(async (host) =>
        {
            var response = await new UnionClient(host, null).GetMixedTypesClient().SendAsync(new MixedTypesCases(
                ModelReaderWriter.Write(new Cat("test")),
                BinaryData.FromObjectAsJson("a"),
                BinaryData.FromObjectAsJson(2),
                BinaryData.FromObjectAsJson(true),
                new[]
                {
                    ModelReaderWriter.Write(new Cat("test")),
                    BinaryData.FromObjectAsJson("a"),
                    BinaryData.FromObjectAsJson(2),
                    BinaryData.FromObjectAsJson(true)
                }));
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });

        private static void AssertEqual(BinaryData source, BinaryData target)
        {
            BinaryDataAssert.AreEqual(source, target);
        }
    }
}
