// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Xml.Linq;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record XAttributeExpression(ValueExpression Untyped) : TypedValueExpression<XAttribute>(Untyped), ITypedValueExpressionFactory<XAttributeExpression>
    {
        public XNameExpression Name => new(Property(nameof(XAttribute.Name)));
        public StringExpression Value => new(Property(nameof(XAttribute.Value)));

        static XAttributeExpression ITypedValueExpressionFactory<XAttributeExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}
