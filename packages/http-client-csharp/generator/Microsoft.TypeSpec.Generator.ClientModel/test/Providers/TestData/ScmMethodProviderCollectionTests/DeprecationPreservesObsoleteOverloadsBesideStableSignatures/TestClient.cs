// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public class TestClient
    {
        [Obsolete("Previous message")]
        public ClientResult Read(int value, CancellationToken cancellationToken = default) => throw null;

        [Obsolete("Previous message")]
        public Task<ClientResult> ReadAsync(int value, CancellationToken cancellationToken = default) => throw null;

        [Obsolete("Previous message")]
        public ClientResult Read(int value, RequestOptions options) => throw null;

        [Obsolete("Previous message")]
        public Task<ClientResult> ReadAsync(int value, RequestOptions options) => throw null;

        public ClientResult Read(int value, bool? added = default, CancellationToken cancellationToken = default) => throw null;

        public Task<ClientResult> ReadAsync(int value, bool? added = default, CancellationToken cancellationToken = default) => throw null;

        public ClientResult Read(int value, bool? added, RequestOptions options) => throw null;

        public Task<ClientResult> ReadAsync(int value, bool? added, RequestOptions options) => throw null;
    }
}
