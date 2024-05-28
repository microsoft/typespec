// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed record SwitchCaseStatement(IReadOnlyList<ValueExpression> Match, MethodBodyStatement Statement, bool Inline = false, bool AddScope = false) : MethodBodyStatement
    {
        public SwitchCaseStatement(ValueExpression match, MethodBodyStatement statement, bool inline = false, bool addScope = false) : this(new[] { match }, statement, inline, addScope) { }

        public static SwitchCaseStatement Default(MethodBodyStatement statement, bool inline = false, bool addScope = false) => new(Array.Empty<ValueExpression>(), statement, inline, addScope);

        internal override void Write(CodeWriter writer)
        {
            if (Match.Any())
            {
                for (var i = 0; i < Match.Count; i++)
                {
                    ValueExpression? match = Match[i];
                    writer.AppendRaw("case ");
                    match.Write(writer);
                    if (i < Match.Count - 1)
                    {
                        writer.WriteRawLine(":");
                    }
                }
            }
            else
            {
                writer.AppendRaw("default");
            }

            writer.AppendRaw(": ");
            if (!Inline)
            {
                writer.WriteLine();
            }

            if (AddScope)
            {
                using (writer.Scope())
                {
                    Statement.Write(writer);
                }
            }
            else
            {
                Statement.Write(writer);
            }
        }
    }
}
