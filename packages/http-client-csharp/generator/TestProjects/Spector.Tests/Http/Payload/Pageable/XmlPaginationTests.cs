// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Xml.Linq;
using NUnit.Framework;
using Payload.Pageable;

namespace TestProjects.Spector.Tests.Http.Payload.Pageable
{
    public class XmlPaginationTests : SpectorTestBase
    {
        private static readonly Dictionary<string, string> ExpectedPets = new()
        {
            { "1", "dog" },
            { "2", "cat" },
            { "3", "bird" },
            { "4", "fish" },
        };

        [SpectorTest]
        public Task ConvenienceMethodWithContinuation() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetXmlPaginationClient().GetWithContinuationAsync();
            int count = 0;
            await foreach (var pet in result)
            {
                Assert.IsNotNull(pet);
                Assert.AreEqual((++count).ToString(), pet.Id);
                Assert.AreEqual(ExpectedPets[pet.Id], pet.Name);
            }
            Assert.AreEqual(4, count);
        });

        [SpectorTest]
        public Task ConvenienceMethodWithContinuationSync() => Test((host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetXmlPaginationClient().GetWithContinuation();
            int count = 0;
            foreach (var pet in result)
            {
                Assert.IsNotNull(pet);
                Assert.AreEqual((++count).ToString(), pet.Id);
                Assert.AreEqual(ExpectedPets[pet.Id], pet.Name);
            }
            Assert.AreEqual(4, count);
            return Task.CompletedTask;
        });

        [SpectorTest]
        public Task ProtocolMethodWithContinuation() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetXmlPaginationClient().GetWithContinuationAsync(null, new RequestOptions());
            int count = 0;
            await foreach (var page in result.GetRawPagesAsync())
            {
                Assert.IsNotNull(page);
                var xml = XDocument.Parse(page.GetRawResponse().Content.ToString());
                var pets = xml.Root?.Element("Pets")?.Elements("Pet");
                Assert.IsNotNull(pets);
                foreach (var pet in pets!)
                {
                    Assert.IsNotNull(pet);
                    var id = pet.Element("Id")?.Value;
                    var name = pet.Element("Name")?.Value;
                    Assert.IsNotNull(id);
                    Assert.IsNotNull(name);
                    Assert.AreEqual((++count).ToString(), id);
                    Assert.AreEqual(ExpectedPets[id!], name);
                }
            }
            Assert.AreEqual(4, count);
        });

        [SpectorTest]
        public Task ProtocolMethodWithContinuationSync() => Test((host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetXmlPaginationClient().GetWithContinuation(null, new RequestOptions());
            int count = 0;
            foreach (var page in result.GetRawPages())
            {
                Assert.IsNotNull(page);
                var xml = XDocument.Parse(page.GetRawResponse().Content.ToString());
                var pets = xml.Root?.Element("Pets")?.Elements("Pet");
                Assert.IsNotNull(pets);
                foreach (var pet in pets!)
                {
                    Assert.IsNotNull(pet);
                    var id = pet.Element("Id")?.Value;
                    var name = pet.Element("Name")?.Value;
                    Assert.IsNotNull(id);
                    Assert.IsNotNull(name);
                    Assert.AreEqual((++count).ToString(), id);
                    Assert.AreEqual(ExpectedPets[id!], name);
                }
            }
            Assert.AreEqual(4, count);
            return Task.CompletedTask;
        });

        [SpectorTest]
        public Task ConvenienceMethodWithNextLink() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetXmlPaginationClient().GetWithNextLinkAsync();
            int count = 0;
            await foreach (var pet in result)
            {
                Assert.IsNotNull(pet);
                Assert.AreEqual((++count).ToString(), pet.Id);
                Assert.AreEqual(ExpectedPets[pet.Id], pet.Name);
            }
            Assert.AreEqual(4, count);
        });

        [SpectorTest]
        public Task ConvenienceMethodWithNextLinkSync() => Test((host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetXmlPaginationClient().GetWithNextLink();
            int count = 0;
            foreach (var pet in result)
            {
                Assert.IsNotNull(pet);
                Assert.AreEqual((++count).ToString(), pet.Id);
                Assert.AreEqual(ExpectedPets[pet.Id], pet.Name);
            }
            Assert.AreEqual(4, count);
            return Task.CompletedTask;
        });

        [SpectorTest]
        public Task ProtocolMethodWithNextLink() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetXmlPaginationClient().GetWithNextLinkAsync(new RequestOptions());
            int count = 0;
            await foreach (var page in result.GetRawPagesAsync())
            {
                Assert.IsNotNull(page);
                var xml = XDocument.Parse(page.GetRawResponse().Content.ToString());
                var pets = xml.Root?.Element("Pets")?.Elements("Pet");
                Assert.IsNotNull(pets);
                foreach (var pet in pets!)
                {
                    Assert.IsNotNull(pet);
                    var id = pet.Element("Id")?.Value;
                    var name = pet.Element("Name")?.Value;
                    Assert.IsNotNull(id);
                    Assert.IsNotNull(name);
                    Assert.AreEqual((++count).ToString(), id);
                    Assert.AreEqual(ExpectedPets[id!], name);
                }
            }
            Assert.AreEqual(4, count);
        });

        [SpectorTest]
        public Task ProtocolMethodWithNextLinkSync() => Test((host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetXmlPaginationClient().GetWithNextLink(new RequestOptions());
            int count = 0;
            foreach (var page in result.GetRawPages())
            {
                Assert.IsNotNull(page);
                var xml = XDocument.Parse(page.GetRawResponse().Content.ToString());
                var pets = xml.Root?.Element("Pets")?.Elements("Pet");
                Assert.IsNotNull(pets);
                foreach (var pet in pets!)
                {
                    Assert.IsNotNull(pet);
                    var id = pet.Element("Id")?.Value;
                    var name = pet.Element("Name")?.Value;
                    Assert.IsNotNull(id);
                    Assert.IsNotNull(name);
                    Assert.AreEqual((++count).ToString(), id);
                    Assert.AreEqual(ExpectedPets[id!], name);
                }
            }
            Assert.AreEqual(4, count);
            return Task.CompletedTask;
        });
    }
}
