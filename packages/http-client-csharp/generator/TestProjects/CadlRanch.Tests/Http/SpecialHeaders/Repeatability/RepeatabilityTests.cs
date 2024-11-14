// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using NUnit.Framework;
using SpecialHeaders.Repeatability;
using System.Reflection;
using System.Threading.Tasks;
using System.Linq;

namespace TestProjects.CadlRanch.Tests.Http.SpecialHeaders.Repeatability
{
    public class RepeatabilityTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task ImmediateSuccess() => Test(async (host) =>
        {
            var response = await new RepeatabilityClient(host, null).ImmediateSuccessAsync();

            Assert.AreEqual(204, response.GetRawResponse().Status);
            Assert.IsTrue(response.GetRawResponse().Headers.TryGetValue("repeatability-result", out var headerValue));
            Assert.AreEqual("accepted", headerValue);
        });

        [Test]
        public void RepeatabilityHeadersNotInMethodSignature()
        {
            var methods = typeof(RepeatabilityClient).GetMethods(BindingFlags.Public | BindingFlags.Instance)
                .Where(m => m.Name.StartsWith("ImmediateSuccess"));

            Assert.IsNotEmpty(methods);
            foreach (var m in methods)
            {
                Assert.False(m.GetParameters().Any(p => p.Name == "repeatabilityRequestId" || p.Name == "repeatabilityFirstSent"));
            }
        }
    }
}
