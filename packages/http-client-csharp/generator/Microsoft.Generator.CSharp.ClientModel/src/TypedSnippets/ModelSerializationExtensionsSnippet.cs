// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record ModelSerializationExtensionsSnippet(ValueExpression Untyped) : TypedSnippet<ModelSerializationExtensionsProvider>(Untyped)
    {
        private static ModelSerializationExtensionsProvider? _provider;
        private static ModelSerializationExtensionsProvider Provider => _provider ??= new();

        public static readonly ModelReaderWriterOptionsSnippet Wire = Provider.WireOptions;

        public static MethodBodyStatement WriteObjectValue(Utf8JsonWriterSnippet snippet, TypedSnippet value, ValueExpression? options = null)
            => Provider.WriteObjectValue(snippet, value, options: options);

        public static MethodBodyStatement WriteStringValue(Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => Provider.WriteStringValue(snippet, value, format);
    }
}
