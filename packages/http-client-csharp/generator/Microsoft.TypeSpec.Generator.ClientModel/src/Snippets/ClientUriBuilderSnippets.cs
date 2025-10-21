// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Snippets;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
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

        public static InvokeMethodExpression AppendQuery(this ScopedApi uriBuilder, ValueExpression name, ValueExpression value, ValueExpression format, bool shouldEscape)
            => uriBuilder.Invoke("AppendQuery", [name, value, Literal(format), Literal(shouldEscape)]);

        public static InvokeMethodExpression AppendQueryDelimited(this ScopedApi uriBuilder, ValueExpression name, ValueExpression value, ValueExpression? format, bool shouldEscape, string? delimiter = ",")
            => format != null
                ? uriBuilder.Invoke("AppendQueryDelimited", [name, value, Literal(delimiter), format, PositionalReference("escape", Literal(shouldEscape))])
                : uriBuilder.Invoke("AppendQueryDelimited", [name, value, Literal(delimiter), PositionalReference("escape", Literal(shouldEscape))]);

        public static ScopedApi<Uri> ToUri(this ScopedApi uriBuilder)
            => uriBuilder.Invoke("ToUri").As<Uri>();
    }
}
