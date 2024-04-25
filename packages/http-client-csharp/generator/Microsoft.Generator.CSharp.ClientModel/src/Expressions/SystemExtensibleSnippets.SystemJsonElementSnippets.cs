// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Internal;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.ClientModel.Expressions
{
    internal partial class SystemExtensibleSnippets
    {
        private class SystemJsonElementSnippets : JsonElementSnippets
        {
            public override ValueExpression GetBytesFromBase64(JsonElementExpression element, string? format) => InvokeExtension(typeof(ModelSerializationExtensions), element, nameof(ModelSerializationExtensions.GetBytesFromBase64), Snippets.Literal(format));
            public override ValueExpression GetChar(JsonElementExpression element) => InvokeExtension(typeof(ModelSerializationExtensions), element, nameof(ModelSerializationExtensions.GetChar));
            public override ValueExpression GetDateTimeOffset(JsonElementExpression element, string? format) => InvokeExtension(typeof(ModelSerializationExtensions), element, nameof(ModelSerializationExtensions.GetDateTimeOffset), Snippets.Literal(format));
            public override ValueExpression GetObject(JsonElementExpression element) => InvokeExtension(typeof(ModelSerializationExtensions), element, nameof(ModelSerializationExtensions.GetObject));
            public override ValueExpression GetTimeSpan(JsonElementExpression element, string? format) => InvokeExtension(typeof(ModelSerializationExtensions), element, nameof(ModelSerializationExtensions.GetTimeSpan), Snippets.Literal(format));
            public override MethodBodyStatement ThrowNonNullablePropertyIsNull(JsonPropertyExpression property)
                => new InvokeStaticMethodStatement(typeof(ModelSerializationExtensions), nameof(ModelSerializationExtensions.ThrowNonNullablePropertyIsNull), new[] { property }, CallAsExtension: true);
        }
    }
}
