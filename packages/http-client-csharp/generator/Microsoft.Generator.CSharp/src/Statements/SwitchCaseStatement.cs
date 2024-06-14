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
        public bool Inline { get; }
        public bool AddScope { get; }

        public SwitchCaseStatement(IReadOnlyList<ValueExpression> matches, MethodBodyStatement statement, bool inline = false, bool addScope = false)
        {
            Matches = matches;
            Statement = statement;
            Inline = inline;
            AddScope = addScope;
        }

        public SwitchCaseStatement(ValueExpression match, MethodBodyStatement statement, bool inline = false, bool addScope = false) : this(new[] { match }, statement, inline, addScope) { }

        public static SwitchCaseStatement Default(MethodBodyStatement statement, bool inline = false, bool addScope = false) => new(Array.Empty<ValueExpression>(), statement, inline, addScope);

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
