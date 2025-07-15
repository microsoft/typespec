// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record FinallyExpression : ValueExpression
    {
        private List<MethodBodyStatement> _body = [];
        public MethodBodyStatement Body => _body;

        public FinallyExpression(params MethodBodyStatement[] statements)
        {
            foreach (var statement in statements)
            {
                _body.Add(statement);
            }
        }

        internal override void Write(CodeWriter writer)
        {
            writer.WriteRawLine("finally");
            using (writer.Scope())
            {
                foreach (var statement in _body)
                {
                    statement.Write(writer);
                }
            }
        }

        internal override FinallyExpression Accept(LibraryVisitor visitor, MethodProvider method)
        {
            var updated = visitor.VisitFinallyExpression(this, method);

            var newBody = new List<MethodBodyStatement>(_body.Count);
            foreach (var statement in updated.Body)
            {
                var updatedStatement = statement.Accept(visitor, method);
                if (updatedStatement != null)
                {
                    newBody.Add(updatedStatement);
                }
            }
            updated._body = newBody;

            return updated;
        }

        public void Update(MethodBodyStatement body)
        {
            _body.Clear();
            _body.Add(body);
        }
    }
}
