// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class WhileStatement : MethodBodyStatement
    {
        public ValueExpression Condition { get; }

        public WhileStatement(ValueExpression condition)
        {
            Condition = condition;
        }

        private readonly List<MethodBodyStatement> _body = new();
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

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider methodProvider)
        {
            var updated = visitor.VisitWhileStatement(this, methodProvider);

            if (updated is not WhileStatement updatedWhile)
            {
                return updated?.Accept(visitor, methodProvider);
            }

            var newCondition = updatedWhile.Condition.Accept(visitor, updatedWhile);
            bool hasChanges = !ReferenceEquals(newCondition, Condition);

            var newBody = new List<MethodBodyStatement>(_body.Count);

            foreach (var statement in updatedWhile.Body)
            {
                var updatedStatement = statement.Accept(visitor, methodProvider);
                if (updatedStatement != null)
                {
                    newBody.Add(updatedStatement);
                    if (!ReferenceEquals(updatedStatement, statement))
                    {
                        hasChanges = true;
                    }
                }
            }
            if (!hasChanges && newBody.Count == _body.Count)
            {
                return updated;
            }

            return new WhileStatement(newCondition!)
            {
                newBody
            };
        }
    }
}
