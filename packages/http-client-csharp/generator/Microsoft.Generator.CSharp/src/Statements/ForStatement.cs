// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record ForStatement(AssignmentExpression? IndexerAssignment, BoolExpression? Condition, ValueExpression? IncrementExpression) : MethodBodyStatement, IEnumerable<MethodBodyStatement>
    {
        private readonly List<MethodBodyStatement> _body = new();
        public IReadOnlyList<MethodBodyStatement> Body => _body;

        public void Add(MethodBodyStatement statement) => _body.Add(statement);
        public IEnumerator<MethodBodyStatement> GetEnumerator() => _body.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => ((IEnumerable)_body).GetEnumerator();

        public override void Write(CodeWriter writer)
        {
            using (writer.AmbientScope())
            {
                writer.AppendRaw("for (");
                IndexerAssignment?.Write(writer);
                writer.AppendRaw("; ");
                Condition?.Write(writer);
                writer.AppendRaw("; ");
                IncrementExpression?.Write(writer);
                writer.WriteRawLine(")");

                writer.WriteRawLine("{");
                writer.WriteRawLine("");
                foreach (var bodyStatement in Body)
                {
                    bodyStatement.Write(writer);
                }
                writer.WriteRawLine("}");
            }
        }
    }
}
