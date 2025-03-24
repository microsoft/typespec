// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class MethodBodyStatements : MethodBodyStatement
    {
        public IReadOnlyList<MethodBodyStatement> Statements { get; }

        public MethodBodyStatements(IReadOnlyList<MethodBodyStatement> statements)
        {
            Statements = statements;
        }

        internal override void Write(CodeWriter writer)
        {
            foreach (var statement in Statements)
            {
                statement.Write(writer);
            }
        }
    }
}
