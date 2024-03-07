// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Linq;
using System.Threading.Tasks;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    public class TestServerSession : TestServerSessionBase<TestServerV1>
    {
        private readonly string _scenario;
        private readonly bool _allowUnmatched;
        private readonly string[] _expectedCoverage;

        private TestServerSession(string scenario, bool allowUnmatched, string[] expectedCoverage): base()
        {
            _scenario = scenario;
            _allowUnmatched = allowUnmatched;
            _expectedCoverage = expectedCoverage;
        }

        public static TestServerSession Start(string scenario, bool allowUnmatched = false, params string[] expectedCoverage)
        {
            var server = new TestServerSession(scenario, allowUnmatched, expectedCoverage);
            return server;
        }

        public override ValueTask DisposeAsync() => DisposeAsync(false);

        public async ValueTask DisposeAsync(bool ignoreChecks)
        {
            try
            {
                var matched = await Server.GetMatchedStubs(_scenario);

                if (!ignoreChecks && !_allowUnmatched)
                {
                    var requests = await Server.GetRequests();
                    if (requests.Any())
                    {
                        throw new InvalidOperationException($"Some requests were not matched {string.Join(Environment.NewLine, requests)}");
                    }
                }

                if (!ignoreChecks && _expectedCoverage != null)
                {
                    foreach (var expectedStub in _expectedCoverage)
                    {
                        if (!matched.Contains(expectedStub, StringComparer.InvariantCultureIgnoreCase))
                        {
                            throw new InvalidOperationException($"Expected stub {expectedStub} was not matched, matched: {string.Join(Environment.NewLine, matched)}");
                        }
                    }
                }
            }
            finally
            {
                // await Server.ResetAsync();
                Return();
            }
        }

    }
}
