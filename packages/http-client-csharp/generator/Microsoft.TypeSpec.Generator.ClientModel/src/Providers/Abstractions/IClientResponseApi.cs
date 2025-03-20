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

        TypeProvider CreateClientCollectionResultDefinition(
            ClientProvider client,
            InputOperation operation,
            CSharpType? type,
            bool isAsync);
    }
}
