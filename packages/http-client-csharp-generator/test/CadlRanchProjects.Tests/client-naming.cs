using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Client.Naming;
using Client.Naming.Models;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class ClientNamingTests: CadlRanchTestBase
    {
        [Test]
        public Task Client_Naming_Property_client() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).ClientAsync(new ClientNameModel(true));
            Assert.AreEqual(204, response.Status);

            Assert.NotNull(typeof(ClientNameModel).GetProperty("ClientName"));
            Assert.IsNull(typeof(ClientNameModel).GetProperty("DefaultName"));
        });

        [Test]
        public Task Client_Naming_Property_language() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).LanguageAsync(new LanguageClientNameModel(true));
            Assert.AreEqual(204, response.Status);

            Assert.NotNull(typeof(LanguageClientNameModel).GetProperty("CSName"));
            Assert.IsNull(typeof(LanguageClientNameModel).GetProperty("DefaultName"));
        });

        [Test]
        public Task Client_Naming_Property_compatibleWithEncodedName() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).CompatibleWithEncodedNameAsync(new ClientNameAndJsonEncodedNameModel(true));
            Assert.AreEqual(204, response.Status);

            Assert.NotNull(typeof(ClientNameModel).GetProperty("ClientName"));
            Assert.IsNull(typeof(ClientNameModel).GetProperty("DefaultName"));
        });

        [Test]
        public Task Client_Naming_operation() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).ClientNameAsync();
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Client_Naming_parameter() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).ParameterAsync(clientName: "true");
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Client_Naming_Header_request() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).RequestAsync(clientName: "true");
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        [Ignore("https://github.com/Azure/autorest.csharp/issues/2493")]
        public Task Client_Naming_Header_response() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).ResponseAsync();
        });

        [Test]
        public Task Client_Naming_Model_client() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).GetClientModelClient().ClientAsync(new Client.Naming.Models.ClientModel(true));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Client_Naming_Model_language() => Test(async (host) =>
        {
            var response = await new NamingClient(host, null).GetClientModelClient().LanguageAsync(new CSModel(true));
            Assert.AreEqual(204, response.Status);
        });
    }
}
