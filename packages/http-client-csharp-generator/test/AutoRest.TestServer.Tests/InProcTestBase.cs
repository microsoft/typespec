// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.TestServer.Tests.Infrastructure;
using Azure.Core;
using Azure.Core.Pipeline;

namespace AutoRest.TestServer.Tests
{
    public class InProcTestBase
    {
        internal static ClientDiagnostics ClientDiagnostics = new ClientDiagnostics(new TestOptions());
        internal static HttpPipeline HttpPipeline = HttpPipelineBuilder.Build(new TestOptions());
        internal static ClientOptions ClientOptions = new TestOptions();
    }
}
