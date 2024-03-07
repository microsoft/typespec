// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Xml.Linq;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;

namespace AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions
{
    internal sealed record XAttributeExpression(ValueExpression Untyped) : TypedValueExpression<XAttribute>(Untyped)
    {
        public XNameExpression Name => new(Property(nameof(XAttribute.Name)));
        public StringExpression Value => new(Property(nameof(XAttribute.Value)));
    }
}
