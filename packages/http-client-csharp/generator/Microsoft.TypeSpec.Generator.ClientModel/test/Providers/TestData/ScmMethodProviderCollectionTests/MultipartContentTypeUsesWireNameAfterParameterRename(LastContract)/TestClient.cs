// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public virtual ClientResult Send(BinaryContent payload, string mediaType, RequestOptions requestOptions = default) => default;
        public virtual Task<ClientResult> SendAsync(BinaryContent asyncPayload, string asyncMediaType, RequestOptions asyncOptions = default) => default;
    }
}
