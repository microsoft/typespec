// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Primitives
{
    public record ExpressionPropertyBody(ValueExpression Getter) : PropertyBody(false);
}
