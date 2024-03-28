// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using Azure.Core;

namespace AutoRest.CSharp.Common.Output.Expressions.Azure
{
    internal partial class AzureExtensibleSnippets
    {
        private class AzureJsonElementSnippets : JsonElementSnippets
        {
            public override ValueExpression GetBytesFromBase64(JsonElementExpression element, string? format) => InvokeExtension(typeof(JsonElementExtensions), element, nameof(JsonElementExtensions.GetBytesFromBase64), Snippets.Literal(format));
            public override ValueExpression GetChar(JsonElementExpression element) => InvokeExtension(typeof(JsonElementExtensions), element, nameof(JsonElementExtensions.GetChar));
            public override ValueExpression GetDateTimeOffset(JsonElementExpression element, string? format) => InvokeExtension(typeof(JsonElementExtensions), element, nameof(JsonElementExtensions.GetDateTimeOffset), Snippets.Literal(format));
            public override ValueExpression GetObject(JsonElementExpression element) => InvokeExtension(typeof(JsonElementExtensions), element, nameof(JsonElementExtensions.GetObject));
            public override ValueExpression GetTimeSpan(JsonElementExpression element, string? format) => InvokeExtension(typeof(JsonElementExtensions), element, nameof(JsonElementExtensions.GetTimeSpan), Snippets.Literal(format));

            public override MethodBodyStatement ThrowNonNullablePropertyIsNull(JsonPropertyExpression property)
                => new InvokeStaticMethodStatement(typeof(JsonElementExtensions), nameof(JsonElementExtensions.ThrowNonNullablePropertyIsNull), new[] { property }, CallAsExtension: true);
        }
    }
}
