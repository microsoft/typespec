// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public interface IClientResponseApi : IExpressionApi<ClientResponseApi>
    {
        CSharpType ClientResponseExceptionType { get; }

        CSharpType ClientResponseType { get; }

        CSharpType ClientResponseOfTType { get; }
    }
}
