using System.ClientModel;
using System.Threading.Tasks;
using NUnit.Framework;
using Parameters.BodyOptionality;

namespace TestProjects.Spector.Tests.Http.Parameters.BodyOptionality
{
    public class BodyOptionalityTests : SpectorTestBase
    {
        [SpectorTest]
        public Task Parameters_BodyOptionality_requiredExplicit() => Test(async (host) =>
        {
            ClientResult result = await new BodyOptionalityClient(host, null).RequiredExplicitAsync(new BodyModel("foo"));
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task Parameters_BodyOptionality_OptionalExplicit() => Test(async (host) =>
        {
            var client = new BodyOptionalityClient(host, null).GetOptionalExplicitClient();
            ClientResult result = await client.SetAsync(new BodyModel("foo"));
            Assert.AreEqual(204, result.GetRawResponse().Status);

            result = await client.OmitAsync();
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [SpectorTest]
        public Task Parameters_BodyOptionality_requiredImplicit() => Test(async (host) =>
        {
            ClientResult result = await new BodyOptionalityClient(host, null).RequiredImplicitAsync("foo");
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });
    }
}
