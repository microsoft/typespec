// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Snippets
{
    public sealed record StreamSnippet(ValueExpression Untyped) : TypedSnippet<Stream>(Untyped)
    {
        public MethodBodyStatement CopyTo(StreamSnippet destination) => new InvokeInstanceMethodStatement(Untyped, nameof(Stream.CopyTo), destination);

        public ValueExpression Position => new MemberExpression(this, nameof(Stream.Position));
        public ValueExpression GetBuffer => new InvokeInstanceMethodExpression(this, nameof(MemoryStream.GetBuffer), Array.Empty<ValueExpression>(), null, false);
    }
}
