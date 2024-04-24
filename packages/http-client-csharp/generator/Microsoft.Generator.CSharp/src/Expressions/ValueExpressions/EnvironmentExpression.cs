// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record EnvironmentExpression(ValueExpression Untyped) : TypedValueExpression(typeof(Environment), Untyped), ITypedValueExpressionFactory<EnvironmentExpression>
    {
        public static StringExpression NewLine() => new(new TypeReference(typeof(Environment)).Property(nameof(Environment.NewLine)));

        static EnvironmentExpression ITypedValueExpressionFactory<EnvironmentExpression>.Create(ValueExpression untyped)
            => new(untyped);
    }
}
