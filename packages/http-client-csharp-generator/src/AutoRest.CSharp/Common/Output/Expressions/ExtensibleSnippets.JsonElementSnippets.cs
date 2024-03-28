// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions
{
    internal abstract partial class ExtensibleSnippets
    {
        internal abstract class JsonElementSnippets
        {
            public abstract ValueExpression GetBytesFromBase64(JsonElementExpression element, string? format);
            public abstract ValueExpression GetChar(JsonElementExpression element);
            public abstract ValueExpression GetDateTimeOffset(JsonElementExpression element, string? format);
            public abstract ValueExpression GetObject(JsonElementExpression element);
            public abstract ValueExpression GetTimeSpan(JsonElementExpression element, string? format);

            public abstract MethodBodyStatement ThrowNonNullablePropertyIsNull(JsonPropertyExpression property);
        }
    }
}
