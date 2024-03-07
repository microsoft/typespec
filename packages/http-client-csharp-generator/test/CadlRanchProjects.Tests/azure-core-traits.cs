using System;
using System.Threading.Tasks;
using _Specs_.Azure.Core.Traits;
using _Specs_.Azure.Core.Traits.Models;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class AzureCoreTraitsTests: CadlRanchTestBase
    {
        [Test]
        public Task Azure_Core_Traits_smokeTest() => Test(async (host) =>
        {
            User response = await new TraitsClient(host, null).SmokeTestAsync(1, "123", new RequestConditions() { IfMatch = new ETag("valid"), IfNoneMatch = new ETag("invalid"), IfUnmodifiedSince = DateTimeOffset.Parse("Fri, 26 Aug 2022 14:38:00 GMT"), IfModifiedSince = DateTimeOffset.Parse("Thu, 26 Aug 2021 14:38:00 GMT") });
            Assert.AreEqual("Madge", response.Name);
        });
    }
}
