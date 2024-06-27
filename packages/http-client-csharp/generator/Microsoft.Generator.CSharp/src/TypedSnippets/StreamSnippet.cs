// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record StreamSnippet(ValueExpression Untyped) : TypedSnippet<Stream>(Untyped)
    {
        public static StreamSnippet FileOpenRead(string filePath)
            => new(new InvokeStaticMethodExpression(typeof(File), nameof(File.OpenRead), [Literal(filePath)]));
        public static StreamSnippet FileOpenWrite(string filePath)
            => new(new InvokeStaticMethodExpression(typeof(File), nameof(File.OpenWrite), [Literal(filePath)]));

        public MethodBodyStatement CopyTo(StreamSnippet destination) => Untyped.Invoke(nameof(Stream.CopyTo), destination).Terminate();

        public ValueExpression Position => new MemberExpression(this, nameof(Stream.Position));
        public ValueExpression GetBuffer => new InvokeInstanceMethodExpression(this, nameof(MemoryStream.GetBuffer), Array.Empty<ValueExpression>(), null, false);
    }
}
