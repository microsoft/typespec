// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal static class Utf8JsonWriterSnippetExtensions
    {
        public static MethodBodyStatement WriteObjectValue(this Utf8JsonWriterSnippet snippet, TypedSnippet value, ValueExpression? options = null)
             => ModelSerializationExtensionsProvider.Instance.WriteObjectValue(snippet, value, options: options);

        public static MethodBodyStatement WriteStringValue(this Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => ModelSerializationExtensionsProvider.Instance.WriteStringValue(snippet, value, format);

        public static MethodBodyStatement WriteBase64StringValue(this Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => ModelSerializationExtensionsProvider.Instance.WriteBase64StringValue(snippet, value, format);

        public static MethodBodyStatement WriteNumberValue(this Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => ModelSerializationExtensionsProvider.Instance.WriteNumberValue(snippet, value, format);
    }
}
