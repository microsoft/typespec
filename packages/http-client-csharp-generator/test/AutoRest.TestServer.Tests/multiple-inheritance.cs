// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using multiple_inheritance;
using multiple_inheritance.Models;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests
{
    public class MultipleInheritanceTest : TestServerTestBase
    {
        [Test]
        public Task MultipleInheritanceCatGet() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleInheritanceServiceClient(ClientDiagnostics, pipeline, host).RestClient.GetCatAsync();
            Assert.AreEqual("Whiskers", result.Value.Name);
            Assert.IsTrue(result.Value.LikesMilk);
            Assert.IsTrue(result.Value.Meows);
            Assert.IsTrue(result.Value.Hisses);
        });

        [Test]
        public Task MultipleInheritanceCatPut() => Test(async (host, pipeline) =>
        {
            var value = new Cat("Boots")
            {
                LikesMilk = false,
                Meows = true,
                Hisses = false
            };
            var result = await new MultipleInheritanceServiceClient(ClientDiagnostics, pipeline, host).RestClient.PutCatAsync(value);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual("Cat was correct!", result.Value);
        });

        [Test]
        public Task MultipleInheritanceFelineGet() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleInheritanceServiceClient(ClientDiagnostics, pipeline, host).RestClient.GetFelineAsync();
            Assert.IsTrue(result.Value.Meows);
            Assert.IsTrue(result.Value.Hisses);
        });

        [Test]
        public Task MultipleInheritanceFelinePut() => Test(async (host, pipeline) =>
        {
            var value = new Feline()
            {
                Meows = false,
                Hisses = true
            };
            var result = await new MultipleInheritanceServiceClient(ClientDiagnostics, pipeline, host).RestClient.PutFelineAsync(value);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual("Feline was correct!", result.Value);
        });

        [Test]
        public Task MultipleInheritanceHorseGet() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleInheritanceServiceClient(ClientDiagnostics, pipeline, host).RestClient.GetHorseAsync();
            Assert.AreEqual("Fred", result.Value.Name);
            Assert.IsTrue(result.Value.IsAShowHorse);
        });

        [Test]
        public Task MultipleInheritanceHorsePut() => Test(async (host, pipeline) =>
        {
            var value = new Horse("General")
            {
                IsAShowHorse = false
            };
            var result = await new MultipleInheritanceServiceClient(ClientDiagnostics, pipeline, host).RestClient.PutHorseAsync(value);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual("Horse was correct!", result.Value);
        });

        [Test]
        public Task MultipleInheritanceKittenGet() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleInheritanceServiceClient(ClientDiagnostics, pipeline, host).RestClient.GetKittenAsync();
            Assert.AreEqual("Gatito", result.Value.Name);
            Assert.IsTrue(result.Value.LikesMilk);
            Assert.IsTrue(result.Value.Meows);
            Assert.IsTrue(result.Value.Hisses);
            Assert.IsFalse(result.Value.EatsMiceYet);
        });

        [Test]
        public Task MultipleInheritanceKittenPut() => Test(async (host, pipeline) =>
        {
            var value = new Kitten("Kitty")
            {
                LikesMilk = false,
                Meows = true,
                Hisses = false,
                EatsMiceYet = true
            };
            var result = await new MultipleInheritanceServiceClient(ClientDiagnostics, pipeline, host).RestClient.PutKittenAsync(value);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual("Kitten was correct!", result.Value);
        });

        [Test]
        public Task MultipleInheritancePetGet() => Test(async (host, pipeline) =>
        {
            var result = await new MultipleInheritanceServiceClient(ClientDiagnostics, pipeline, host).RestClient.GetPetAsync();
            Assert.AreEqual("Peanut", result.Value.Name);
        });

        [Test]
        public Task MultipleInheritancePetPut() => Test(async (host, pipeline) =>
        {
            var value = new Pet("Butter");
            var result = await new MultipleInheritanceServiceClient(ClientDiagnostics, pipeline, host).RestClient.PutPetAsync(value);
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual("Pet was correct!", result.Value);
        });
    }
}
