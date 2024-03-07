using _Specs_.Azure.ClientGenerator.Core.Access;
using _Specs_.Azure.ClientGenerator.Core.Access.Models;
using _Specs_.Azure.ClientGenerator.Core.Usage.Models;
using AutoRest.TestServer.Tests.Infrastructure;
using Azure;
using NUnit.Framework;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;

namespace CadlRanchProjects.Tests
{
    public class AzureTcgcAccessTests: CadlRanchTestBase
    {
        [Test]
        public Task Azure_ClientGenerator_Core_Access_PublicOperation() => Test(async (host) =>
        {
            var response1 = await new AccessClient(host, null).GetPublicOperationClient().NoDecoratorInPublicAsync("name");
            Assert.AreEqual("name", response1.Value.Name);

            var response2 = await new AccessClient(host, null).GetPublicOperationClient().PublicDecoratorInPublicAsync("name");
            Assert.AreEqual("name", response2.Value.Name);

            Assert.IsNotNull(typeof(PublicOperation).GetMethod("NoDecoratorInPublicAsync", BindingFlags.Instance | BindingFlags.Public, new[] { typeof(string), typeof(CancellationToken) }));
            Assert.IsNotNull(typeof(PublicOperation).GetMethod("NoDecoratorInPublicAsync", BindingFlags.Instance | BindingFlags.Public, new[] { typeof(string), typeof(RequestContext) }));

            Assert.IsNotNull(typeof(PublicOperation).GetMethod("PublicDecoratorInPublic", BindingFlags.Instance | BindingFlags.Public, new[] { typeof(string), typeof(CancellationToken) }));
            Assert.IsNotNull(typeof(PublicOperation).GetMethod("PublicDecoratorInPublic", BindingFlags.Instance | BindingFlags.Public, new[] { typeof(string), typeof(RequestContext) }));

            Assert.IsTrue(typeof(NoDecoratorModelInPublic).IsVisible);
            Assert.IsTrue(typeof(PublicDecoratorModelInPublic).IsVisible);
        });

        [Test]
        public Task Azure_ClientGenerator_Core_Access_InternalOperation() => Test(async (host) =>
        {
            var response1 = await new AccessClient(host, null).GetInternalOperationClient().NoDecoratorInInternalAsync("name");
            Assert.AreEqual("name", response1.Value.Name);

            var response2 = await new AccessClient(host, null).GetInternalOperationClient().InternalDecoratorInInternalAsync("name");
            Assert.AreEqual("name", response2.Value.Name);

            var response3 = await new AccessClient(host, null).GetInternalOperationClient().PublicDecoratorInInternalAsync("name");
            Assert.AreEqual("name", response3.Value.Name);

            Assert.IsNotNull(typeof(InternalOperation).GetMethod("NoDecoratorInInternalAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(CancellationToken) }));
            Assert.IsNotNull(typeof(InternalOperation).GetMethod("NoDecoratorInInternalAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(RequestContext) }));

            Assert.IsNotNull(typeof(InternalOperation).GetMethod("InternalDecoratorInInternalAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(CancellationToken) }));
            Assert.IsNotNull(typeof(InternalOperation).GetMethod("InternalDecoratorInInternalAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(RequestContext) }));

            Assert.IsNotNull(typeof(InternalOperation).GetMethod("PublicDecoratorInInternalAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(CancellationToken) }));
            Assert.IsNotNull(typeof(InternalOperation).GetMethod("PublicDecoratorInInternalAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(RequestContext) }));

            Assert.IsFalse(typeof(NoDecoratorModelInInternal).IsVisible);
            Assert.IsFalse(typeof(InternalDecoratorModelInInternal).IsVisible);
            Assert.IsTrue(typeof(PublicDecoratorModelInInternal).IsVisible);
        });

        [Test]
        public Task Azure_ClientGenerator_Core_Access_SharedModelInOperation() => Test(async (host) =>
        {
            var response1 = await new AccessClient(host, null).GetSharedModelInOperationClient().PublicAsync("name");
            Assert.AreEqual("name", response1.Value.Name);

            var response2 = await new AccessClient(host, null).GetSharedModelInOperationClient().InternalAsync("name");
            Assert.AreEqual("name", response2.Value.Name);

            Assert.IsNotNull(typeof(SharedModelInOperation).GetMethod("PublicAsync", BindingFlags.Instance | BindingFlags.Public, new[] { typeof(string), typeof(CancellationToken) }));
            Assert.IsNotNull(typeof(SharedModelInOperation).GetMethod("PublicAsync", BindingFlags.Instance | BindingFlags.Public, new[] { typeof(string), typeof(RequestContext) }));

            Assert.IsNotNull(typeof(SharedModelInOperation).GetMethod("InternalAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(CancellationToken) }).IsPublic);
            Assert.IsNotNull(typeof(SharedModelInOperation).GetMethod("InternalAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(RequestContext) }).IsPublic);

            Assert.IsTrue(typeof(SharedModel).IsVisible);
        });

        [Test]
        public Task Azure_ClientGenerator_Core_Access_RelativeModelInOperation() => Test(async (host) =>
        {
            var response1 = await new AccessClient(host, null).GetRelativeModelInOperationClient().OperationAsync("name");
            Assert.AreEqual("Madge", response1.Value.Name);
            Assert.AreEqual("Madge", response1.Value.Inner.Name);

            var response2 = await new AccessClient(host, null).GetRelativeModelInOperationClient().DiscriminatorAsync("name");
            Assert.AreEqual("Madge", response2.Value.Name);

            Assert.IsNotNull(typeof(RelativeModelInOperation).GetMethod("OperationAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(CancellationToken) }));
            Assert.IsNotNull(typeof(RelativeModelInOperation).GetMethod("OperationAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(RequestContext) }));

            Assert.IsNotNull(typeof(RelativeModelInOperation).GetMethod("DiscriminatorAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(CancellationToken) }));
            Assert.IsNotNull(typeof(RelativeModelInOperation).GetMethod("DiscriminatorAsync", BindingFlags.Instance | BindingFlags.NonPublic, new[] { typeof(string), typeof(RequestContext) }));

            Assert.IsFalse(typeof(OuterModel).IsVisible);
            Assert.IsFalse(typeof(BaseModel).IsVisible);
            Assert.IsFalse(typeof(InnerModel).IsVisible);
            Assert.IsFalse(typeof(AbstractModel).IsVisible);
            Assert.IsFalse(typeof(RealModel).IsVisible);
        });

        [Test]
        public void OrphanModelShouldBeGenerated()
        {
            Assert.IsTrue(typeof(OrphanModel).IsVisible);
        }
    }
}
