// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult Send(string sourceIpAddress, int oldValue, RequestOptions options) => default;
        public virtual Task<ClientResult> SendAsync(string sourceIpAddress, int oldValue, RequestOptions options) => default;
        public virtual ClientResult Send(string sourceIpAddress, int oldValue, CancellationToken cancellationToken = default) => default;
        public virtual Task<ClientResult> SendAsync(string sourceIpAddress, int oldValue, CancellationToken cancellationToken = default) => default;
    }
}
