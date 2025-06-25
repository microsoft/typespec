// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class SwitchCaseStatement : MethodBodyStatement
    {
        public IReadOnlyList<ValueExpression> Matches { get; private set; }
        public MethodBodyStatement Statement { get; private set; }

        public SwitchCaseStatement(IReadOnlyList<ValueExpression> matches, MethodBodyStatement statement)
        {
            Matches = matches;
            Statement = statement;
        }

        public SwitchCaseStatement(ValueExpression match, MethodBodyStatement statement) : this([match], statement) { }

        public static SwitchCaseStatement Default(MethodBodyStatement statement) => new(Array.Empty<ValueExpression>(), statement);

        internal override void Write(CodeWriter writer)
        {
            if (Matches.Any())
            {
                for (var i = 0; i < Matches.Count; i++)
                {
                    ValueExpression? match = Matches[i];
                    writer.AppendRaw("case ");
                    match.Write(writer);
                    if (i < Matches.Count - 1)
                    {
                        writer.WriteRawLine(":");
                    }
                }
            }
            else
            {
                writer.AppendRaw("default");
            }

            using var scope = writer.ScopeRaw(":", "", newLine: false);
            Statement.Write(writer);
        }

        internal override SwitchCaseStatement? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var updated = visitor.VisitSwitchCaseStatement(this, method);
            if (updated is null)
            {
                return null;
            }

            var updatedMatches = new List<ValueExpression>(updated.Matches.Count);
            foreach (var match in updated.Matches)
            {
                var updatedMatch = match.Accept(visitor, method);
                if (updatedMatch is not null)
                {
                    updatedMatches.Add(updatedMatch);
                }
            }
            updated.Matches = updatedMatches;
            updated.Statement = updated.Statement.Accept(visitor, method)!;

            return updated;
        }

        public void Update(
            IReadOnlyList<ValueExpression>? matches = null,
            MethodBodyStatement? statement = null)
        {
            if (matches != null)
            {
                Matches = matches;
            }
            if (statement != null)
            {
                Statement = statement;
            }
        }
    }
}
