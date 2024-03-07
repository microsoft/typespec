// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    public class TestServerV1 : TestServerBase
    {
        public TestServerV1(): base(GetBaseDirectory(), $"--port 0 --coverageDirectory {GetCoverageDirectory()}")
        {
        }

        internal static string GetBaseDirectory()
        {
            var nodeModules = GetNodeModulesDirectory();
            return Path.Combine(nodeModules, "@microsoft.azure", "autorest.testserver");
        }

        public Task<string[]> GetRequests()
        {
            return Task.FromResult(Array.Empty<string>());
        }

        public async Task ResetAsync()
        {
            ByteArrayContent emptyContent = new ByteArrayContent(Array.Empty<byte>());

            using var response = await Client.PostAsync("/report/clear", emptyContent);
            response.EnsureSuccessStatusCode();
        }

        public async Task<string[]> GetMatchedStubs(string testName)
        {
            HashSet<string> results = new HashSet<string>();

            await CollectCoverage(results, "/report", testName);
            await CollectCoverage(results, "/report/azure", testName);
            await CollectCoverage(results, "/report/optional", testName);
            await CollectCoverage(results, "/report/dpg", testName);

            return results.ToArray();
        }

        private async Task CollectCoverage(HashSet<string> results, string url, string testName)
        {
            var coverageString = await Client.GetStringAsync($"{url}?qualifier={testName}");
            var coverageDocument = JsonDocument.Parse(coverageString);

            foreach (var request in coverageDocument.RootElement.EnumerateObject())
            {
                var mapping = request.Name;
                if (request.Value.ValueKind != JsonValueKind.Number) continue;
                int value = request.Value.GetInt32();
                // HeaderParameterProtectedKey is always matched
                if (mapping == "HeaderParameterProtectedKey" && value == 1)
                {
                    continue;
                }

                if (value != 0)
                {
                    results.Add(mapping);
                }
            }
        }
    }
}
