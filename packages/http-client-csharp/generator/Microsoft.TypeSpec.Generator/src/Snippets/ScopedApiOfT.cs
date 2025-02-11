// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Snippets
{
#pragma warning disable SA1649 // File name should match first type name
    public sealed record ScopedApi<T> : ScopedApi
#pragma warning restore SA1649 // File name should match first type name
    {
        public ScopedApi(ValueExpression original)
            : base(typeof(T), original)
        {
        }

        public new ScopedApi<T> NullConditional() => Original.NullConditional().As<T>();
    }
}
