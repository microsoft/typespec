// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal static class ClientUriBuilderSnippets
    {
        public static InvokeMethodExpression Reset(this ScopedApi<ClientUriBuilderDefinition> uriBuilder, ValueExpression baseUri)
            => uriBuilder.Invoke("Reset", baseUri);

        public static InvokeMethodExpression AppendPath(this ScopedApi<ClientUriBuilderDefinition> uriBuilder, ValueExpression path, bool shouldEscape)
            => uriBuilder.Invoke("AppendPath", path, Literal(shouldEscape));

        public static InvokeMethodExpression AppendQuery(this ScopedApi<ClientUriBuilderDefinition> uriBuilder, ValueExpression name, ValueExpression value, bool shouldEscape)
            => uriBuilder.Invoke("AppendQuery", [name, value, Literal(shouldEscape)]);

        public static InvokeMethodExpression AppendQuery(this ScopedApi<ClientUriBuilderDefinition> uriBuilder, ValueExpression name, ValueExpression value, string? format, bool shouldEscape)
            => uriBuilder.Invoke("AppendQuery", [name, value, Literal(format), Literal(shouldEscape)]);

        public static InvokeMethodExpression AppendQueryDelimited(this ScopedApi<ClientUriBuilderDefinition> uriBuilder, ValueExpression name, ValueExpression value, string? format, bool shouldEscape)
            => uriBuilder.Invoke("AppendQueryDelimited", [name, value, Literal(","), Literal(format), Literal(shouldEscape)]);

        public static ScopedApi<Uri> ToUri(this ScopedApi<ClientUriBuilderDefinition> uriBuilder)
            => uriBuilder.Invoke("ToUri").As<Uri>();
    }
}
