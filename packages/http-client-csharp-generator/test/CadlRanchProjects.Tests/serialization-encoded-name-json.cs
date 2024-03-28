using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;
using Serialization.EncodedName.Json;
using Serialization.EncodedName.Json.Models;

namespace CadlRanchProjects.Tests
{
    public class SerializationEncodedNameJsonTests: CadlRanchTestBase
    {
        [Test]
        public Task Serialization_EncodedName_Json_Property_send() => Test(async (host) =>
        {
            var response = await new JsonClient(host, null).GetPropertyClient().SendAsync(new JsonEncodedNameModel(true));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Serialization_EncodedName_Json_Property_get() => Test(async (host) =>
        {
            var response = await new JsonClient(host, null).GetPropertyClient().GetPropertyAsync();
            Assert.AreEqual(true, response.Value.DefaultName);
        });
    }
}
