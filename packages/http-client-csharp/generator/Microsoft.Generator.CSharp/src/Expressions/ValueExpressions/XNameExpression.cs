// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Xml.Linq;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record XNameExpression(ValueExpression Untyped) : TypedValueExpression<XName>(Untyped), ITypedValueExpressionFactory<XNameExpression>
    {
        public StringExpression LocalName => new(Property(nameof(XName.LocalName)));

        static XNameExpression ITypedValueExpressionFactory<XNameExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}
