// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Tests
{
    internal record TestExpression : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw("Custom implementation");
        }
    }
}
