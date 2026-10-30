// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Diagnostics.CodeAnalysis;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public class TestClient
    {
        public ClientResult Bar(CancellationToken cancellationToken = default) => throw null;

        [Obsolete("Previous message")]
        public Task<ClientResult> BarAsync(CancellationToken cancellationToken = default) => throw null;

        [Obsolete("Previous message")]
        public ClientResult Bar(RequestOptions options) => throw null;

        public Task<ClientResult> BarAsync(RequestOptions options) => throw null;

        [Experimental("PREVIEW001")]
        public ClientResult Preview(CancellationToken cancellationToken = default) => throw null;

        [Experimental("PREVIEW001")]
        public Task<ClientResult> PreviewAsync(CancellationToken cancellationToken = default) => throw null;

        [Experimental("PREVIEW001")]
        public ClientResult Preview(RequestOptions options) => throw null;

        [Experimental("PREVIEW001")]
        public Task<ClientResult> PreviewAsync(RequestOptions options) => throw null;
    }
}
