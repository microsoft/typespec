// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using SpecialHeaders.Repeatability;
using _Specs_.Azure.Core.Traits;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using System.Threading.Tasks;
using System.Linq;
using System.Reflection;
using _Specs_.Azure.Core.Traits.Models;
using System;

namespace CadlRanchProjects.Tests
{
    public class RepeatabilityHeaderTests : CadlRanchTestBase
    {
        [Test]
        public Task ImmediateSuccess() => Test(async (host) =>
        {
            Response response = await new RepeatabilityClient(host, null).ImmediateSuccessAsync();
            Assert.AreEqual(204, response.Status);
            Assert.IsTrue(response.Headers.TryGetValue("repeatability-result", out var headerValue));
            Assert.AreEqual("accepted", headerValue);
        });

        [Test]
        public Task RepeatableAction() => Test(async (host) =>
        {
            var response = await new TraitsClient(host, null).RepeatableActionAsync(1, new UserActionParam("test"));
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsTrue(response.GetRawResponse().Headers.TryGetValue("repeatability-result", out var headerValue));
            Assert.AreEqual("accepted", headerValue);
            Assert.AreEqual("test", response.Value.UserActionResult);
        });

        [TestCase(typeof(RepeatabilityClient), "ImmediateSuccess")]
        [TestCase(typeof(TraitsClient), "RepeatableAction")]
        public void RepeatabilityHeadersNotInMethodSignature(Type clientType, string methodName)
        {
            var methods = clientType.GetMethods(BindingFlags.Public | BindingFlags.Instance).Where(m => m.Name.StartsWith(methodName));
            Assert.IsNotEmpty(methods);
            foreach (var m in methods)
            {
                Assert.False(m.GetParameters().Any(p => p.Name == "repeatabilityRequestId" || p.Name == "repeatabilityFirstSent"));
            }
        }
    }
}
