// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class CatchStatement : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        private readonly List<MethodBodyStatement> _body = [];
        public ValueExpression? Exception { get; }
        public IReadOnlyList<MethodBodyStatement> Body => _body;
        public CatchStatement(ValueExpression? exception)
        {
            Exception = exception;
        }

        internal override void Write(CodeWriter writer)
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

        public CatchStatement Add(MethodBodyStatement statement)
        {
            _body.Add(statement);
            return this;
        }

        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();

        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();
    }
}
