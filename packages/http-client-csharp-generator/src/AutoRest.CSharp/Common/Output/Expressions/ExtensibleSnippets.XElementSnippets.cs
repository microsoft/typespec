// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions
{
    internal abstract partial class ExtensibleSnippets
    {
        internal abstract class XElementSnippets
        {
            public abstract ValueExpression GetBytesFromBase64Value(XElementExpression xElement, string? format);
            public abstract ValueExpression GetDateTimeOffsetValue(XElementExpression xElement, string? format);
            public abstract ValueExpression GetObjectValue(XElementExpression xElement, string? format);
            public abstract ValueExpression GetTimeSpanValue(XElementExpression xElement, string? format);
        }
    }
}
