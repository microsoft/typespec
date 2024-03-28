// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using Azure;
using Azure.Core;
using Azure.Core.Pipeline;
using Microsoft.AspNetCore.Http;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    [Parallelizable(ParallelScope.Fixtures)]
    public abstract class TestServerTestBase
    {
        internal static ClientDiagnostics ClientDiagnostics = new ClientDiagnostics(new TestOptions());

        public Task TestStatus(Func<Uri, HttpPipeline, Response> test, bool ignoreScenario = false, bool useSimplePipeline = false)
        {
            return TestStatus((host, pipeline) => Task.FromResult(test(host, pipeline)), ignoreScenario, useSimplePipeline);
        }

        public Task TestStatus(Func<Uri, HttpPipeline, Task<Response>> test, bool ignoreScenario = false, bool useSimplePipeline = false)
        {
            return TestStatus(GetScenarioName(), test, ignoreScenario, useSimplePipeline);
        }

        internal static void AssertValidStatus(Response r)
        {
            switch (r.Status) {
                case 200:
                case 201:
                case 202:
                case 204:
                    return;
                default:
                    string content = r.Content.ToString();
                    string trimmedContent = content.Substring(0, Math.Min(content.Length, 2000));
                    string message = $"Unexpected response in test.\n Status: {r.Status}\n Reason: {r.ReasonPhrase}\nContent: {trimmedContent}";
                    Assert.Fail (message);
                    return;
            }
        }

        private Task TestStatus(string scenario, Func<Uri, HttpPipeline, Task<Response>> test, bool ignoreScenario = false, bool useSimplePipeline = false) => Test(scenario, async (host, pipeline) =>
        {
            AssertValidStatus (await test(host, pipeline));
        }, ignoreScenario, useSimplePipeline);

        public Task Test(Action<Uri, HttpPipeline> test, bool ignoreScenario = false, bool useSimplePipeline = false)
        {
            return Test(GetScenarioName(), (host, pipeline) =>
            {
                test(host, pipeline);
                return Task.CompletedTask;
            }, ignoreScenario, useSimplePipeline);
        }

        public Task Test(Func<Uri, HttpPipeline, Task> test, bool ignoreScenario = false, bool useSimplePipeline = false)
        {
            return Test(GetScenarioName(), test, ignoreScenario, useSimplePipeline);
        }

        private async Task Test(string scenario, Func<Uri, HttpPipeline, Task> test, bool ignoreScenario = false, bool useSimplePipeline = false)
        {
            var scenarioParameter = ignoreScenario ? new string[0] : new[] {scenario};
            var server = TestServerSession.Start(scenario, false, scenarioParameter);

            try
            {
                var transport = new HttpClientTransport(server.Server.Client);
                var testClientOptions = new TestClientOptions
                {
                    Transport = new FailureInjectingTransport(transport),
                    Retry = { Delay = TimeSpan.FromMilliseconds(1) },
                };
                testClientOptions.AddPolicy(new CustomClientRequestIdPolicy(), HttpPipelinePosition.PerCall);

                var pipeline = useSimplePipeline
                    ? new HttpPipeline(transport)
                    : HttpPipelineBuilder.Build(testClientOptions);

                await test(server.Host, pipeline);
            }
            catch (Exception ex)
            {
                try
                {
                    await server.DisposeAsync();
                }
                catch (Exception disposeException)
                {
                    throw new AggregateException(ex, disposeException);
                }

                throw;
            }

            await server.DisposeAsync();
        }

        private static string GetScenarioName()
        {
            var testName = TestContext.CurrentContext.Test.Name;
            var indexOfUnderscore = testName.IndexOf('_');
            return indexOfUnderscore == -1 ? testName : testName.Substring(0, indexOfUnderscore);
        }

        private class TestClientOptions : ClientOptions
        {

        }
    }
}
