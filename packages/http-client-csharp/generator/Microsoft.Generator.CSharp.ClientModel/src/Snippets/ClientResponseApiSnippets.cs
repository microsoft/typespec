// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class ClientResponseApiSnippets
    {
        public static ScopedApi<HttpResponseApi> GetRawResponse(this ClientResponseApi clientResponse)
            => clientResponse.Invoke(nameof(ClientResponseApi.GetRawResponse)).As<HttpResponseApi>();
    }
}
