// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using Azure.Core;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    public abstract class TestServerSessionBase<T> : IAsyncDisposable where T : TestServerBase
    {
        private static readonly object _serverCacheLock = new object();
        private static T _serverCache;

        public T Server { get; private set; }
        public Uri Host => Server.Host;

        protected TestServerSessionBase()
        {
            Server = GetServer();
        }

        private ref T GetServerCache()
        {
            return ref _serverCache;
        }

        private T CreateServer()
        {
            return (T)Activator.CreateInstance(typeof(T));
        }

        private T GetServer()
        {
            T server;
            lock (_serverCacheLock)
            {
                ref var cache = ref GetServerCache();
                server = cache;
                cache = null;
            }

            if (server == null)
            {
                server = CreateServer();
            }

            return server;
        }

        public abstract ValueTask DisposeAsync();

        protected void Return()
        {
            bool disposeServer = true;
            lock (_serverCacheLock)
            {
                ref var cache = ref GetServerCache();
                if (cache == null)
                {
                    cache = Server;
                    Server = null;
                    disposeServer = false;
                }
            }

            if (disposeServer)
            {
                Server?.Dispose();
            }
        }
    }
}
