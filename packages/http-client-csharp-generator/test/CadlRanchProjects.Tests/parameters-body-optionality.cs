using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using Parameters.BodyOptionality;
using Parameters.BodyOptionality.Models;

namespace CadlRanchProjects.Tests
{
    public class ParametersBodyOptionalityTests : CadlRanchTestBase
    {
        [Test]
        public Task Parameters_BodyOptionality_requiredExplicit() => Test(async (host) =>
        {
            Response response = await new BodyOptionalityClient(host, null).RequiredExplicitAsync(new BodyModel("foo"));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Parameters_BodyOptionality_OptionalExplicit() => Test(async (host) =>
        {
            var client = new BodyOptionalityClient(host, null).GetOptionalExplicitClient();
            Response response = await client.SetAsync(new BodyModel("foo"));
            Assert.AreEqual(204, response.Status);

            response = await client.OmitAsync();
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task Parameters_BodyOptionality_requiredImplicit() => Test(async (host) =>
        {
            Response response = await new BodyOptionalityClient(host, null).RequiredImplicitAsync(new BodyModel("foo"));
            Assert.AreEqual(204, response.Status);
        });
    }
}
