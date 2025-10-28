// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Threading.Tasks;
using NUnit.Framework;
using Payload.Pageable;

namespace TestProjects.Spector.Tests.Http.Payload.Pageable
{
    public class NoContinuationPaginationTests : SpectorTestBase
    {
        [SpectorTest]
        public Task ConvenienceMethod() => Test(async (host) =>
        {
            var client = new PageableClient(host, null).GetPageSizeClient();
            var result = client.GetWithoutContinuationAsync();
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
        });
    }
}
