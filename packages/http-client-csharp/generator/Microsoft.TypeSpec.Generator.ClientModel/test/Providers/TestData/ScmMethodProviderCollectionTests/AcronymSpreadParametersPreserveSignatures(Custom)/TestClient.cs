// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public partial ClientResult Send(string customDbNameSync, string customIpAddressSync, string customOsTypeSync, CancellationToken customTokenSync);
        public partial Task<ClientResult> SendAsync(string customDbNameAsync, string customIpAddressAsync, string customOsTypeAsync, CancellationToken customTokenAsync);
    }
}
