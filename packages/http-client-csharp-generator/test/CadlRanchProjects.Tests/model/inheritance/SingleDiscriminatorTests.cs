// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using _Type.Model.Inheritance.SingleDiscriminator;
using _Type.Model.Inheritance.SingleDiscriminator.Models;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class SingleDiscriminatorTests : CadlRanchTestBase
    {
        [Test]
        public Task GetModel() => Test(async (host) =>
        {
            var response = await new SingleDiscriminatorClient(host, null).GetModelAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(1, response.Value.Wingspan);
            Assert.IsInstanceOf<Sparrow>(response.Value);
        });

        [Test]
        public Task PutModel() => Test(async (host) =>
        {
            var response = await new SingleDiscriminatorClient(host, null).PutModelAsync(new Sparrow(1));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetRecursiveModel() => Test(async (host) =>
        {
            var response = await new SingleDiscriminatorClient(host, null).GetRecursiveModelAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);

            var bird = response.Value;
            Assert.AreEqual(5, bird.Wingspan);
            Assert.IsInstanceOf<Eagle>(bird);

            var eagle = (Eagle)bird;
            Assert.IsNotNull(eagle.Partner);
            Assert.AreEqual(2, eagle.Partner.Wingspan);
            Assert.IsInstanceOf<Goose>(eagle.Partner);
            Assert.AreEqual(1, eagle.Friends.Count);
            Assert.AreEqual(2, eagle.Friends[0].Wingspan);
            Assert.IsInstanceOf<SeaGull>(eagle.Friends[0]);
            Assert.AreEqual(1, eagle.Hate.Count);
            Assert.IsTrue(eagle.Hate.TryGetValue("key3", out var hateBird));
            Assert.AreEqual(1, hateBird.Wingspan);
            Assert.IsInstanceOf<Sparrow>(hateBird);
        });

        [Test]
        public Task PutRecursiveModel() => Test(async (host) =>
        {
            var eagle = new Eagle(5);
            eagle.Partner = new Goose(2);
            eagle.Friends.Add(new SeaGull(2));
            eagle.Hate.Add("key3", new Sparrow(1));
            var response = await new SingleDiscriminatorClient(host, null).PutRecursiveModelAsync(eagle);
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetMissingDiscriminator() => Test(async (host) =>
        {
            var response = await new SingleDiscriminatorClient(host, null).GetMissingDiscriminatorAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsNotInstanceOf<Sparrow>(response.Value);
            Assert.AreEqual(1, response.Value.Wingspan);
        });

        [Test]
        public Task GetWrongDiscriminator() => Test(async (host) =>
        {
            var response = await new SingleDiscriminatorClient(host, null).GetWrongDiscriminatorAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsNotInstanceOf<Sparrow>(response.Value);
            Assert.AreEqual(1, response.Value.Wingspan);
        });

        [Test]
        public Task GetLegacyModel() => Test(async (host) =>
        {
            var response = await new SingleDiscriminatorClient(host, null).GetLegacyModelAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(20, response.Value.Size);
            Assert.IsInstanceOf<TRex>(response.Value);
        });
    }
}
