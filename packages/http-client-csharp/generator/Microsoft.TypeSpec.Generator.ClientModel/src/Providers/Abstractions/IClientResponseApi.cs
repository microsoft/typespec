// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public interface IClientResponseApi : IExpressionApi<ClientResponseApi>
    {
        CSharpType ClientResponseExceptionType { get; }

        CSharpType ClientResponseType { get; }

        CSharpType ClientResponseOfTType { get; }

        CSharpType ClientCollectionResponseType { get; }

        CSharpType ClientCollectionAsyncResponseType { get; }

        CSharpType ClientCollectionResponseOfTType { get; }

        CSharpType ClientCollectionAsyncResponseOfTType { get; }

        /// <summary>
        /// Gets whether paging collections support resuming enumeration from a continuation token.
        /// </summary>
        /// <remarks>
        /// When enabled, a paging method that has both a next-link response and a request parameter marked
        /// as the continuation token omits that parameter from its new public signatures. Callers resume
        /// through the returned collection instead, for example with Azure's <c>AsPages(continuationToken)</c>.
        /// Published token-bearing overloads and custom partial implementations are retained. If removing
        /// the parameter would cause a signature collision or ambiguous call, it is retained with a warning.
        /// Token-based paging without a next link, and next-link methods without a marked token parameter,
        /// are unaffected. Defaults to false to preserve existing method signatures.
        /// </remarks>
        bool SupportsPageResumption => false;

        string ResponseParameterName { get; }

        TypeProvider CreateClientCollectionResultDefinition(
            ClientProvider client,
            InputPagingServiceMethod serviceMethod,
            CSharpType? type,
            bool isAsync);
    }
}
