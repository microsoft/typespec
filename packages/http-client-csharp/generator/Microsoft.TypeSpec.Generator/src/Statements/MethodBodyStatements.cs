// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class MethodBodyStatements : MethodBodyStatement
    {
        public IReadOnlyList<MethodBodyStatement> Statements { get; private set; }

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

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider methodProvider)
        {
            var replaced = visitor.VisitStatements(this, methodProvider);
            if (replaced is not MethodBodyStatements updatedStatements)
            {
                return replaced?.Accept(visitor, methodProvider);
            }

            var newStatements = new List<MethodBodyStatement>(updatedStatements.Statements.Count);
            foreach (var statement in updatedStatements.Statements)
            {
                var updated = statement.Accept(visitor, methodProvider);
                if (updated != null)
                {
                    newStatements.Add(updated);
                }
            }

            updatedStatements.Statements = newStatements;
            return updatedStatements;
        }
    }
}
