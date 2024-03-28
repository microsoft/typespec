// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using _Type.Model.Inheritance.NotDiscriminated;
using _Type.Model.Inheritance.NotDiscriminated.Models;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class NotDiscriminatedTests : CadlRanchTestBase
    {
        [Test]
        public Task PostValid() => Test(async (host) =>
        {
            var response = await new NotDiscriminatedClient(host, null).PostValidAsync(new Siamese("abc", 32, true));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetValid() => Test(async (host) =>
        {
            var response = await new NotDiscriminatedClient(host, null).GetValidAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("abc", response.Value.Name);
            Assert.AreEqual(32, response.Value.Age);
            Assert.True(response.Value.Smart);
        });

        [Test]
        public Task PutValid() => Test(async (host) =>
        {
            var response = await new NotDiscriminatedClient(host, null).PutValidAsync(new Siamese("def", 11, false));
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual("def", response.Value.Name);
            Assert.AreEqual(11, response.Value.Age);
            Assert.IsFalse(response.Value.Smart);
        });
    }
}
