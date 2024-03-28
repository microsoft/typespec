using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using security_key_LowLevel;

namespace AutoRest.TestServer.Tests
{
    public class SecurityKeyTest : TestServerLowLevelTestBase
    {
        [Test]
        public Task SecurityKey() => Test(async (host) =>
        {
            await new AutorestSecurityKeyClient(host, new AzureKeyCredential("123456789"), null).HeadAsync();
        });
    }
}
