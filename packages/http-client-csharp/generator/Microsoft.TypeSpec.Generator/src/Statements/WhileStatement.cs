// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class WhileStatement : MethodBodyStatement
    {
        public ValueExpression Condition { get; private set; }

        public WhileStatement(ValueExpression condition)
        {
            Condition = condition;
        }

        private List<MethodBodyStatement> _body = new();
        public MethodBodyStatement Body => _body;

        public void Add(MethodBodyStatement statement) => _body.Add(statement);

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

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var updated = visitor.VisitWhileStatement(this, method);

            if (updated is not WhileStatement updatedWhile)
            {
                return updated?.Accept(visitor, method);
            }

            var newCondition = updatedWhile.Condition.Accept(visitor, method);

            var newBody = new List<MethodBodyStatement>(_body.Count);

            foreach (var statement in updatedWhile.Body)
            {
                var updatedStatement = statement.Accept(visitor, method);
                if (updatedStatement != null)
                {
                    newBody.Add(updatedStatement);
                }
            }

            updatedWhile._body = newBody;
            updatedWhile.Condition = newCondition!;
            return updatedWhile;
        }

        public void Update(ValueExpression? condition = null, MethodBodyStatement? body = null)
        {
            if (condition != null)
            {
                Condition = condition;
            }

            if (body != null)
            {
                _body.Clear();
                _body.Add(body);
            }
        }
    }
}
