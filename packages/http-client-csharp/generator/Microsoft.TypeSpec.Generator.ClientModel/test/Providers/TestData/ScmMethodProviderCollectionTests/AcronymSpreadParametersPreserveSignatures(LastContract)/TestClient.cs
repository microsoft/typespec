// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult Send(string publishedDbNameSync, string publishedIpAddressSync, string publishedOsTypeSync = default, CancellationToken publishedTokenSync = default) => default;
        public virtual Task<ClientResult> SendAsync(string publishedDbNameAsync, string publishedIpAddressAsync, string publishedOsTypeAsync = default, CancellationToken publishedTokenAsync = default) => default;
    }
}
