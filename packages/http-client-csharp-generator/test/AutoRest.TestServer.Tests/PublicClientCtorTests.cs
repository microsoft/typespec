// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Azure;
using Azure.Core;
using Azure.Identity;
using NUnit.Framework;
using PublicClientCtor;
using PublicClientCtor.Models;

namespace AutoRest.TestServer.Tests
{
    public class PublicClientCtorTests : InProcTestBase
    {
        [Test]
        public void PublicClientCtorWithAzureKeyCredential()
        {
            var constructors = typeof(PublicClientCtorClient).GetConstructors(BindingFlags.Instance | BindingFlags.Public);
            Assert.AreEqual(2, constructors.Length);

            var ctor = constructors[0];
            Assert.AreEqual(5, ctor.GetParameters().Length);

            var firstParam = TypeAsserts.HasParameter(ctor, "endpoint");
            Assert.NotNull(firstParam);
            Assert.AreEqual(typeof(Uri), firstParam.ParameterType);

            var secondParam = TypeAsserts.HasParameter(ctor, "credential");
            Assert.NotNull(secondParam);
            Assert.AreEqual(typeof(AzureKeyCredential), secondParam.ParameterType);

            var thirdParam = TypeAsserts.HasParameter(ctor, "param1");
            Assert.NotNull(thirdParam);
            Assert.AreEqual(typeof(string), thirdParam.ParameterType);
            Assert.True(thirdParam.HasDefaultValue);
            Assert.AreEqual(null, thirdParam.DefaultValue);

            var fourthParam = TypeAsserts.HasParameter(ctor, "param2");
            Assert.NotNull(fourthParam);
            Assert.AreEqual(typeof(string), fourthParam.ParameterType);
            Assert.True(fourthParam.HasDefaultValue);
            Assert.AreEqual(null, fourthParam.DefaultValue);

            var fifthParam = TypeAsserts.HasParameter(ctor, "options");
            Assert.NotNull(fifthParam);
            Assert.AreEqual(typeof(PublicClientCtorClientOptions), fifthParam.ParameterType);
            Assert.IsTrue(fifthParam.IsOptional);
        }

        [Test]
        public void PublicClientCtorWithTokenCredential()
        {
            var constructors = typeof(PublicClientCtorClient).GetConstructors(BindingFlags.Instance | BindingFlags.Public);
            Assert.AreEqual(2, constructors.Length);

            var ctor = constructors[1];
            Assert.AreEqual(5, ctor.GetParameters().Length);

            var firstParam = TypeAsserts.HasParameter(ctor, "endpoint");
            Assert.NotNull(firstParam);
            Assert.AreEqual(typeof(Uri), firstParam.ParameterType);

            var secondParam = TypeAsserts.HasParameter(ctor, "credential");
            Assert.NotNull(secondParam);
            Assert.AreEqual(typeof(TokenCredential), secondParam.ParameterType);

            var thirdParam = TypeAsserts.HasParameter(ctor, "param1");
            Assert.NotNull(thirdParam);
            Assert.AreEqual(typeof(string), thirdParam.ParameterType);
            Assert.True(thirdParam.HasDefaultValue);
            Assert.AreEqual(null, thirdParam.DefaultValue);

            var fourthParam = TypeAsserts.HasParameter(ctor, "param2");
            Assert.NotNull(fourthParam);
            Assert.AreEqual(typeof(string), fourthParam.ParameterType);
            Assert.True(fourthParam.HasDefaultValue);
            Assert.AreEqual(null, fourthParam.DefaultValue);

            var fifthParam = TypeAsserts.HasParameter(ctor, "options");
            Assert.NotNull(fifthParam);
            Assert.AreEqual(typeof(PublicClientCtorClientOptions), fifthParam.ParameterType);
            Assert.IsTrue(fifthParam.IsOptional);
        }

        [Test]
        public async Task CanSendHeadersWithAzureKeyCredential()
        {
            Dictionary<string, string> requestHeaders = null;
            using var testServer = new InProcTestServer(async content =>
            {
                requestHeaders = content.Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString());
                await content.Response.Body.FlushAsync();
            });

            var client = new PublicClientCtorClient(testServer.Address, new AzureKeyCredential("fake"));

            await client.OperationAsync(new TestModel());

            Assert.True(requestHeaders.TryGetValue("fake-key", out var value) && value == "fake");
        }
    }
}
