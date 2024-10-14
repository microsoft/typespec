// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Primitives;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    public interface IHttpMessageApi : IExpressionApi<HttpMessageApi>
    {
        CSharpType HttpMessageType { get; }
    }
}
