// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class MemoryStreamSnippets
    {
        public static ScopedApi<MemoryStream> New(ValueExpression capacity)
            => Snippet.New.Instance<MemoryStream>(capacity);

        public static ScopedApi<byte[]> GetBuffer(this ScopedApi<MemoryStream> stream)
            => stream.Invoke(nameof(MemoryStream.GetBuffer)).As<byte[]>();

        public static ScopedApi<long> Position(this ScopedApi<MemoryStream> stream)
            => stream.Property(nameof(MemoryStream.Position)).As<long>();

        /// <summary>
        /// Returns a zero-copy <see cref="ReadOnlyMemory{T}"/> view over the bytes written to the
        /// stream (<c>GetBuffer().AsMemory(0, (int)Position)</c>), avoiding the array copy of <c>ToArray()</c>.
        /// </summary>
        public static ScopedApi<ReadOnlyMemory<byte>> GetWrittenMemory(this ScopedApi<MemoryStream> stream)
            => stream.GetBuffer().Invoke(
                nameof(MemoryExtensions.AsMemory),
                [Int(0), stream.Position().CastTo(typeof(int))]).As<ReadOnlyMemory<byte>>();
    }
}
