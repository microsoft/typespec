// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading.Tasks;
using _Type.Scalar;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http._Type.Scalar
{
    public class ScalarTests : CadlRanchTestBase
    {
        [Test]
        public Task StringGet() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetStringClient().GetAsync();
            Assert.AreEqual("test", response.Value);
        });
        [Test]
        public Task StringPut() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetStringClient().PutAsync("test");
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
        [Test]
        public Task BooleanGet() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetBooleanClient().GetAsync();
            Assert.AreEqual(true, response.Value);
        });
        [Test]
        public Task BooleanPut() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetBooleanClient().PutAsync(true);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
        [Test]
        public Task UnknownGet() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetUnknownClient().GetAsync();
            Assert.AreEqual("test", response.Value.ToObjectFromJson<string>());
        });
        [Test]
        public Task UnknownPut() => Test(async (host) =>
        {
            var body = BinaryData.FromString("\"test\"");
            var response = await new ScalarClient(host, null).GetUnknownClient().PutAsync(body);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
        [Test]
        public Task DecimalTypeResponseBody() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimalTypeClient().ResponseBodyAsync();
            Assert.AreEqual(0.33333m, response.Value);
        });
        [Test]
        public Task DecimalTypeRequestBody() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimalTypeClient().RequestBodyAsync(0.33333m);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
        [Test]
        public Task DecimalTypeRequestParameter() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimalTypeClient().RequestParameterAsync(0.33333m);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
        [Test]
        public Task Decimal128TypeResponseBody() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimal128TypeClient().ResponseBodyAsync();
            Assert.AreEqual(0.33333m, response.Value);
        });
        [Test]
        public Task Decimal128TypeRequestBody() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimal128TypeClient().RequestBodyAsync(0.33333m);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
        [Test]
        public Task Decimal128TypeRequestParameter() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimal128TypeClient().RequestParameterAsync(0.33333m);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
        [Test]
        public Task DecimalVerifyPrepareVerify() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimalVerifyClient().PrepareVerifyAsync();
            Assert.AreEqual(0.1m, response.Value[0]);
            Assert.AreEqual(0.1m, response.Value[1]);
            Assert.AreEqual(0.1m, response.Value[2]);
        });
        [Test]
        public Task DecimalVerifyVerify() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimalVerifyClient().VerifyAsync(0.3m);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
        [Test]
        public Task Decimal128VerifyPrepareVerify() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimal128VerifyClient().PrepareVerifyAsync();
            Assert.AreEqual(0.1m, response.Value[0]);
            Assert.AreEqual(0.1m, response.Value[1]);
            Assert.AreEqual(0.1m, response.Value[2]);
        });
        [Test]
        public Task Decimal128VerifyVerify() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimal128VerifyClient().VerifyAsync(0.3m);
            Assert.AreEqual(204, response.GetRawResponse().Status);
        });
    }
}
