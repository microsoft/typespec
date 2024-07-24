// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class ForStatement : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        public ValueExpression? IndexExpression { get; set; }
        public ValueExpression? Condition { get; set; }
        public ValueExpression? IncrementExpression { get; set; }

        public ForStatement(ValueExpression? indexExpression, ValueExpression? condition, ValueExpression? incrementExpression)
        {
            IndexExpression = indexExpression;
            Condition = condition;
            IncrementExpression = incrementExpression;
        }

        private readonly List<MethodBodyStatement> _body = new();
        public IReadOnlyList<MethodBodyStatement> Body => _body;

        public void Add(MethodBodyStatement statement) => _body.Add(statement);
        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();

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
    }
}
