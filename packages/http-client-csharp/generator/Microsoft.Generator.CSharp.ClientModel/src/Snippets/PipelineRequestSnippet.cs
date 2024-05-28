// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record PipelineRequestSnippet(ValueExpression Untyped) : TypedSnippet<PipelineRequest>(Untyped)
    {
        public TypedSnippet Uri => new FrameworkTypeSnippet(typeof(Uri), Property(nameof(PipelineRequest.Uri)));
        public MethodBodyStatement SetMethod(string method) => Assign(Untyped.Property("Method"), Literal(method));
        public MethodBodyStatement SetHeaderValue(string name, StringSnippet value)
            => new InvokeInstanceMethodStatement(Untyped.Property(nameof(PipelineRequest.Headers)), nameof(PipelineRequestHeaders.Set), Literal(name), value);
    }
}
