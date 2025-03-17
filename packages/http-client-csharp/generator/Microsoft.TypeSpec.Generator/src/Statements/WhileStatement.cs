// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class WhileStatement : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        public ValueExpression Condition { get; }

        public WhileStatement(ValueExpression condition)
        {
            Condition = condition;
        }

        private readonly List<MethodBodyStatement> _body = new();
        public MethodBodyStatement Body => _body;

        public void Add(MethodBodyStatement statement) => _body.Add(statement);
        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw("while (");
            Condition.Write(writer);
            writer.WriteRawLine(")");
            using (writer.Scope())
            {
                Body.Write(writer);
            }
        }
    }
}
