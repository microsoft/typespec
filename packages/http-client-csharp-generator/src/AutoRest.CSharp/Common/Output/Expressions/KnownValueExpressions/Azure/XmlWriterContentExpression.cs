// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using Azure.Core;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions.Azure
{
    internal sealed record XmlWriterContentExpression(ValueExpression Untyped) : TypedValueExpression<XmlWriterContent>(Untyped)
    {
        public XmlWriterExpression XmlWriter => new(Property(nameof(XmlWriterContent.XmlWriter)));
    }
}
