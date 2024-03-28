// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using AutoRest.TestServer.Tests.Infrastructure;
using PetStore;
using NUnit.Framework;
using Azure;
using PetStore.Models;

namespace CadlRanchProjects.Tests
{
    public class PetStoreTypeSpecTests : CadlRanchMockApiTestBase
    {
        [Test]
        public Task PetStore_DeletePetById() => Test(async (host) =>
        {
            Response response = await new PetStoreClient(host, null).GetPetsClient().DeleteAsync(1);
            Assert.AreEqual(200, response.Status);
        });

        [Test]
        public Task PetStore_ReadPetById() => Test(async (host) =>
        {
            Response response = await new PetStoreClient(host, null).GetPetsClient().ReadAsync(1, new RequestContext());
            Assert.AreEqual(200, response.Status);
            Assert.AreEqual(12, Pet.FromResponse(response).Age);
            Assert.AreEqual("dog", Pet.FromResponse(response).Name);
        });

        [Test]
        public Task PetStore_CreatePet() => Test(async (host) =>
        {
            Pet pet = new("dog", 12);
            var response = await new PetStoreClient(host, null).GetPetsClient().CreateAsync(pet);
            Assert.AreEqual("dog", response.Value.Name);
            Assert.AreEqual(12, response.Value.Age);
        });

        [Test]
        public Task PetStore_GetPetByKind() => Test(async (host) =>
        {
            Pet pet = new("dog", 12);
            Response response = await new PetStoreClient(host, null).GetPetsClient().GetPetByKindAsync("dog");
            Assert.AreEqual(200, response.Status);
            Assert.AreEqual(12, Pet.FromResponse(response).Age);
            Assert.AreEqual("dog", Pet.FromResponse(response).Name);
        });

        [Test]
        public Task PetStore_GetFirstPet() => Test(async (host) =>
        {
            Pet pet = new("dog", 12);
            Response response = await new PetStoreClient(host, null).GetPetsClient().GetFirstPetAsync(1, new RequestContext());
            Assert.AreEqual(200, response.Status);
            Assert.AreEqual(12, Pet.FromResponse(response).Age);
            Assert.AreEqual("dog", Pet.FromResponse(response).Name);
        });

        [Test]
        public Task PetStore_GetFish() => Test(async (host) =>
        {
            Response<Fish> response = await new PetStoreClient(host, null).GetPetsClient().GetFishAsync("shark");
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsTrue(response.Value is Shark);
            Shark shark = response.Value as Shark;
            Assert.AreEqual(100, shark.Size);
            Assert.AreEqual("I can bite", shark.Bite);
        });
    }
}
