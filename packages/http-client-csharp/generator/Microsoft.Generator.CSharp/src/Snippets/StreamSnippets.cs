// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public static class StreamSnippets
    {
        public static ScopedApi<Stream> FileOpenRead(string filePath)
            => Static(typeof(File)).Invoke(nameof(File.OpenRead), [Literal(filePath)]).As<Stream>();

        public static ScopedApi<Stream> FileOpenWrite(string filePath)
            => Static(typeof(File)).Invoke(nameof(File.OpenWrite), [Literal(filePath)]).As<Stream>();

        public static MethodBodyStatement CopyTo(this ScopedApi<Stream> streamExpression, ScopedApi<Stream> destination)
            => streamExpression.Invoke(nameof(Stream.CopyTo), destination).Terminate();

        public static ScopedApi<long> Position(this ScopedApi<Stream> streamExpression)
            => streamExpression.Property(nameof(Stream.Position)).As<long>();

        public static ScopedApi<byte[]> GetBuffer(this ScopedApi<Stream> streamExpression)
            => streamExpression.Invoke(nameof(MemoryStream.GetBuffer), [], null, false).As<byte[]>();
    }
}
