// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class ReadOnlyMemorySnippets
    {
        public static ScopedApi<bool> IsEmpty(this ScopedApi<ReadOnlyMemory<byte>> memory) =>
            memory.Property(nameof(ReadOnlyMemory<byte>.IsEmpty)).As<bool>();

        public static ValueExpression Span(this ScopedApi<ReadOnlyMemory<byte>> memory) =>
            memory.Property(nameof(ReadOnlyMemory<byte>.Span));

        public static ScopedApi<ReadOnlyMemory<byte>> Empty() =>
            Static<ReadOnlyMemory<byte>>().Property(nameof(ReadOnlyMemory<byte>.Empty)).As<ReadOnlyMemory<byte>>();
    }
}
