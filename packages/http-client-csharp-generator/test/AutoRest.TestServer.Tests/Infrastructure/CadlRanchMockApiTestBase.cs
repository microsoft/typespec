﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading.Tasks;
using System;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    public abstract class CadlRanchMockApiTestBase
    {
        public async Task Test(Func<Uri, Task> test)
        {
            var server = CadlRanchMockApiServerSession.Start();

            try
            {
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
    }
}
