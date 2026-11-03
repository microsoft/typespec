// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Expressions
{
    public sealed record CatchExpression : ValueExpression
    {
        private List<MethodBodyStatement> _body = [];
        public ValueExpression? Exception { get; }
        public MethodBodyStatement Body => _body;
        internal IReadOnlyList<MethodBodyStatement> SourceBody => _body;
        public CatchExpression(ValueExpression? exception, params MethodBodyStatement[] statements)
        {
            Exception = exception;
            foreach (var statement in statements)
            {
                _body.Add(statement);
            }
        }

        internal override void WriteCore(CodeWriter writer)
        {
            writer.AppendRaw("catch");
            if (Exception != null)
            {
                writer.AppendRaw(" (");
                Exception.Write(writer);
                writer.WriteRawLine(")");
            }

            using (writer.Scope())
            {
                foreach (var statement in Body)
                {
                    statement.Write(writer);
                }
            }
        }

        internal override CatchExpression Accept(LibraryVisitor visitor, MethodProvider method)
        {
            TouchSource();
            var updated = visitor.VisitCatchExpression(this, method);

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
            TouchSource();
            _body.Clear();
            _body.Add(body);
        }
    }
}
