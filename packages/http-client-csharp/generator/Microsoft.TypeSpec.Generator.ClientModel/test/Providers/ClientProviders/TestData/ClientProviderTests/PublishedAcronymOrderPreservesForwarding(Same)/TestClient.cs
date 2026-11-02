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
        public virtual ClientResult Send(string targetDbName, string sourceIpAddress, bool? filter = default, RequestOptions options = default) => default;
        public virtual Task<ClientResult> SendAsync(string sourceIpAddress, string targetDbName, bool? filter = default, RequestOptions options = default) => default;
        public virtual ClientResult Send(string targetDbName, string sourceIpAddress = default, CancellationToken cancellationToken = default) => default;
        public virtual Task<ClientResult> SendAsync(string targetDbName, string sourceIpAddress = default, CancellationToken cancellationToken = default) => default;
        public virtual ClientResult Send(string targetDbName, string sourceIpAddress, bool? filter, CancellationToken cancellationToken = default) => default;
        public virtual Task<ClientResult> SendAsync(string targetDbName, string sourceIpAddress, bool? filter, CancellationToken cancellationToken = default) => default;
    }
}
