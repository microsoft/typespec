// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.Expressions;

namespace TypeSpec.Generator.Primitives
{
    public record ExpressionPropertyBody(ValueExpression Getter, ValueExpression? Setter = null) : PropertyBody(Setter is not null);
}
