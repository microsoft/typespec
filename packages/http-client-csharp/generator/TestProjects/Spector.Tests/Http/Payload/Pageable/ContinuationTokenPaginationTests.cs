// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Text.Json.Nodes;
using System.Threading.Tasks;
using NUnit.Framework;
using Payload.Pageable;

namespace TestProjects.Spector.Tests.Http.Payload.Pageable
{
    public class ContinuationTokenPaginationTests : SpectorTestBase
    {
        [SpectorTest]
        public Task RequestHeaderResponseBodyConvenienceMethod() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetServerDrivenPaginationClient()
                .GetServerDrivenPaginationContinuationTokenClient()
                .RequestHeaderResponseBodyAsync(foo: "foo", bar: "bar");
            await ValidateConvenience(result, false);
        });

        [SpectorTest]
        public Task RequestHeaderResponseBodyProtocolMethod() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetServerDrivenPaginationClient()
                .GetServerDrivenPaginationContinuationTokenClient()
                .RequestHeaderResponseBodyAsync(token: null, foo: "foo", bar: "bar", options: null);
            await ValidateProtocol(result, false);
        });

        [SpectorTest]
        public Task RequestHeaderResponseHeaderConvenienceMethod() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetServerDrivenPaginationClient()
                .GetServerDrivenPaginationContinuationTokenClient()
                .RequestHeaderResponseHeaderAsync(foo: "foo", bar: "bar");
            await ValidateConvenience(result, true);
        });

        [SpectorTest]
        public Task RequestHeaderResponseHeaderProtocolMethod() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetServerDrivenPaginationClient()
                .GetServerDrivenPaginationContinuationTokenClient()
                .RequestHeaderResponseHeaderAsync(null, foo: "foo", bar: "bar", options: null);
            await ValidateProtocol(result, true);
        });

        [SpectorTest]
        public Task RequestQueryResponseBodyConvenienceMethod() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetServerDrivenPaginationClient()
                .GetServerDrivenPaginationContinuationTokenClient()
                .RequestQueryResponseBodyAsync(foo: "foo", bar: "bar");
            await ValidateConvenience(result, false);
        });

        [SpectorTest]
        public Task RequestQueryResponseBodyProtocolMethod() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetServerDrivenPaginationClient()
                .GetServerDrivenPaginationContinuationTokenClient()
                .RequestQueryResponseBodyAsync(null, foo: "foo", bar: "bar", options: null);
            await ValidateProtocol(result, false);
        });

        [SpectorTest]
        public Task RequestQueryResponseHeaderConvenienceMethod() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetServerDrivenPaginationClient()
                .GetServerDrivenPaginationContinuationTokenClient()
                .RequestQueryResponseHeaderAsync(foo: "foo", bar: "bar");
            await ValidateConvenience(result, true);
        });

        [SpectorTest]
        public Task RequestQueryResponseHeaderProtocolMethod() => Test(async (host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetServerDrivenPaginationClient()
                .GetServerDrivenPaginationContinuationTokenClient()
                .RequestQueryResponseHeaderAsync(null, foo: "foo", bar: "bar", options: null);
            await ValidateProtocol(result, true);
        });

        [SpectorTest]
        public Task RequestHeaderResponseBodyConvenienceMethodSync() => Test((host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetServerDrivenPaginationClient()
                .GetServerDrivenPaginationContinuationTokenClient()
                .RequestHeaderResponseBody(foo: "foo", bar: "bar");

            int count = 0;
            var expectedPets = new Dictionary<string, string>()
            {
                { "1", "dog" },
                { "2", "cat" },
                { "3", "bird" },
                { "4", "fish" },
            };
            foreach (var pet in result)
            {
                Assert.IsNotNull(pet);
                Assert.AreEqual((++count).ToString(), pet.Id);
                Assert.AreEqual(expectedPets[pet.Id], pet.Name);
            }
            return Task.CompletedTask;
        });

        [SpectorTest]
        public Task RequestHeaderResponseBodyProtocolMethodSync() => Test((host) =>
        {
            var client = new PageableClient(host, null);
            var result = client.GetServerDrivenPaginationClient()
                .GetServerDrivenPaginationContinuationTokenClient()
                .RequestHeaderResponseBody(foo: "foo", bar: "bar");
            int count = 0;
            var expectedPets = new Dictionary<string, string>()
            {
                { "1", "dog" },
                { "2", "cat" },
                { "3", "bird" },
                { "4", "fish" },
            };
            foreach (var page in result.GetRawPages())
            {
                Assert.IsNotNull(page);
                var pageResult = JsonNode.Parse(page.GetRawResponse().Content.ToString())!;
                foreach (var pet in (pageResult["pets"] as JsonArray)!)
                {
                    Assert.IsNotNull(pet);
                    Assert.IsNotNull(pet);
                    Assert.AreEqual((++count).ToString(), pet!["id"]!.ToString());
                    Assert.AreEqual(expectedPets[pet["id"]!.ToString()], pet["name"]!.ToString());
                }
            }
            return Task.CompletedTask;
        });

        private static async Task ValidateProtocol(AsyncCollectionResult result, bool tokenInHeader)
        {
            int count = 0;
            var expectedPets = new Dictionary<string, string>()
            {
                { "1", "dog" },
                { "2", "cat" },
                { "3", "bird" },
                { "4", "fish" },
            };
            await foreach (var page in result.GetRawPagesAsync())
            {
                Assert.IsNotNull(page);
                var token = result.GetContinuationToken(page);
                ValidateContinuationToken(token, page, tokenInHeader, count < 2);
                var pageResult = JsonNode.Parse(page.GetRawResponse().Content.ToString())!;
                foreach (var pet in (pageResult["pets"] as JsonArray)!)
                {
                    Assert.IsNotNull(pet);
                    Assert.IsNotNull(pet);
                    Assert.AreEqual((++count).ToString(), pet!["id"]!.ToString());
                    Assert.AreEqual(expectedPets[pet["id"]!.ToString()], pet["name"]!.ToString());
                }
            }
        }

        private static async Task ValidateConvenience(AsyncCollectionResult<Pet> result, bool tokenInHeader)
        {
            int count = 0;
            var expectedPets = new Dictionary<string, string>()
            {
                { "1", "dog" },
                { "2", "cat" },
                { "3", "bird" },
                { "4", "fish" },
            };
            await foreach (var pet in result)
            {
                Assert.IsNotNull(pet);
                Assert.AreEqual((++count).ToString(), pet.Id);
                Assert.AreEqual(expectedPets[pet.Id], pet.Name);
            }

            count = 0;
            await foreach (var page in result.GetRawPagesAsync())
            {
                Assert.IsNotNull(page);
                var token = result.GetContinuationToken(page);
                var response = page.GetRawResponse();
                var pageResult = JsonNode.Parse(response.Content.ToString())!;
                ValidateContinuationToken(token, page, tokenInHeader, count < 2);

                foreach (var pet in (pageResult["pets"] as JsonArray)!)
                {
                    Assert.IsNotNull(pet);
                    Assert.IsNotNull(pet);
                    Assert.AreEqual((++count).ToString(), pet!["id"]!.ToString());
                    Assert.AreEqual(expectedPets[pet["id"]!.ToString()], pet["name"]!.ToString());
                }
            }

            Assert.AreEqual(4, count);
        }

        private static void ValidateContinuationToken(
            ContinuationToken? token,
            ClientResult page,
            bool tokenInHeader,
            bool hasMore)
        {
            if (!hasMore)
            {
                Assert.IsNull(token);
            }
            else
            {
                string? nextTokenValue;
                if (tokenInHeader)
                {
                    Assert.IsTrue(page.GetRawResponse().Headers.TryGetValue("next-token", out nextTokenValue));
                }
                else
                {
                    var pageResult = JsonNode.Parse(page.GetRawResponse().Content.ToString())!;
                    nextTokenValue = pageResult["nextToken"]?.ToString();
                }
                Assert.AreEqual(token!.ToBytes().ToString(), nextTokenValue);
            }
        }
    }
}
