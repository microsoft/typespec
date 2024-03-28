using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using Payload.Pageable;
using Payload.Pageable.Models;

namespace CadlRanchProjects.Tests
{
    public class PayloadPageableTests : CadlRanchTestBase
    {
        [Test]
        public Task Payload_Pageable_list() => Test(async (host) =>
        {
            var allPages = new PageableClient(host, null).GetPageablesAsync(3);
            bool isFirstPage = true;
            await foreach (Page<User> page in allPages.AsPages())
            {
                if (isFirstPage)
                {
                    Assert.AreEqual(3, page.Values.Count);
                    Assert.AreEqual("user5", page.Values[0].Name);
                    Assert.AreEqual("user6", page.Values[1].Name);
                    Assert.AreEqual("user7", page.Values[2].Name);
                    isFirstPage = false;
                }
                else
                {
                    Assert.AreEqual(1, page.Values.Count);
                    Assert.AreEqual("user8", page.Values[0].Name);
                }
            }
        });
    }
}
