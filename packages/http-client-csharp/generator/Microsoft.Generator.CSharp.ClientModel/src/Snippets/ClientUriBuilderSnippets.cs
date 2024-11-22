// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class ClientUriBuilderSnippets
    {
        public static InvokeMethodExpression Reset(this ScopedApi uriBuilder, ValueExpression baseUri)
            => uriBuilder.Invoke("Reset", baseUri);

        public static InvokeMethodExpression AppendPath(this ScopedApi uriBuilder, ValueExpression path, bool? shouldEscape)
            => uriBuilder.Invoke("AppendPath", path, Literal(shouldEscape));

        public static InvokeMethodExpression AppendPathDelimited(this ScopedApi uriBuilder, ValueExpression path, string? format, bool? shouldEscape, string? delimiter = ",")
            => uriBuilder.Invoke("AppendPathDelimited", [path, Literal(delimiter), Literal(format), Literal(shouldEscape)]);

        public static InvokeMethodExpression AppendQuery(this ScopedApi uriBuilder, ValueExpression name, ValueExpression value, bool shouldEscape)
            => uriBuilder.Invoke("AppendQuery", [name, value, Literal(shouldEscape)]);

        public static InvokeMethodExpression AppendQuery(this ScopedApi uriBuilder, ValueExpression name, ValueExpression value, string? format, bool shouldEscape)
            => uriBuilder.Invoke("AppendQuery", [name, value, Literal(format), Literal(shouldEscape)]);

        public static InvokeMethodExpression AppendQueryDelimited(this ScopedApi uriBuilder, ValueExpression name, ValueExpression value, string? format, bool shouldEscape, string? delimiter = ",")
            => uriBuilder.Invoke("AppendQueryDelimited", [name, value, Literal(delimiter), Literal(format), Literal(shouldEscape)]);

        public static ScopedApi<Uri> ToUri(this ScopedApi uriBuilder)
            => uriBuilder.Invoke("ToUri").As<Uri>();
    }
}
