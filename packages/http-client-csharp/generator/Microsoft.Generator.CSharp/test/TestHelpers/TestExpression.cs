// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Tests
{
    internal record TestExpression : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw("Custom implementation");
        }
    }
}
