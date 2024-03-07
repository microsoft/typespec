using System;
using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class ClientStructureDefaultTests : CadlRanchTestBase
    {
        //[TestCase(typeof(ServiceClient), new string[] { "One", "Two" })]
        //[TestCase(typeof(Foo), new string[] { "Three", "Four" })]
        //[TestCase(typeof(Bar), new string[] { "Five", "Six" })]
        //public void Client_Structure_default_methods(Type client, string[] methodNames)
        //{
        //    var methods = client.GetMethods();
        //    Assert.IsNotNull(methods);
        //    Assert.AreEqual(methodNames.Length, methods.Where(method => method.Name.EndsWith("Async")).ToArray().Length);
        //    /* check the existence of the methods. */
        //    foreach (var methodName in methodNames)
        //    {
        //        Assert.IsNotNull(client.GetMethod($"{methodName}Async"));
        //    }
        //}

        //[Test]
        //public Task Client_Structure_default_One() => Test(async (host) =>
        //{
        //    Response response = await new ServiceClient(host, "default").OneAsync();
        //    Assert.AreEqual(204, response.Status);
        //});
        //[Test]
        //public Task Client_Structure_default_Two() => Test(async (host) =>
        //{
        //    Response response = await new ServiceClient(host, "default").TwoAsync();
        //    Assert.AreEqual(204, response.Status);
        //});
        //[Test]
        //public Task Client_Structure_default_Three() => Test(async (host) =>
        //{
        //    Response response = await new ServiceClient(host, "default").GetFooClient().ThreeAsync();
        //    Assert.AreEqual(204, response.Status);
        //});
        //[Test]
        //public Task Client_Structure_default_Four() => Test(async (host) =>
        //{
        //    Response response = await new ServiceClient(host, "default").GetFooClient().FourAsync();
        //    Assert.AreEqual(204, response.Status);
        //});
        //[Test]
        //public Task Client_Structure_default_Five() => Test(async (host) =>
        //{
        //    Response response = await new ServiceClient(host, "default").GetBarClient().FiveAsync();
        //    Assert.AreEqual(204, response.Status);
        //});
        //[Test]
        //public Task Client_Structure_default_Six() => Test(async (host) =>
        //{
        //    Response response = await new ServiceClient(host, "default").GetBarClient().SixAsync();
        //    Assert.AreEqual(204, response.Status);
        //});
    }
}
