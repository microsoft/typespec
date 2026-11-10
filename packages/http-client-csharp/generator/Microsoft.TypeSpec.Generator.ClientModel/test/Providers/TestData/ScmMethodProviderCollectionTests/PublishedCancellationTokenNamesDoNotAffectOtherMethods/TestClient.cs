// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult Send(CancellationToken sendToken = default) => default;
        public virtual Task<ClientResult> SendAsync(CancellationToken sendAsyncToken = default) => default;
        public virtual ClientResult Receive(CancellationToken receiveToken = default) => default;
        public virtual Task<ClientResult> ReceiveAsync(CancellationToken receiveAsyncToken = default) => default;
    }
}
