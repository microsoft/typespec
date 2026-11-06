// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class DoWhileStatement : MethodBodyStatement
    {
        public ValueExpression Condition { get; }

        public DoWhileStatement(ValueExpression condition)
        {
            Condition = condition;
        }

        private readonly List<MethodBodyStatement> _body = new();
        public MethodBodyStatement Body => _body;
        internal IReadOnlyList<MethodBodyStatement> SourceBody => _body;

        public void Add(MethodBodyStatement statement) { TouchSource(); _body.Add(statement); }

        internal override void WriteCore(CodeWriter writer)
        {
            writer.WriteRawLine("do");
            using (writer.Scope())
            {
                foreach (var statement in _body)
                {
                    statement.Write(writer);
                }
            }

            writer.AppendRaw("while (");
            Condition.Write(writer);
            writer.WriteRawLine(");");
        }
    }
}
