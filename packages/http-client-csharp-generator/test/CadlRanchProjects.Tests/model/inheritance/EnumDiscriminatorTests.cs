// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using _Type.Model.Inheritance.EnumDiscriminator;
using _Type.Model.Inheritance.EnumDiscriminator.Models;
using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;

namespace CadlRanchProjects.Tests
{
    public class EnumDiscriminatorTests : CadlRanchTestBase
    {
        [Test]
        public Task PutExtensibleEnum() => Test(async (host) =>
        {
            var response = await new EnumDiscriminatorClient(host, null).PutExtensibleModelAsync(new Golden(10));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetExtensibleEnum() => Test(async (host) =>
        {
            var response = await new EnumDiscriminatorClient(host, null).GetExtensibleModelAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(10, response.Value.Weight);
            Assert.IsInstanceOf<Golden>(response.Value);
        });

        [Test]
        public Task GetExtensibleModelMissingDiscriminator() => Test(async (host) =>
        {
            var response = await new EnumDiscriminatorClient(host, null).GetExtensibleModelMissingDiscriminatorAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsNotInstanceOf<Golden>(response.Value);
            Assert.AreEqual(10, response.Value.Weight);
        });

        [Test]
        public Task GetExtensibleModelWrongDiscriminator() => Test(async (host) =>
        {
            var response = await new EnumDiscriminatorClient(host, null).GetExtensibleModelWrongDiscriminatorAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsNotInstanceOf<Golden>(response.Value);
            Assert.AreEqual(8, response.Value.Weight);
        });

        [Test]
        public Task PutFixedEnum() => Test(async (host) =>
        {
            var response = await new EnumDiscriminatorClient(host, null).PutFixedModelAsync(new Cobra(10));
            Assert.AreEqual(204, response.Status);
        });

        [Test]
        public Task GetFixedEnum() => Test(async (host) =>
        {
            var response = await new EnumDiscriminatorClient(host, null).GetFixedModelAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.AreEqual(10, response.Value.Length);
            Assert.IsInstanceOf<Cobra>(response.Value);
        });

        [Test]
        public Task GetFixedModelMissingDiscriminator() => Test(async (host) =>
        {
            var response = await new EnumDiscriminatorClient(host, null).GetExtensibleModelMissingDiscriminatorAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsNotInstanceOf<Golden>(response.Value);
            Assert.AreEqual(10, response.Value.Weight);
        });

        [Test]
        public Task GetFixedModelWrongDiscriminator() => Test(async (host) =>
        {
            var response = await new EnumDiscriminatorClient(host, null).GetExtensibleModelWrongDiscriminatorAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsNotInstanceOf<Golden>(response.Value);
            Assert.AreEqual(8, response.Value.Weight);
        });

    }
}
