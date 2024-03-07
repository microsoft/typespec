using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using _Type.Scalar;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using Azure.Core;
using NUnit.Framework;
using YamlDotNet.Core.Tokens;

namespace CadlRanchProjects.Tests
{
    public class TypeScalarTests : CadlRanchTestBase
    {
        [Test]
        public Task Type_Scalar_String_get() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetStringClient().GetStringAsync();
            Assert.AreEqual("test", response.Value);
        });
        [Test]
        public Task Type_Scalar_String_put() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetStringClient().PutAsync("test");
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Type_Scalar_Boolean_get() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetBooleanClient().GetBooleanAsync();
            Assert.AreEqual(true, response.Value);
        });
        [Test]
        public Task Type_Scalar_Boolean_put() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetBooleanClient().PutAsync(true);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Type_Scalar_Unknown_get() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetUnknownClient().GetUnknownAsync();
            Assert.AreEqual("test", response.Value.ToObjectFromJson<string>());
        });
        [Test]
        public Task Type_Scalar_Unknown_put() => Test(async (host) =>
        {
            var body = BinaryData.FromString("\"test\"");
            var response = await new ScalarClient(host, null).GetUnknownClient().PutAsync(body);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Type_Scalar_DecimalType_ResponseBody() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimalTypeClient().ResponseBodyAsync();
            Assert.AreEqual(0.33333m, response.Value);
        });
        [Test]
        public Task Type_Scalar_DecimalType_RequestBody() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimalTypeClient().RequestBodyAsync(0.33333m);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Type_Scalar_DecimalType_RequestParameter() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimalTypeClient().RequestParameterAsync(0.33333m);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Type_Scalar_Decimal128Type_ResponseBody() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimal128TypeClient().ResponseBodyAsync();
            Assert.AreEqual(0.33333m, response.Value);
        });
        [Test]
        public Task Type_Scalar_Decimal128Type_RequestBody() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimal128TypeClient().RequestBodyAsync(0.33333m);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Type_Scalar_Decimal128Type_RequestParameter() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimal128TypeClient().RequestParameterAsync(0.33333m);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Type_Scalar_DecimalVerify_prepareVerify() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimalVerifyClient().PrepareVerifyAsync();
            Assert.AreEqual(0.1m, response.Value[0]);
            Assert.AreEqual(0.1m, response.Value[1]);
            Assert.AreEqual(0.1m, response.Value[2]);
        });
        [Test]
        public Task Type_Scalar_DecimalVerify_Verify() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimalVerifyClient().VerifyAsync(0.3m);
            Assert.AreEqual(204, response.Status);
        });
        [Test]
        public Task Type_Scalar_Decimal128Verify_prepareVerify() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimal128VerifyClient().PrepareVerifyAsync();
            Assert.AreEqual(0.1m, response.Value[0]);
            Assert.AreEqual(0.1m, response.Value[1]);
            Assert.AreEqual(0.1m, response.Value[2]);
        });
        [Test]
        public Task Type_Scalar_Decimal128Verify_Verify() => Test(async (host) =>
        {
            var response = await new ScalarClient(host, null).GetDecimal128VerifyClient().VerifyAsync(0.3m);
            Assert.AreEqual(204, response.Status);
        });
    }
}
