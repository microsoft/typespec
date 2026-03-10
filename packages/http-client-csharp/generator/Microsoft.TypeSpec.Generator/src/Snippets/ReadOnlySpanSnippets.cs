// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class ReadOnlySpanSnippets
    {
        public static ScopedApi<bool> IsEmpty(ValueExpression span) =>
            span.Property(nameof(ReadOnlySpan<byte>.IsEmpty)).As<bool>();

        public static ScopedApi<int> Length(ValueExpression span) =>
            span.Property(nameof(ReadOnlySpan<byte>.Length)).As<int>();

        public static ValueExpression Empty() => Static(typeof(ReadOnlySpan<byte>)).Property(nameof(ReadOnlySpan<byte>.Empty));

        public static ValueExpression Slice(ValueExpression span, ValueExpression start) =>
            span.Invoke(nameof(ReadOnlySpan<byte>.Slice), [start]);
        public static ValueExpression Slice(ValueExpression span, ValueExpression start, ValueExpression length) =>
            span.Invoke(nameof(ReadOnlySpan<byte>.Slice), [start, length]);
    }
}
