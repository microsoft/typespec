// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public interface IHttpMessageApi : IExpressionApi<HttpMessageApi>
    {
        CSharpType HttpMessageType { get; }
    }
}
