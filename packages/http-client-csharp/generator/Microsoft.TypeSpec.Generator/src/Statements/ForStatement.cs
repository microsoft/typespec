// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class ForStatement : MethodBodyStatement
    {
        public ValueExpression? IndexExpression { get; private set; }
        public ValueExpression? Condition { get; private set; }
        public ValueExpression? IncrementExpression { get; private set; }

        public ForStatement(ValueExpression? indexExpression, ValueExpression? condition, ValueExpression? incrementExpression)
        {
            IndexExpression = indexExpression;
            Condition = condition;
            IncrementExpression = incrementExpression;
        }

        private List<MethodBodyStatement> _body = new();
        public IReadOnlyList<MethodBodyStatement> Body => _body;

        public void Add(MethodBodyStatement statement) => _body.Add(statement);

        internal override void Write(CodeWriter writer)
        {
            using (writer.AmbientScope())
            {
                writer.AppendRaw("for (");
                IndexExpression?.Write(writer);
                writer.AppendRaw("; ");
                Condition?.Write(writer);
                writer.AppendRaw("; ");
                IncrementExpression?.Write(writer);
                writer.WriteRawLine(")");
                using (writer.Scope())
                {
                    foreach (var bodyStatement in Body)
                    {
                        bodyStatement.Write(writer);
                    }
                }
            }
        }

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var updated = visitor.VisitForStatement(this, method);
            if (updated is not ForStatement updatedForStatement)
            {
                return updated?.Accept(visitor, method);
            }

            updatedForStatement.IndexExpression = updatedForStatement.IndexExpression?.Accept(visitor, method);
            updatedForStatement.Condition = updatedForStatement.Condition?.Accept(visitor, method);
            updatedForStatement.IncrementExpression = updatedForStatement.IncrementExpression?.Accept(visitor, method);
            var newBody = new List<MethodBodyStatement>(_body.Count);
            foreach (var statement in updatedForStatement.Body)
            {
                var updatedStatement = statement.Accept(visitor, method);
                if (updatedStatement != null)
                {
                    newBody.Add(updatedStatement);
                }
            }
            updatedForStatement._body = newBody;

            return updatedForStatement;
        }

        public void Update(
            ValueExpression? indexExpression = null,
            ValueExpression? condition = null,
            ValueExpression? incrementExpression = null)
        {
            if (indexExpression != null)
            {
                IndexExpression = indexExpression;
            }
            if (condition != null)
            {
                Condition = condition;
            }
            if (incrementExpression != null)
            {
                IncrementExpression = incrementExpression;
            }
        }
    }
}
