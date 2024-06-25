// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Snippets
{
    internal sealed record ModelSerializationExtensionsSnippet(ValueExpression Untyped) : TypedSnippet<ModelSerializationExtensionsProvider>(Untyped)
    {
        private static ModelSerializationExtensionsProvider? _provider;
        private static ModelSerializationExtensionsProvider Provider => _provider ??= new();

        public static readonly ModelReaderWriterOptionsSnippet Wire = Provider.WireOptions;

        public static MethodBodyStatement WriteObjectValue(Utf8JsonWriterSnippet snippet, TypedSnippet value, ValueExpression? options = null)
        {
            var parameters = options is null
                ? new ValueExpression[] { snippet, value }
                : new ValueExpression[] { snippet, value, options };
            return new InvokeStaticMethodStatement(Provider.Type, ModelSerializationExtensionsProvider.WriteObjectValueMethodName, parameters, callAsExtension: true, typeArguments: [value.Type]);
        }

        public static MethodBodyStatement WriteStringValue(Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => new InvokeStaticMethodStatement(Provider.Type, ModelSerializationExtensionsProvider.WriteStringValueMethodName, new[] { snippet, value, Literal(format) }, callAsExtension: true);

        public static MethodBodyStatement WriteNumberValue(Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => new InvokeStaticMethodStatement(Provider.Type, ModelSerializationExtensionsProvider.WriteNumberValueMethodName, new[] { snippet, value, Literal(format) }, callAsExtension: true);

        public static MethodBodyStatement WriteBase64StringValue(Utf8JsonWriterSnippet snippet, ValueExpression value, string? format)
            => new InvokeStaticMethodStatement(Provider.Type, ModelSerializationExtensionsProvider.WriteBase64StringValueMethodName, new[] { snippet, value, Literal(format) }, callAsExtension: true);
    }
}
