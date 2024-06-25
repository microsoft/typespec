// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Snippets;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal static class Utf8JsonWriterSnippetExtensions
    {
        public static MethodBodyStatement WriteObjectValue(this Utf8JsonWriterSnippet snippet, TypedSnippet value, ValueExpression? options = null)
             => ModelSerializationExtensionsSnippet.WriteObjectValue(snippet, value, options: options);

        public static MethodBodyStatement WriteStringValue(this Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => ModelSerializationExtensionsSnippet.WriteStringValue(snippet, value, format);
    }
}
