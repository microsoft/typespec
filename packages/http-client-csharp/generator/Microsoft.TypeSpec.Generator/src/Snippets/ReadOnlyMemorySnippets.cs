// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class ReadOnlyMemorySnippets
    {
        public static ScopedApi<bool> IsEmpty(this ScopedApi<ReadOnlyMemory<byte>> memory) =>
            memory.Property(nameof(ReadOnlyMemory<byte>.IsEmpty)).As<bool>();

        public static ValueExpression Span(this ScopedApi<ReadOnlyMemory<byte>> memory) =>
            memory.Property(nameof(ReadOnlyMemory<byte>.Span));
    }
}
