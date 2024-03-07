// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    public class CadlRanchMockApiServerSession : TestServerSessionBase<CadlRanchMockApiServer>
    {
        private CadlRanchMockApiServerSession() : base()
        {
        }

        public static CadlRanchMockApiServerSession Start()
        {
            var server = new CadlRanchMockApiServerSession();
            return server;
        }

        public override ValueTask DisposeAsync()
        {
            Return();
            return new ValueTask();
        }
    }
}
