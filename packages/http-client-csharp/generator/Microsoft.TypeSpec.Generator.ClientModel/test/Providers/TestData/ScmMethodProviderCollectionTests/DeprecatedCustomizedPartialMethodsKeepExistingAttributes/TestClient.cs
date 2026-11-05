// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        [Obsolete("Custom message")]
        public partial ClientResult Bar(CancellationToken cancellationToken);

        [Obsolete("Custom message")]
        public partial Task<ClientResult> BarAsync(CancellationToken cancellationToken);

        [Obsolete("Custom message")]
        public partial ClientResult Bar(RequestOptions options);

        [Obsolete("Custom message")]
        public partial Task<ClientResult> BarAsync(RequestOptions options);
    }
}
