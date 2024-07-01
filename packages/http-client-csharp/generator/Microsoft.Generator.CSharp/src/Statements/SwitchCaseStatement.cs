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
    }
}
