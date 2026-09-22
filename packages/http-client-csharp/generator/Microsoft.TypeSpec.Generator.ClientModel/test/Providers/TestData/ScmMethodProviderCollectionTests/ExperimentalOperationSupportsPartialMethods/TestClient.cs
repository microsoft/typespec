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
        public partial ClientResult Bar(RequestOptions options);
        public partial Task<ClientResult> BarAsync(RequestOptions options);
        public partial ClientResult Bar(CancellationToken cancellationToken);
        public partial Task<ClientResult> BarAsync(CancellationToken cancellationToken);
    }
}
