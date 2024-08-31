// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using TypeSpec.Generator.Expressions;

namespace TypeSpec.Generator.Tests
{
    internal record TestExpression : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw("Custom implementation");
        }
    }
}
