// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.TestServer.Tests.Infrastructure;
using NUnit.Framework;

[SetUpFixture]
public static class AssemblyCleanFixture
{
    [OneTimeTearDown]
    public static void RunOnAssemblyCleanUp()
    {
        CadlRanchNonAzureServerSession.Start().Server?.Dispose();
    }
}
