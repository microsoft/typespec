// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading.Tasks;
using Azure;
using Azure.Core;
using Azure.Core.Pipeline;
using NUnit.Framework;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    public abstract class TestServerLowLevelTestBase
    {
        protected static AzureKeyCredential Key = new AzureKeyCredential("NOT-A-VALID-KEY");

        public Task TestStatus(Func<Uri, Response> test, bool ignoreScenario = false)
        {
            return TestStatus(host => Task.FromResult(test(host)), ignoreScenario);
        }

        public Task TestStatus(Func<Uri, Task<Response>> test, bool ignoreScenario = false)
        {
            return TestStatus(GetScenarioName(), test, ignoreScenario);
        }

        private Task TestStatus(string scenario, Func<Uri, Task<Response>> test, bool ignoreScenario = false) => Test(scenario, async host =>
        {
            TestServerTestBase.AssertValidStatus(await test(host));
        }, ignoreScenario);

        public Task Test(Action<Uri> test, bool ignoreScenario = false) => Test(GetScenarioName(), host =>
        {
            test(host);
            return Task.CompletedTask;
        }, ignoreScenario);

        public Task Test(Func<Uri, Task> test, bool ignoreScenario = false)
        {
            return Test(GetScenarioName(), test, ignoreScenario);
        }

        private async Task Test(string scenario, Func<Uri, Task> test, bool ignoreScenario = false)
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

                await test(server.Host);
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
            var indexOfDelimiter = testName.LastIndexOf('_');
            if (indexOfDelimiter == -1)
            {
                indexOfDelimiter = testName.IndexOf('(');
            }
            var name = indexOfDelimiter == -1 ? testName : testName[..indexOfDelimiter];
            return name;
        }

        private class TestClientOptions : ClientOptions
        {

        }
    }
}
