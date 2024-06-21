// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal static class JsonElementSnippetExtensions
    {
        public static ValueExpression GetBytesFromBase64(this JsonElementSnippet snippet, string? format) =>
            ModelSerializationExtensionsProvider.Instance.GetBytesFromBase64(snippet, format);

        public static ValueExpression GetObject(this JsonElementSnippet snippet)
                => ModelSerializationExtensionsProvider.Instance.GetObject(snippet);

        public static ValueExpression GetChar(this JsonElementSnippet snippet)
                => ModelSerializationExtensionsProvider.Instance.GetChar(snippet);
        public static ValueExpression GetDateTimeOffset(this JsonElementSnippet snippet, string? format)
                => ModelSerializationExtensionsProvider.Instance.GetDateTimeOffset(snippet, format);

        public static ValueExpression GetTimeSpan(this JsonElementSnippet snippet, string? format)
                => ModelSerializationExtensionsProvider.Instance.GetTimeSpan(snippet, format);
    }
}
