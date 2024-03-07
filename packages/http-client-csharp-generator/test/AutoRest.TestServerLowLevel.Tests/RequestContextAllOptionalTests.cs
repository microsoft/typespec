// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Azure;
using Azure.Core;
using NUnit.Framework;
using Parameters_LowLevel;

namespace AutoRest.TestServer.Tests
{
    public class RequestContextAllOptionalTests
    {
        [Test]
        public void NoRequestBodyResponseBody([Values("NoRequestBodyResponseBody", "NoRequestBodyResponseBodyAsync")] string methodName)
        {
            TypeAsserts.HasPublicInstanceMethod(
                typeof(ParametersLowlevelClient),
                methodName,
                new TypeAsserts.Parameter[] {
                    new("id", typeof(int)),
                    new("skip", typeof(int)),
                    new("top", typeof(int?)),
                    new("status", typeof(string)),
                    new("context", typeof(RequestContext))
                });
        }

        [Test]
        public void OptionalRequestContextDeleteNoRequestBodyResponseBody()
        {
            var client = typeof(ParametersLowlevelClient);
            var method = client.GetMethod("DeleteNoRequestBodyResponseBody");
            var parameters = method.GetParameters();

            Assert.AreEqual(2, parameters.Length);
            Assert.AreEqual(parameters[0].ParameterType, typeof(string));
            Assert.AreEqual(parameters[0].IsOptional, false);
            Assert.AreEqual(parameters[1].ParameterType, typeof(RequestContext));
            Assert.AreEqual(parameters[1].IsOptional, false);
        }

        [Test]
        public void RequestBodyResponseBody()
        {
            var client = typeof(ParametersLowlevelClient);
            var method = client.GetMethod("RequestBodyResponseBody");
            var parameters = method.GetParameters();

            Assert.AreEqual(2, parameters.Length);
            Assert.AreEqual(parameters[0].ParameterType, typeof(RequestContent));
            Assert.AreEqual(parameters[0].IsOptional, false);
            Assert.AreEqual(parameters[1].ParameterType, typeof(RequestContext));
            Assert.AreEqual(parameters[1].IsOptional, true);
        }

        [Test]
        public void NoRequestBodyNoResponseBody()
        {
            var client = typeof(ParametersLowlevelClient);
            var method = client.GetMethod("NoRequestBodyNoResponseBody");
            var parameters = method.GetParameters();

            Assert.AreEqual(1, parameters.Length);
            Assert.AreEqual(parameters[0].ParameterType, typeof(RequestContext));
            Assert.AreEqual(parameters[0].IsOptional, true);
        }

        [Test]
        public void RequestBodyNoResponseBody()
        {
            var client = typeof(ParametersLowlevelClient);
            var method = client.GetMethod("RequestBodyNoResponseBody");
            var parameters = method.GetParameters();

            Assert.AreEqual(2, parameters.Length);
            Assert.AreEqual(parameters[0].ParameterType, typeof(RequestContent));
            Assert.AreEqual(parameters[0].IsOptional, false);
            Assert.AreEqual(parameters[1].ParameterType, typeof(RequestContext));
            Assert.AreEqual(parameters[1].IsOptional, true);
        }
    }
}
