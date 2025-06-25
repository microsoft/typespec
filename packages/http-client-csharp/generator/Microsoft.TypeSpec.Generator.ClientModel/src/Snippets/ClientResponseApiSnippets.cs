// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Snippets;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class ClientResponseApiSnippets
    {
        public static ScopedApi<HttpResponseApi> GetRawResponse(this ScopedApi<ClientResponseApi> clientResponse)
            => clientResponse.Invoke(nameof(ClientResponseApi.GetRawResponse)).As<HttpResponseApi>();
    }
}
