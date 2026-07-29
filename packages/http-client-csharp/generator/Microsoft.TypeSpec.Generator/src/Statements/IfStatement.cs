// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class IfStatement : MethodBodyStatement
    {
        public ValueExpression Condition { get; private set; }
        public bool Inline { get; private set; }
        public bool AddBraces { get; private set; }

        public IfStatement(ValueExpression condition, bool inline = false, bool addBraces = true)
        {
            Condition = condition;
            Inline = inline;
            AddBraces = addBraces;
        }

        private List<MethodBodyStatement> _body = new();
        public MethodBodyStatement Body => _body;

        public void Add(MethodBodyStatement statement) => _body.Add(statement);

        internal override void Write(CodeWriter writer)
        {
            writer.AppendRaw("if (");
            Condition.Write(writer);

            if (Inline)
            {
                writer.AppendRaw(") ");
                using (writer.AmbientScope())
                {
                    Body.Write(writer);
                }
            }
            else
            {
                writer.WriteRawLine(")");
                using (AddBraces ? writer.Scope() : writer.AmbientScope())
                {
                    Body.Write(writer);
                }
            }
        }

        internal override MethodBodyStatement? Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var newStatement = visitor.VisitIfStatement(this, method);
            if (newStatement is not IfStatement newIfStatement)
            {
                return newStatement?.Accept(visitor, method);
            }

            var bodyStatements = new List<MethodBodyStatement>();
            foreach (var bodyStatement in newIfStatement.Body)
            {
                var updatedStatement = bodyStatement.Accept(visitor, method);
                if (updatedStatement != null)
                {
                    bodyStatements.Add(updatedStatement);
                }
            }
            newIfStatement._body = bodyStatements;

            return newIfStatement;
        }

        public void Update(
            ValueExpression? condition = null,
            bool? inline = null,
            bool? addBraces = null,
            MethodBodyStatement? body = null)
        {
            if (condition != null)
            {
                Condition = condition;
            }
            if (inline != null)
            {
                Inline = inline.Value;
            }
            if (addBraces != null)
            {
                AddBraces = addBraces.Value;
            }
            if (body != null)
            {
                _body.Clear();
                _body.Add(body);
            }
        }
    }
}
