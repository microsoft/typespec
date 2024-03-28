// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using Azure.Core;

namespace AutoRest.CSharp.Common.Output.Expressions.Azure
{
    internal partial class AzureExtensibleSnippets
    {
        private class AzureXElementSnippets : XElementSnippets
        {
            public override ValueExpression GetBytesFromBase64Value(XElementExpression xElement, string? format)
                => InvokeExtension(typeof(XElementExtensions), xElement, nameof(XElementExtensions.GetBytesFromBase64Value), Snippets.Literal(format));
            public override ValueExpression GetDateTimeOffsetValue(XElementExpression xElement, string? format)
                => InvokeExtension(typeof(XElementExtensions), xElement, nameof(XElementExtensions.GetDateTimeOffsetValue), Snippets.Literal(format));
            public override ValueExpression GetObjectValue(XElementExpression xElement, string? format)
                => InvokeExtension(typeof(XElementExtensions), xElement, nameof(XElementExtensions.GetObjectValue), Snippets.Literal(format));
            public override ValueExpression GetTimeSpanValue(XElementExpression xElement, string? format)
                => InvokeExtension(typeof(XElementExtensions), xElement, nameof(XElementExtensions.GetTimeSpanValue), Snippets.Literal(format));
        }
    }
}
