using System;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using _Type._Enum.Fixed;
using _Type._Enum.Fixed.Models;

namespace CadlRanchProjects.Tests
{
    public class TypeEnumFixedTests : CadlRanchTestBase
    {
        [Test]
        public Task Type_Enum_Fixed_String_getKnownValue() => Test(async (host) =>
        {
            var response = await new FixedClient(host, null).GetStringClient().GetKnownValueAsync();
            Assert.AreEqual(DaysOfWeekEnum.Monday, (DaysOfWeekEnum)response);
        });

        [Test]
        public Task Type_Enum_Fixed_String_putKnownValue() => Test(async (host) =>
        {
            var response = await new FixedClient(host, null).GetStringClient().PutKnownValueAsync(DaysOfWeekEnum.Monday);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Type_Enum_Fixed_String_putUnknownValue() => Test((host) =>
        {
            var exception = Assert.ThrowsAsync<RequestFailedException>(() => new FixedClient(host, null).GetStringClient().PutUnknownValueAsync(BinaryData.FromObjectAsJson("Weekend")));
            Assert.AreEqual(500, exception.Status);
            return Task.CompletedTask;
        });
    }
}
