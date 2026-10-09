// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult Send(BinaryContent content, string contentType, RequestOptions options = default) => default;
        public virtual Task<ClientResult> SendAsync(string contentType, BinaryContent content, RequestOptions options = default) => default;
    }
}
