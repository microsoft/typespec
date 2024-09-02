// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using _Type.Model.Inheritance.EnumDiscriminator;
using _Type.Model.Inheritance.EnumDiscriminator.Models;
using NUnit.Framework;

namespace TestProjects.CadlRanch.Tests.Http._Type.Model.Inheritance.EnumDiscriminator
{
    public class EnumDiscriminatorTests : CadlRanchTestBase
    {
        [CadlRanchTest]
        public Task PutExtensibleEnum() => Test(async (host) =>
        {
            var result = await new EnumDiscriminatorClient(host, null).PutExtensibleModelAsync(new Golden(10));
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetExtensibleEnum() => Test(async (host) =>
        {
            var result = await new EnumDiscriminatorClient(host, null).GetExtensibleModelAsync();
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(10, result.Value.Weight);
            Assert.IsInstanceOf<Golden>(result.Value);
        });

        [CadlRanchTest]
        public Task GetExtensibleModelMissingDiscriminator() => Test(async (host) =>
        {
            var result = await new EnumDiscriminatorClient(host, null).GetExtensibleModelMissingDiscriminatorAsync();
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.IsNotInstanceOf<Golden>(result.Value);
            Assert.AreEqual(10, result.Value.Weight);
        });

        [CadlRanchTest]
        public Task GetExtensibleModelWrongDiscriminator() => Test(async (host) =>
        {
            var result = await new EnumDiscriminatorClient(host, null).GetExtensibleModelWrongDiscriminatorAsync();
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.IsNotInstanceOf<Golden>(result.Value);
            Assert.AreEqual(8, result.Value.Weight);
        });

        [CadlRanchTest]
        public Task PutFixedEnum() => Test(async (host) =>
        {
            var result = await new EnumDiscriminatorClient(host, null).PutFixedModelAsync(new Cobra(10));
            Assert.AreEqual(204, result.GetRawResponse().Status);
        });

        [CadlRanchTest]
        public Task GetFixedEnum() => Test(async (host) =>
        {
            var result = await new EnumDiscriminatorClient(host, null).GetFixedModelAsync();
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.AreEqual(10, result.Value.Length);
            Assert.IsInstanceOf<Cobra>(result.Value);
        });

        [CadlRanchTest]
        public Task GetFixedModelMissingDiscriminator() => Test(async (host) =>
        {
            var response = await new EnumDiscriminatorClient(host, null).GetExtensibleModelMissingDiscriminatorAsync();
            Assert.AreEqual(200, response.GetRawResponse().Status);
            Assert.IsNotInstanceOf<Golden>(response.Value);
            Assert.AreEqual(10, response.Value.Weight);
        });

        [CadlRanchTest]
        public Task GetFixedModelWrongDiscriminator() => Test(async (host) =>
        {
            var result = await new EnumDiscriminatorClient(host, null).GetExtensibleModelWrongDiscriminatorAsync();
            Assert.AreEqual(200, result.GetRawResponse().Status);
            Assert.IsNotInstanceOf<Golden>(result.Value);
            Assert.AreEqual(8, result.Value.Weight);
        });

    }
}
