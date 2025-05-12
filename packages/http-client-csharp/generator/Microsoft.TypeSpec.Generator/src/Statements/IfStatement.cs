// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;

namespace Microsoft.TypeSpec.Generator.Statements
{
    public sealed class IfStatement : MethodBodyStatement
    {
        public ValueExpression Condition { get; set; }
        public bool Inline { get; }
        public bool AddBraces { get; }

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

        internal override MethodBodyStatement Accept(LibraryVisitor visitor, MethodProvider methodProvider)
        {
            Condition = visitor.VisitExpression(Condition, this);
            var bodyStatements = new List<MethodBodyStatement>();
            foreach (var bodyStatement in _body)
            {
                var updatedStatement = bodyStatement.Accept(visitor, methodProvider);
                if (updatedStatement != null)
                {
                    bodyStatements.Add(updatedStatement);
                }
            }
            _body = bodyStatements;

            return this;
        }
    }
}
