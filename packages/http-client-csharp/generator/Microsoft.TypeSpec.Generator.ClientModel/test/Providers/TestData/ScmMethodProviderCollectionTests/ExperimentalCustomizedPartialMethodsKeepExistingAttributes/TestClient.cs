// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Diagnostics.CodeAnalysis;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        [Experimental("CUSTOM001")]
        public partial ClientResult Bar(RequestOptions options);
        [Experimental("CUSTOM001")]
        public partial Task<ClientResult> BarAsync(RequestOptions options);
        [Experimental("CUSTOM001")]
        public partial ClientResult Bar(CancellationToken cancellationToken);
        [Experimental("CUSTOM001")]
        public partial Task<ClientResult> BarAsync(CancellationToken cancellationToken);
    }
}
