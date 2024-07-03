// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Snippets
{
#pragma warning disable SA1649 // File name should match first type name
    public sealed record ScopedApi<T>(ValueExpression Original) : ScopedApi(typeof(T), Original)
#pragma warning restore SA1649 // File name should match first type name
    {
    }
}
