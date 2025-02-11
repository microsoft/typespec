// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Snippets
{
    public static class BoolSnippets
    {
        public static ScopedApi<bool> Or(this ScopedApi<bool> boolExpression, ValueExpression other) => new BinaryOperatorExpression("||", boolExpression, other).As<bool>();

        public static ScopedApi<bool> And(this ScopedApi<bool> boolExpression, ValueExpression other) => new BinaryOperatorExpression("&&", boolExpression, other).As<bool>();
    }
}
