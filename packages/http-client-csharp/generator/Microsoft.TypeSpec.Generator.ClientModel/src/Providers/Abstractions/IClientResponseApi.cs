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
        /// When enabled, next-link paging methods omit the raw request continuation-token parameter
        /// from new public signatures. Callers must be able to resume paging through the returned collection.
        /// Defaults to false to preserve existing method signatures.
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
