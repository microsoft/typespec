// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Statements
{
    public record MethodBodyStatements(IReadOnlyList<MethodBodyStatement> Statements) : MethodBodyStatement
    {
        internal override void Write(CodeWriter writer)
        {
            foreach (var statement in Statements)
            {
                statement.Write(writer);
            }
        }
    }
}
