// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class SwitchCaseStatement : MethodBodyStatement
    {
        public IReadOnlyList<ValueExpression> Matches { get; }
        public MethodBodyStatement Statement { get; }
        public bool AddBraces { get; }

        public SwitchCaseStatement(IReadOnlyList<ValueExpression> matches, MethodBodyStatement statement, bool addBraces = false)
        {
            Matches = matches;
            Statement = statement;
            AddBraces = addBraces;
        }

        public SwitchCaseStatement(ValueExpression match, MethodBodyStatement statement, bool addBraces = false) : this([match], statement, addBraces) { }

        public static SwitchCaseStatement Default(MethodBodyStatement statement, bool addBraces = false) => new(Array.Empty<ValueExpression>(), statement, addBraces);

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

            if (AddBraces)
            {
                writer.AppendRaw(": ");
                writer.WriteLine();
                using (writer.Scope())
                {
                    Statement.Write(writer);
                }
            }
            else
            {
                using (writer.ScopeRaw(":", "", false))
                {
                    Statement.Write(writer);
                }
            }
        }
    }
}
