// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        public partial ClientResult Send(BinaryContent payload, string mediaType, RequestOptions requestOptions);
        public partial Task<ClientResult> SendAsync(string asyncMediaType, BinaryContent asyncPayload, RequestOptions asyncOptions);
    }
}
