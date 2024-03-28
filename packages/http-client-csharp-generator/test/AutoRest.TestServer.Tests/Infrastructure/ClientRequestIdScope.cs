// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Threading;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    /// <summary>
    /// Prototype implementation of dynamic client id modification
    /// </summary>
    public class ClientRequestIdScope: IDisposable
    {
        private readonly string _value;
        private static AsyncLocal<ClientRequestIdScope?> _current = new AsyncLocal<ClientRequestIdScope?>();
        private ClientRequestIdScope? _parent;

        private ClientRequestIdScope(string value, ClientRequestIdScope? parent)
        {
            _value = value;
            _parent = parent;
        }

        public static string? CurrentClientRequestId => _current.Value?._value;
        public static ClientRequestIdScope Start(string clientRequestId)
        {
            _current.Value =  new ClientRequestIdScope(clientRequestId, _current.Value);
            return _current.Value;
        }

        public void Dispose()
        {
            _current.Value = _parent;
        }
    }
}
